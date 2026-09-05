'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import MentorshipFormFields, {
  emptyMentorshipForm,
  formStateToPayload,
  mentorshipToForm,
} from '@/app/components/mentorship/MentorshipFormFields';
import type { Mentorship } from '@/app/types/mentorship';

export default function EditMentorshipPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const router = useRouter();
  const [locale, setLocale] = useState('tr');
  const [id, setId] = useState('');
  const [form, setForm] = useState(emptyMentorshipForm());
  const [slugTouched, setSlugTouched] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => {
      setLocale(p.locale);
      setId(p.id);
    });
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/mentorship/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        setForm(mentorshipToForm(data.mentorship as Mentorship));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/mentorship/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formStateToPayload(form)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setForm(mentorshipToForm(data.mentorship as Mentorship));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(locale === 'tr' ? 'Silmek istediğinize emin misiniz?' : 'Delete this mentorship?')) {
      return;
    }
    const res = await fetch(`/api/mentorship/${id}`, { method: 'DELETE' });
    if (res.ok) router.push(`/${locale}/mentorship`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#990000]" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <Link
        href={`/${locale}/mentorship`}
        className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-[#990000] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {locale === 'tr' ? 'Duyurulara dön' : 'Back to announcements'}
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {locale === 'tr' ? 'Duyuruyu Düzenle' : 'Edit Announcement'}
        </h1>
        <button
          type="button"
          onClick={handleDelete}
          className="inline-flex items-center gap-1 text-sm text-red-600"
        >
          <Trash2 className="w-4 h-4" />
          {locale === 'tr' ? 'Sil' : 'Delete'}
        </button>
      </div>
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
            'Kaydet'
          ) : (
            'Save'
          )}
        </button>
      </form>
    </div>
  );
}
