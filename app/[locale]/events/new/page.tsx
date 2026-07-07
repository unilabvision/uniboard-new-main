'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import EventFormFields, {
  emptyEventForm,
  formStateToPayload,
} from '@/app/components/events/EventFormFields';

export default function NewEventPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const router = useRouter();
  const [locale, setLocale] = useState('tr');
  const [form, setForm] = useState(emptyEventForm());
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setLocale(p.locale));
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formStateToPayload(form)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      router.push(`/${locale}/events/${data.event.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <Link
        href={`/${locale}/events`}
        className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-[#990000] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {locale === 'tr' ? 'Etkinliklere dön' : 'Back to events'}
      </Link>
      <h1 className="text-2xl font-bold mb-6">
        {locale === 'tr' ? 'Yeni Etkinlik' : 'New Event'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <EventFormFields
          locale={locale}
          form={form}
          setForm={setForm}
          slugTouched={slugTouched}
          setSlugTouched={setSlugTouched}
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-[#990000] text-white rounded-lg disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin inline" />
          ) : locale === 'tr' ? (
            'Etkinliği Oluştur'
          ) : (
            'Create Event'
          )}
        </button>
      </form>
    </div>
  );
}
