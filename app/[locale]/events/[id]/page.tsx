'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
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
  const [form, setForm] = useState(eventToFormState({
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
  }));
  const [slugTouched, setSlugTouched] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setMessage(locale === 'tr' ? 'Kaydedildi' : 'Saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
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
        {locale === 'tr' ? 'Etkinliklere dön' : 'Back to events'}
      </Link>
      <h1 className="text-2xl font-bold mb-6">{form.title || (locale === 'tr' ? 'Etkinlik Düzenle' : 'Edit Event')}</h1>
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
          {locale === 'tr' ? 'Kaydet' : 'Save'}
        </button>
      </form>
    </div>
  );
}
