import { NextRequest, NextResponse } from 'next/server';
import { requireLmsContentAdmin } from '@/app/api/lms/_helpers';
import { generatePackageSlug } from '@/app/lib/lms/courseUtils';
import { parsePrice } from '@/app/lib/lms/parsePrice';

type RouteContext = { params: Promise<{ id: string }> };

type DatabaseError = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
};

const PACKAGE_SLUG_CONSTRAINT = 'myuni_course_tiers_course_id_slug_key';

function isPackageSlugConflict(error: DatabaseError | null): boolean {
  if (!error || error.code !== '23505') return false;

  const errorText = `${error.message || ''} ${error.details || ''}`;
  return (
    errorText.includes(PACKAGE_SLUG_CONSTRAINT) ||
    /\(course_id,\s*slug\)/i.test(errorText)
  );
}

function isMissingOptionalColumnError(error: DatabaseError | null): boolean {
  if (!error) return false;
  if (error.code === 'PGRST204' || error.code === '42703') return true;

  return /column .+ does not exist|could not find .+ column|schema cache/i.test(
    error.message || ''
  );
}

function findAvailableSlug(baseSlug: string, usedSlugs: Set<string>): string {
  if (!usedSlugs.has(baseSlug)) return baseSlug;

  let suffix = 2;
  while (usedSlugs.has(`${baseSlug}-${suffix}`)) suffix += 1;
  return `${baseSlug}-${suffix}`;
}

function parseSessionLabels(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function mapPackageRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    course_id: String(row.course_id),
    title: String(row.title || 'Paket'),
    slug: row.slug != null ? String(row.slug) : null,
    description: row.description != null ? String(row.description) : null,
    price: Number(row.price) || 0,
    original_price:
      row.original_price != null && row.original_price !== ''
        ? Number(row.original_price)
        : null,
    early_bird_price:
      row.early_bird_price != null && row.early_bird_price !== ''
        ? Number(row.early_bird_price)
        : null,
    early_bird_deadline:
      row.early_bird_deadline != null ? String(row.early_bird_deadline) : null,
    is_full_course: row.is_full_course === true,
    includes_qa: row.includes_qa === true,
    is_registration_open: row.is_registration_open !== false,
    order_index: Number(row.order_index) || 0,
    is_active: row.is_active !== false,
    session_labels: Array.isArray(row.session_labels)
      ? (row.session_labels as unknown[]).map((s) => String(s))
      : [],
  };
}

