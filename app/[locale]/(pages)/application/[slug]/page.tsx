import PageLayout from '@/app/components/layout/PageLayout';
import DynamicSiteApplicationForm from '@/app/components/forms/DynamicSiteApplicationForm';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function SiteApplicationFormPageEn({ params }: PageProps) {
  const { locale, slug } = await params;

  return (
    <PageLayout
      locale={locale}
      variant="application"
      title="Let's submit your application!"
      description="Fill out the form in a few minutes — our team will get back to you soon."
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <DynamicSiteApplicationForm locale={locale} formSlug={slug} />
      </div>
    </PageLayout>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Application Form | MyUNI',
  };
}
