import DynamicSiteApplicationForm from '@/app/components/forms/DynamicSiteApplicationForm';

interface TeamApplicationPageProps {
  locale: string;
}

/** Eski /tr/ekip-basvuru URL uyumluluğu */
export default function TeamApplicationPage({ locale }: TeamApplicationPageProps) {
  const slug = locale === 'en' ? 'team-application' : 'ekip-basvuru';
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      <DynamicSiteApplicationForm locale={locale} formSlug={slug} />
    </div>
  );
}
