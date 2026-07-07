import PageLayout from '@/app/components/layout/PageLayout';
import DynamicSiteApplicationForm from '@/app/components/forms/DynamicSiteApplicationForm';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function SiteApplicationFormPage({ params }: PageProps) {
  const { locale, slug } = await params;

  return (
    <PageLayout
      locale={locale}
      variant="application"
      title={locale === 'tr' ? 'Haydi, başvurunu yapalım!' : "Let's submit your application!"}
      description={
        locale === 'tr'
          ? 'Birkaç dakikada formu doldur — ekibimiz en kısa sürede seninle iletişime geçsin.'
          : 'Fill out the form in a few minutes — our team will get back to you soon.'
      }
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <DynamicSiteApplicationForm locale={locale} formSlug={slug} />
      </div>
    </PageLayout>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title:
      locale === 'tr'
        ? 'Başvuru Formu | MyUNI'
        : 'Application Form | MyUNI',
  };
}
