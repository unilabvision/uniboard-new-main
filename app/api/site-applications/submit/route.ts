import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { siteApplicationsDb, computeAttachmentExpiresAt } from '@/app/lib/siteApplications';
import {
  extractContactFromSubmission,
  validateSubmissionFields,
} from '@/app/lib/siteApplications/validation';
import {
  getApplicationTypeSlug,
  resolveActiveForm,
} from '@/app/lib/siteApplications/resolveForm';
import { inferFormType } from '@/app/lib/siteApplications/formTypes';
import {
  getSelectedPackageFromSubmission,
  parsePackageSettingsFromForm,
  toPublicPackages,
  type RegistrationPackageId,
} from '@/app/lib/siteApplications/packages';
import type { SiteApplicationFormField } from '@/app/types/siteApplicationForms';
import { sendSiteApplicationApprovalEmail } from '@/app/_services/siteApplicationApprovalEmail';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) {
    throw new Error('Supabase configuration missing');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.honeypot?.trim()) {
      return NextResponse.json({ success: true, submissionId: 'ok' });
    }

    const formSlug = String(body.formSlug || '').trim();
    const eventSlug = String(body.eventSlug || '').trim();
    const locale = body.locale === 'en' ? 'en' : 'tr';
    const fieldValues = (body.fields || {}) as Record<string, unknown>;

    if (!formSlug && !eventSlug) {
      return NextResponse.json({ error: 'Form slug or event slug required' }, { status: 400 });
    }

    const supabase = getSupabase();
    const resolved = await resolveActiveForm(supabase, { locale, formSlug, eventSlug });

    if (!resolved) {
      return NextResponse.json({ error: 'Form not found or inactive' }, { status: 404 });
    }

    const { form, event } = resolved;

    const { data: fields, error: fieldsError } = await supabase
      .from(siteApplicationsDb.formFields)
      .select('*')
      .eq('form_id', form.id)
      .order('order_index', { ascending: true });

    if (fieldsError || !fields?.length) {
      return NextResponse.json({ error: 'Form configuration incomplete' }, { status: 400 });
    }

    const typedFields = fields as SiteApplicationFormField[];
    const { valid, errors, normalized } = validateSubmissionFields(typedFields, fieldValues);

    if (!valid) {
      return NextResponse.json({ error: 'Validation failed', fieldErrors: errors }, { status: 400 });
    }

    const formType = form.form_type ?? inferFormType(form);
    const isEventApplication = formType === 'event' || Boolean(event) || Boolean(form.event_id);
    const registrationTier = (
      body.registrationTier === 'certificate' ? 'certificate' : 'free'
    ) as RegistrationPackageId;
    const packageSettings = parsePackageSettingsFromForm(form);
    const publicPackages =
      formType === 'event' ? toPublicPackages(packageSettings, locale) : [];
    const selectedPackage = getSelectedPackageFromSubmission(publicPackages, registrationTier);

    if (registrationTier === 'certificate') {
      if (formType !== 'event' || !packageSettings.certificate_enabled) {
        return NextResponse.json({ error: 'Certificate package is not available' }, { status: 400 });
      }
    }

    const attachmentStoragePath = body.attachmentStoragePath?.trim() || null;
    const attachmentFileName = body.attachmentFileName?.trim() || null;
    const attachmentMimeType = body.attachmentMimeType?.trim() || null;
    const attachmentFileSize = body.attachmentFileSize
      ? Number(body.attachmentFileSize)
      : null;

    if (attachmentStoragePath && !form.allows_attachment) {
      return NextResponse.json({ error: 'Attachments not allowed' }, { status: 400 });
    }

    if (attachmentStoragePath && (!attachmentFileName || !attachmentFileSize)) {
      return NextResponse.json({ error: 'Incomplete attachment metadata' }, { status: 400 });
    }

    const contact = extractContactFromSubmission(typedFields, normalized);
    const applicationType = getApplicationTypeSlug(form, locale, event);
    const requiresPayment =
      formType === 'event' &&
      selectedPackage.id === 'certificate' &&
      selectedPackage.price > 0;

    // Events: always auto-accept (no admin review). Certificate fee is tracked via payment_status.
    // Team: stays pending for manual review.
    const initialStatus = isEventApplication ? 'accepted' : 'pending';

    const eventName =
      event?.title ||
      (typeof normalized.event_name === 'string' ? normalized.event_name : null);

    const row = {
      form_id: form.id,
      event_id: event?.id || form.event_id || null,
      application_type: applicationType,
      first_name: contact.firstName,
      last_name: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      message: typeof normalized.message === 'string' ? normalized.message : null,
      motivation: typeof normalized.motivation === 'string' ? normalized.motivation : null,
      event_name: eventName,
      event_date: typeof normalized.event_date === 'string' ? normalized.event_date : null,
      participant_count:
        typeof normalized.participant_count === 'number' ? normalized.participant_count : null,
      organization: typeof normalized.organization === 'string' ? normalized.organization : null,
      role_interest: typeof normalized.role_interest === 'string' ? normalized.role_interest : null,
      experience: typeof normalized.experience === 'string' ? normalized.experience : null,
      portfolio_url: typeof normalized.portfolio_url === 'string' ? normalized.portfolio_url : null,
      locale,
      source: isEventApplication ? 'event_website' : 'website',
      user_agent: request.headers.get('user-agent'),
      status: initialStatus,
      submission_data: {
        ...normalized,
        ...(event ? { event_slug: event.slug, event_title: event.title } : {}),
        ...(formType === 'event'
          ? {
              registration_tier: selectedPackage.id,
              package_title: selectedPackage.title,
              package_price: selectedPackage.price,
              package_currency: selectedPackage.currency,
              payment_status:
                selectedPackage.id === 'certificate' && selectedPackage.price > 0
                  ? 'pending'
                  : 'none',
            }
          : {}),
      },
      attachment_file_name: attachmentFileName,
      attachment_storage_path: attachmentStoragePath,
      attachment_mime_type: attachmentMimeType,
      attachment_file_size: attachmentFileSize,
      attachment_expires_at: attachmentStoragePath ? computeAttachmentExpiresAt() : null,
    };

    const { data, error } = await supabase
      .from(siteApplicationsDb.applications)
      .insert(row)
      .select('id')
      .single();

    if (error) {
      console.error('Site application insert error:', error);
      return NextResponse.json({ error: 'Failed to save application' }, { status: 500 });
    }

    if (isEventApplication && initialStatus === 'accepted') {
      await supabase.from(siteApplicationsDb.statusHistory).insert({
        application_id: data.id,
        old_status: null,
        new_status: 'accepted',
        changed_by: null,
        changed_by_email: 'system:event-auto-accept',
      });

      const emailResult = await sendSiteApplicationApprovalEmail({
        to: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        locale,
        eventName,
        isEvent: true,
      });
      if (!emailResult.success) {
        console.error('Event registration email failed:', emailResult.error);
      }
    }

    return NextResponse.json({
      success: true,
      submissionId: data.id,
      status: initialStatus,
      requiresPayment,
      payment: {
        amount: selectedPackage.price,
        currency: selectedPackage.currency,
        tier: selectedPackage.id,
        packageTitle: selectedPackage.title,
      },
    });
  } catch (err) {
    console.error('Form submit error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
