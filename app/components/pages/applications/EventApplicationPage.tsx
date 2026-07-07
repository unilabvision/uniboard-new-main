import DynamicSiteApplicationForm from '@/app/components/forms/DynamicSiteApplicationForm';

interface EventApplicationPageProps {
  locale: string;
}

/** Eski /tr/etkinlik-basvuru URL uyumluluğu */
export default function EventApplicationPage({ locale }: EventApplicationPageProps) {
  const slug = locale === 'en' ? 'event-application' : 'etkinlik-basvuru';
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      <DynamicSiteApplicationForm locale={locale} formSlug={slug} />
    </div>
  );
}