/**
 * GET – All packages (tiers) for a course including inactive (admin).
 * Query: ?activeOnly=true to match public-site listing.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id: courseId } = await context.params;
  const activeOnly = request.nextUrl.searchParams.get('activeOnly') === 'true';

  let query = authResult.supabase
    .from('myuni_course_tiers')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('LMS packages GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Paketler alınamadı' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    packages: (data || []).map((row) => mapPackageRow(row as Record<string, unknown>)),
  });
}

/**
 * POST – Create a sales package (tier) shown on myunilab.net course page.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id: courseId } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { data: course, error: courseError } = await authResult.supabase
    .from('myuni_courses')
    .select('id')
    .eq('id', courseId)
    .maybeSingle();

  if (courseError) {
    return NextResponse.json({ error: courseError.message }, { status: 500 });
  }
  if (!course) {
    return NextResponse.json({ error: 'Kurs bulunamadı' }, { status: 404 });
  }

  const title = String(body.title || '').trim();
  if (!title) {
    return NextResponse.json({ error: 'Paket adı gerekli' }, { status: 400 });
  }

  const price = parsePrice(body.price);
  const originalPrice = parsePrice(body.original_price);
  const earlyBirdPrice = parsePrice(body.early_bird_price);
  if (price === 'invalid' || originalPrice === 'invalid' || earlyBirdPrice === 'invalid') {
    return NextResponse.json({ error: 'Geçersiz fiyat değeri' }, { status: 400 });
  }

  const earlyBirdDeadlineRaw = String(body.early_bird_deadline || '').trim();
  const earlyBirdDeadline = earlyBirdDeadlineRaw ? new Date(earlyBirdDeadlineRaw) : null;
  if (earlyBirdDeadline && Number.isNaN(earlyBirdDeadline.getTime())) {
    return NextResponse.json({ error: 'Geçersiz erken kayıt tarihi' }, { status: 400 });
  }

  const { data: existing } = await authResult.supabase
    .from('myuni_course_tiers')
    .select('order_index')
    .eq('course_id', courseId)
    .order('order_index', { ascending: false })
    .limit(1);

  const nextOrder =
    existing && existing.length > 0 ? Number(existing[0].order_index || 0) + 1 : 0;

  const slugRaw = String(body.slug || '').trim();
  const baseSlug = slugRaw || generatePackageSlug(title);

  const createPackage = async (slug: string) => {
    const insertRow: Record<string, unknown> = {
      course_id: courseId,
      title,
      slug,
      description: body.description != null ? String(body.description).trim() || null : null,
      price: price ?? 0,
      original_price: originalPrice,
      early_bird_price: earlyBirdPrice,
      early_bird_deadline: earlyBirdDeadline?.toISOString() ?? null,
      is_full_course: body.is_full_course === true,
      includes_qa: body.includes_qa === true,
      is_registration_open: body.is_registration_open !== false,
      is_active: body.is_active !== false,
      order_index:
        body.order_index != null && Number.isFinite(Number(body.order_index))
          ? Number(body.order_index)
          : nextOrder,
      session_labels: parseSessionLabels(body.session_labels),
    };

    const result = await authResult.supabase
      .from('myuni_course_tiers')
      .insert([insertRow])
      .select('*')
      .single();

    if (!isMissingOptionalColumnError(result.error)) return result;

    const leanRow = {
      course_id: courseId,
      title,
      slug,
      price: price ?? 0,
      original_price: originalPrice,
      is_full_course: body.is_full_course === true,
      is_active: body.is_active !== false,
      order_index: insertRow.order_index,
    };
    return authResult.supabase
      .from('myuni_course_tiers')
      .insert([leanRow])
      .select('*')
      .single();
  };

  let slug = baseSlug;
  if (!slugRaw) {
    const { data: slugRows, error: slugError } = await authResult.supabase
      .from('myuni_course_tiers')
      .select('slug')
      .eq('course_id', courseId);

    if (slugError) {
      console.error('LMS packages POST slug lookup error:', slugError);
      return NextResponse.json({ error: 'Paket kısa adı oluşturulamadı' }, { status: 500 });
    }

    const usedSlugs = new Set((slugRows || []).map((row) => String(row.slug || '')));
    slug = findAvailableSlug(baseSlug, usedSlugs);
  }

  let result = await createPackage(slug);

  // A concurrent request may claim the generated slug after the lookup.
  if (!slugRaw && isPackageSlugConflict(result.error)) {
    slug = `${baseSlug}-${Date.now().toString(36)}`;
    result = await createPackage(slug);
  }

  if (result.error || !result.data) {
    if (isPackageSlugConflict(result.error)) {
      return NextResponse.json(
        { error: 'Bu kısa ad bu eğitimde başka bir paket tarafından kullanılıyor' },
        { status: 409 }
      );
    }

    console.error('LMS packages POST error:', result.error);
    return NextResponse.json(
      { error: result.error?.message || 'Paket oluşturulamadı' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: true, package: mapPackageRow(result.data as Record<string, unknown>) },
    { status: 201 }
  );
}

/**
 * PATCH – Update one or more packages (full fields, not only prices).
 * Body: { updates: [{ id, title?, slug?, ... }] }
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id: courseId } = await context.params;

  let body: { updates?: Array<Record<string, unknown>> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const updates = Array.isArray(body.updates) ? body.updates : [];
  if (updates.length === 0) {
    return NextResponse.json({ error: 'Güncellenecek paket yok' }, { status: 400 });
  }

  const results = [];

  for (const row of updates) {
    const tierId = String(row.id || '').trim();
    if (!tierId) {
      return NextResponse.json({ error: 'Paket kimliği gerekli' }, { status: 400 });
    }

    const { data: tier, error: tierError } = await authResult.supabase
      .from('myuni_course_tiers')
      .select('id, course_id')
      .eq('id', tierId)
      .maybeSingle();

    if (tierError) {
      return NextResponse.json({ error: tierError.message }, { status: 500 });
    }
    if (!tier || String(tier.course_id) !== courseId) {
      return NextResponse.json({ error: 'Paket bu kursa ait değil' }, { status: 404 });
    }

    const patch: Record<string, unknown> = {};

    if (row.title !== undefined) {
      const title = String(row.title).trim();
      if (!title) {
        return NextResponse.json({ error: 'Paket adı boş olamaz' }, { status: 400 });
      }
      patch.title = title;
    }
    if (row.slug !== undefined) {
      const slug = String(row.slug).trim();
      patch.slug = slug || generatePackageSlug(String(row.title || 'paket'));
    }
    if (row.description !== undefined) {
      patch.description =
        row.description === null || row.description === ''
          ? null
          : String(row.description);
    }
    if (row.price !== undefined) {
      const price = parsePrice(row.price);
      if (price === 'invalid') {
        return NextResponse.json({ error: 'Geçersiz fiyat değeri' }, { status: 400 });
      }
      patch.price = price ?? 0;
    }
    if (row.original_price !== undefined) {
      const originalPrice = parsePrice(row.original_price);
      if (originalPrice === 'invalid') {
        return NextResponse.json({ error: 'Geçersiz fiyat değeri' }, { status: 400 });
      }
      patch.original_price = originalPrice;
    }
    if (row.early_bird_price !== undefined) {
      const earlyBirdPrice = parsePrice(row.early_bird_price);
      if (earlyBirdPrice === 'invalid') {
        return NextResponse.json({ error: 'Geçersiz erken kayıt fiyatı' }, { status: 400 });
      }
      patch.early_bird_price = earlyBirdPrice;
    }
    if (row.early_bird_deadline !== undefined) {
      if (row.early_bird_deadline === null || row.early_bird_deadline === '') {
        patch.early_bird_deadline = null;
      } else {
        const d = new Date(String(row.early_bird_deadline));
        if (Number.isNaN(d.getTime())) {
          return NextResponse.json({ error: 'Geçersiz erken kayıt tarihi' }, { status: 400 });
        }
        patch.early_bird_deadline = d.toISOString();
      }
    }
    if (row.is_full_course !== undefined) patch.is_full_course = Boolean(row.is_full_course);
    if (row.includes_qa !== undefined) patch.includes_qa = Boolean(row.includes_qa);
    if (row.is_registration_open !== undefined) {
      patch.is_registration_open = Boolean(row.is_registration_open);
    }
    if (row.is_active !== undefined) patch.is_active = Boolean(row.is_active);
    if (row.order_index !== undefined) {
      const order = Number(row.order_index);
      if (!Number.isFinite(order)) {
        return NextResponse.json({ error: 'Geçersiz sıra' }, { status: 400 });
      }
      patch.order_index = order;
    }
    if (row.session_labels !== undefined) {
      patch.session_labels = parseSessionLabels(row.session_labels);
    }

    if (Object.keys(patch).length === 0) {
      continue;
    }

    const { data, error: updateError } = await authResult.supabase
      .from('myuni_course_tiers')
      .update(patch)
      .eq('id', tierId)
      .select('*')
      .single();

    if (updateError) {
      if (isPackageSlugConflict(updateError)) {
        return NextResponse.json(
          { error: 'Bu kısa ad bu eğitimde başka bir paket tarafından kullanılıyor' },
          { status: 409 }
        );
      }

      if (!isMissingOptionalColumnError(updateError)) {
        console.error('LMS packages PATCH error:', updateError);
        return NextResponse.json(
          { error: updateError.message || 'Paket güncellenemedi' },
          { status: 500 }
        );
      }

      // Older schemas may not contain the optional package columns yet.
      const leanPatch = { ...patch };
      delete leanPatch.description;
      delete leanPatch.early_bird_price;
      delete leanPatch.early_bird_deadline;
      delete leanPatch.includes_qa;
      delete leanPatch.is_registration_open;
      delete leanPatch.session_labels;
      const retry = await authResult.supabase
        .from('myuni_course_tiers')
        .update(leanPatch)
        .eq('id', tierId)
        .select('*')
        .single();
      if (retry.error) {
        if (isPackageSlugConflict(retry.error)) {
          return NextResponse.json(
            { error: 'Bu kısa ad bu eğitimde başka bir paket tarafından kullanılıyor' },
            { status: 409 }
          );
        }
        console.error('LMS packages PATCH error:', retry.error);
        return NextResponse.json(
          { error: retry.error.message || 'Paket güncellenemedi' },
          { status: 500 }
        );
      }
      results.push(mapPackageRow(retry.data as Record<string, unknown>));
      continue;
    }

    results.push(mapPackageRow(data as Record<string, unknown>));
  }

  return NextResponse.json({ success: true, packages: results });
}

/**
 * DELETE – Permanently remove a package (?id=tierId).
 * Clears tier session links and unsets enrollments.tier_id for this package.
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id: courseId } = await context.params;
  const tierId = request.nextUrl.searchParams.get('id')?.trim();
  if (!tierId) {
    return NextResponse.json({ error: 'Paket kimliği gerekli' }, { status: 400 });
  }

  const { data: tier, error: tierError } = await authResult.supabase
    .from('myuni_course_tiers')
    .select('id, course_id')
    .eq('id', tierId)
    .maybeSingle();

  if (tierError) {
    return NextResponse.json({ error: tierError.message }, { status: 500 });
  }
  if (!tier || String(tier.course_id) !== courseId) {
    return NextResponse.json({ error: 'Paket bu kursa ait değil' }, { status: 404 });
  }

  // Remove session links first (FK)
  const { error: sessionsError } = await authResult.supabase
    .from('myuni_tier_sessions')
    .delete()
    .eq('tier_id', tierId);
  if (sessionsError) {
    console.warn('LMS packages DELETE tier_sessions:', sessionsError.message);
  }

  // Unlink enrollments so FK does not block delete
  const { error: enrollError } = await authResult.supabase
    .from('myuni_enrollments')
    .update({ tier_id: null })
    .eq('tier_id', tierId);
  if (enrollError) {
    console.warn('LMS packages DELETE enrollments unlink:', enrollError.message);
  }

  const { error } = await authResult.supabase
    .from('myuni_course_tiers')
    .delete()
    .eq('id', tierId);

  if (error) {
    console.error('LMS packages DELETE error:', error);
    // Fallback: soft-deactivate if hard delete blocked by remaining FKs
    const { error: softError } = await authResult.supabase
      .from('myuni_course_tiers')
      .update({ is_active: false })
      .eq('id', tierId);
    if (softError) {
      return NextResponse.json(
        { error: error.message || 'Paket silinemedi' },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      softDeleted: true,
      warning: 'Paket ilişkili kayıtlar nedeniyle tamamen silinemedi; sitede pasifleştirildi.',
    });
  }

  return NextResponse.json({ success: true });
}
