'use client';

import React, { useState } from 'react';
import { BookOpen, Save, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import HtmlDescriptionEditor from '@/app/components/lms/HtmlDescriptionEditor';

const texts = {
  tr: {
    title: 'Yeni Kurs Oluştur',
    subtitle: 'Temel bilgileri girin, içerik ve videoları düzenleme sayfasında ekleyin',
    backToList: 'Kurs Listesine Dön',
    courseTitle: 'Kurs Başlığı',
    courseDescription: 'Kurs Açıklaması',
    instructorName: 'Eğitmen Adı',
    courseType: 'Kurs Türü',
    courseLevel: 'Seviye',
    duration: 'Süre',
    price: 'Fiyat (₺)',
    save: 'Kursu Oluştur',
    saving: 'Oluşturuluyor...',
    error: 'Kurs oluşturulurken bir hata oluştu',
    loginRequired: 'Lütfen giriş yapınız.',
    courseTypes: {
      online: 'Online',
      live: 'Canlı',
      hybrid: 'Hibrit',
    },
    levels: {
      beginner: 'Başlangıç',
      intermediate: 'Orta',
      advanced: 'İleri',
    },
    placeholders: {
      title: 'Örn: Yapay Zeka Temelleri',
      description: 'Kursun detaylı açıklamasını yazın...',
      instructor: 'Eğitmen adı soyadı',
      duration: 'Örn: 8 hafta',
    },
    descriptionHelper: 'Metni biçimlendirebilirsiniz. Siteye HTML olarak kaydedilir ve öğrencilere zengin içerik olarak gösterilir.',
  },
  en: {
    title: 'Create New Course',
    subtitle: 'Enter basic info, add content and videos on the edit page',
    backToList: 'Back to Course List',
    courseTitle: 'Course Title',
    courseDescription: 'Course Description',
    instructorName: 'Instructor Name',
    courseType: 'Course Type',
    courseLevel: 'Level',
    duration: 'Duration',
    price: 'Price (₺)',
    save: 'Create Course',
    saving: 'Creating...',
    error: 'An error occurred while creating the course',
    loginRequired: 'Please sign in.',
    courseTypes: {
      online: 'Online',
      live: 'Live',
      hybrid: 'Hybrid',
    },
    levels: {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    },
    placeholders: {
      title: 'e.g. AI Fundamentals',
      description: 'Write a detailed course description...',
      instructor: 'Instructor full name',
      duration: 'e.g. 8 weeks',
    },
    descriptionHelper: 'Format your text freely. It is saved as HTML and shown to students as rich content.',
  },
};

export default function CreateCoursePage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const t = texts[locale as keyof typeof texts] || texts.tr;
  const { user: clerkUser, isLoaded } = useUser();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [courseType, setCourseType] = useState<'online' | 'live' | 'hybrid'>('online');
  const [level, setLevel] = useState('beginner');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clerkUser) return;

    try {
      setSaving(true);
      setError(null);

      const res = await fetch('/api/lms/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description,
          instructor_name: instructorName.trim(),
          course_type: courseType,
          level,
          duration: duration.trim(),
          price: price ? parseFloat(price) : 0,
          locale,
        }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result?.course?.id) {
        throw new Error(
          typeof result?.error === 'string' && result.error
            ? result.error
            : t.error
        );
      }

      router.push(`/${locale}/lms/edit/${result.course.id}`);
    } catch (err) {
      console.error('Error creating course:', err);
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#990000] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!clerkUser) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <p className="text-red-600">{t.loginRequired}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href={`/${locale}/lms`}
          className="inline-flex items-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.backToList}
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-[#990000]/10 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-[#990000]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              {t.title}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">{t.subtitle}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleCreate} className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t.courseTitle} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.placeholders.title}
              required
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t.courseDescription}
            </label>
            <HtmlDescriptionEditor
              value={description}
              onChange={setDescription}
              placeholder={t.placeholders.description}
              helperText={t.descriptionHelper}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t.instructorName}
              </label>
              <input
                type="text"
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                placeholder={t.placeholders.instructor}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t.courseType}
              </label>
              <select
                value={courseType}
                onChange={(e) => setCourseType(e.target.value as 'online' | 'live' | 'hybrid')}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
              >
                {Object.entries(t.courseTypes).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t.courseLevel}
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
              >
                {Object.entries(t.levels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t.duration}
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder={t.placeholders.duration}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t.price}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="w-full sm:w-auto px-6 py-3 bg-[#990000] hover:bg-[#880000] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {t.saving}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t.save}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
