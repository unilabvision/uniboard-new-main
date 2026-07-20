'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { use } from 'react';
import {
  ArrowLeft,
  Loader2,
  Save,
  Mail,
  FileSpreadsheet,
  Users,
  CreditCard,
} from 'lucide-react';
import EventFormFields, {
  eventToFormState,
  formStateToPayload,
} from '@/app/components/events/EventFormFields';

export default function EditEventPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = use(params);
  const [form, setForm] = useState(
    eventToFormState({
      id,
      slug: '',
      title: '',
      description: null,
      organizer_name: null,
      organizer_email: null,
      organizer_linkedin: null,
      organizer_image_url: null,
      event_type: 'seminar',
      category: null,
      tags: null,
      start_date: '',
      end_date: null,
      timezone: 'Europe/Istanbul',
      duration_minutes: null,
      is_online: true,
      location_name: null,
      location_address: null,
      meeting_url: null,
      is_paid: false,
      price: null,
      max_attendees: null,
      current_attendees: 0,
      registration_deadline: null,
      is_registration_open: true,
      thumbnail_url: null,
      banner_url: null,
      status: 'upcoming',
      is_active: true,
      is_featured: false,
      created_at: '',
      updated_at: '',
    })
  );
  const [slugTouched, setSlugTouched] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reminding, setReminding] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const tr = locale === 'tr';

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.event) {
          setForm(eventToFormState(data.event));
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formStateToPayload(form)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      if (data.event) setForm(eventToFormState(data.event));
      setMessage(tr ? 'Kaydedildi' : 'Saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/events/${id}/registrants/export`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || (tr ? 'Excel indirilemedi' : 'Export failed'));
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${form.slug || 'etkinlik'}-kayitlar.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setActionMessage(tr ? 'Excel indirildi' : 'Excel downloaded');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error');
    } finally {
      setExporting(false);
    }
  };

  const handleEventReminder = async () => {
    const ok = confirm(
      tr
        ? 'Bu etkinliğe kayıtlı tüm katılımcılara (e-posta başına 1) hatırlatma maili gönderilsin mi?'
        : 'Send an event reminder to all registrants (1 email per address)?'
    );
    if (!ok) return;

    setReminding(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/events/${id}/remind`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setActionMessage(
        tr
          ? `Hatırlatma gönderildi: ${data.sent} / ${data.uniqueEmails} (toplam kayıt ${data.totalRegistrants})`
          : `Reminders sent: ${data.sent} / ${data.uniqueEmails} (${data.totalRegistrants} registrations)`
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error');
    } finally {
      setReminding(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <Link
        href={`/${locale}/events`}
        className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-[#990000] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {tr ? 'Etkinliklere dön' : 'Back to events'}
      </Link>
      <h1 className="text-2xl font-bold mb-6">
        {form.title || (tr ? 'Etkinlik Düzenle' : 'Edit Event')}
      </h1>

      <section className="mb-8 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" />
          {tr ? 'Kayıt yönetimi' : 'Registration tools'}
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          {tr
            ? 'Katılımcı listesini Excel indirin veya etkinlik hatırlatma maili gönderin. Ödeme bekleyenler için ayrı hatırlatma Site Başvuruları → Etkinlik Özeti’nden yapılır.'
            : 'Download registrants as Excel or send an event reminder. Payment reminders are under Site Applications → Events Overview.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            {tr ? 'Excel indir' : 'Download Excel'}
          </button>
          <button
            type="button"
            onClick={handleEventReminder}
            disabled={reminding}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#990000] text-white text-sm hover:bg-[#7a0000] disabled:opacity-50"
          >
            {reminding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            {tr ? 'Etkinlik hatırlatma maili' : 'Send event reminder'}
          </button>
          <Link
            href={`/${locale}/site-applications/applications?category=event&eventId=${id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700"
          >
            <Users className="w-4 h-4" />
            {tr ? 'Kayıtları gör' : 'View registrations'}
          </Link>
          <Link
            href={`/${locale}/site-applications/events`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700"
          >
            <CreditCard className="w-4 h-4" />
            {tr ? 'Ödeme hatırlatmaları' : 'Payment reminders'}
          </Link>
        </div>
        {actionMessage && (
          <p className="mt-3 text-sm text-green-700 dark:text-green-400">{actionMessage}</p>
        )}
        {actionError && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{actionError}</p>
        )}
      </section>

      {message && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-2 text-sm">
          {message}
        </div>
      )}
      <form onSubmit={handleSave} className="space-y-6">
        <EventFormFields
          locale={locale}
          form={form}
          setForm={setForm}
          slugTouched={slugTouched}
          setSlugTouched={setSlugTouched}
          isEdit
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#990000] text-white rounded-lg disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {tr ? 'Kaydet' : 'Save'}
        </button>
      </form>
    </div>
  );
}
