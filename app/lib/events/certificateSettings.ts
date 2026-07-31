import {
  normalizePackageSettings,
  type EventCertificatePackageSettings,
} from '@/app/lib/siteApplications/packages';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';
import type { SupabaseClient } from '@supabase/supabase-js';

export type EventCertificateDeliverySettings = {
  template_id: number | null;
  certificate_description: string | null;
  certificate_auto_issue: boolean;
  certificate_delay_minutes: number;
  form_id: string | null;
  package_settings: EventCertificatePackageSettings;
};

/**
 * Etkinliğin sertifika gönderim ayarlarını okur.
 * Otomatik gönderim / bekleme süresi önce event sütunlarından,
 * yoksa bağlı başvuru formunun package_settings JSON'undan gelir.
 */
export async function loadEventCertificateSettings(
  supabase: SupabaseClient,
  eventId: string
): Promise<EventCertificateDeliverySettings> {
  // Yeni sütunlar henüz yoksa temel alanlarla devam et
  let event: {
    id?: string;
    template_id?: unknown;
    certificate_description?: unknown;
    certificate_auto_issue?: unknown;
    certificate_delay_minutes?: unknown;
  } | null = null;

  const fullSelect = await supabase
    .from('myuni_events')
    .select(
      'id, template_id, certificate_description, certificate_auto_issue, certificate_delay_minutes'
    )
    .eq('id', eventId)
    .maybeSingle();

  if (fullSelect.error && /certificate_auto_issue|certificate_delay_minutes|PGRST/i.test(fullSelect.error.message)) {
    const basic = await supabase
      .from('myuni_events')
      .select('id, template_id, certificate_description')
      .eq('id', eventId)
      .maybeSingle();
    if (basic.error) throw new Error(basic.error.message);
    event = basic.data;
  } else if (fullSelect.error) {
    throw new Error(fullSelect.error.message);
  } else {
    event = fullSelect.data;
  }

  const { data: form } = await supabase
    .from(siteApplicationsDb.forms)
    .select('id, package_settings')
    .eq('event_id', eventId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const packageSettings = normalizePackageSettings(form?.package_settings);

  const templateRaw = event?.template_id;
  const templateId =
    templateRaw != null && String(templateRaw).trim() !== ''
      ? Number(templateRaw)
      : null;

  const eventHasAutoColumn =
    event != null && Object.prototype.hasOwnProperty.call(event, 'certificate_auto_issue');
  const eventHasDelayColumn =
    event != null && Object.prototype.hasOwnProperty.call(event, 'certificate_delay_minutes');

  return {
    template_id: Number.isFinite(templateId) && (templateId as number) > 0 ? templateId : null,
    certificate_description:
      typeof event?.certificate_description === 'string'
        ? event.certificate_description
        : null,
    certificate_auto_issue: eventHasAutoColumn
      ? Boolean(event?.certificate_auto_issue)
      : packageSettings.certificate_auto_issue,
    certificate_delay_minutes: eventHasDelayColumn
      ? Math.max(0, Number(event?.certificate_delay_minutes) || 0)
      : packageSettings.certificate_delay_minutes,
    form_id: form?.id ? String(form.id) : null,
    package_settings: packageSettings,
  };
}

export async function saveEventCertificateSettings(
  supabase: SupabaseClient,
  eventId: string,
  input: {
    template_id?: number | null;
    certificate_description?: string | null;
    certificate_auto_issue?: boolean;
    certificate_delay_minutes?: number;
  }
): Promise<EventCertificateDeliverySettings> {
  const current = await loadEventCertificateSettings(supabase, eventId);

  const templateId =
    input.template_id !== undefined ? input.template_id : current.template_id;
  const description =
    input.certificate_description !== undefined
      ? input.certificate_description
      : current.certificate_description;
  const autoIssue =
    input.certificate_auto_issue !== undefined
      ? Boolean(input.certificate_auto_issue)
      : current.certificate_auto_issue;
  const delayMinutes =
    input.certificate_delay_minutes !== undefined
      ? Math.max(0, Math.round(Number(input.certificate_delay_minutes) || 0))
      : current.certificate_delay_minutes;

  // Mevcut sütunlar: template_id + certificate_description
  const eventUpdate: Record<string, unknown> = {
    template_id: templateId,
    certificate_description: description?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  // Yeni sütunlar varsa birlikte yaz (yoksa PostgREST hata verir → ayrı dene)
  const withNewCols = {
    ...eventUpdate,
    certificate_auto_issue: autoIssue,
    certificate_delay_minutes: delayMinutes,
  };

  let { error } = await supabase
    .from('myuni_events')
    .update(withNewCols)
    .eq('id', eventId);

  if (error && /certificate_auto_issue|certificate_delay_minutes|PGRST204/i.test(error.message)) {
    ({ error } = await supabase
      .from('myuni_events')
      .update(eventUpdate)
      .eq('id', eventId));
  }

  if (error) {
    throw new Error(error.message);
  }

  // Bağlı form package_settings — otomatik gönderim ayarının güvenilir kaynağı
  if (current.form_id) {
    const nextSettings: EventCertificatePackageSettings = {
      ...current.package_settings,
      certificate_auto_issue: autoIssue,
      certificate_delay_minutes: delayMinutes,
    };
    const { error: formError } = await supabase
      .from(siteApplicationsDb.forms)
      .update({
        package_settings: nextSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', current.form_id);

    if (formError) {
      throw new Error(formError.message);
    }
  }

  return loadEventCertificateSettings(supabase, eventId);
}
