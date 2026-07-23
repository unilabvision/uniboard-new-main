'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/** Legacy URL → Etkinlik Yönetimi özeti */
export default function SiteApplicationsEventsRedirect() {
  const params = useParams();
  const router = useRouter();
  const locale = typeof params.locale === 'string' ? params.locale : 'tr';

  useEffect(() => {
    router.replace(`/${locale}/events/overview`);
  }, [locale, router]);

  return (
    <div className="p-8 text-center text-neutral-500">
      {locale === 'tr' ? 'Etkinlik özetine yönlendiriliyorsunuz…' : 'Redirecting to events overview…'}
    </div>
  );
}
