'use client';

import React, { useEffect, useState } from 'react';
import CourseEnrollmentPanel from '@/app/components/lms/CourseEnrollmentPanel';

export default function StudentsEnrollmentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState('tr');

  useEffect(() => {
    params.then((p) => setLocale(p.locale || 'tr'));
  }, [params]);

  const tr = locale === 'tr';

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {tr ? 'Öğrenci Kayıtları' : 'Student Enrollments'}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            {tr
              ? 'Hangi öğrencinin hangi kursa / pakete kayıtlı olduğunu görün'
              : 'See which student is enrolled in which course / package'}
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 sm:p-6">
          <CourseEnrollmentPanel locale={locale} />
        </div>
      </div>
    </div>
  );
}
