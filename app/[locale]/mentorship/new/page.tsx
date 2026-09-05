'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import MentorshipFormFields, {
  emptyMentorshipForm,
  formStateToPayload,
} from '@/app/components/mentorship/MentorshipFormFields';

export default function NewMentorshipPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const router = useRouter();
  const [locale, setLocale] = useState('tr');
  const [form, setForm] = useState(emptyMentorshipForm());
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
      const res = await fetch('/api/mentorship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formStateToPayload(form)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      router.push(`/${locale}/mentorship/${data.mentorship.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <Link
        href={`/${locale}/mentorship`}
        className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-[#990000] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {locale === 'tr' ? 'Duyurulara dön' : 'Back to announcements'}
      </Link>
      <h1 className="text-2xl font-bold mb-6">
        {locale === 'tr' ? 'Yeni Mentörlük Duyurusu' : 'New Mentorship Announcement'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <MentorshipFormFields
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
            'Oluştur'
          ) : (
            'Create'
          )}
        </button>
      </form>
    </div>
  );
}
