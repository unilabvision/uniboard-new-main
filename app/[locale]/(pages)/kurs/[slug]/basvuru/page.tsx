import PageLayout from '@/app/components/layout/PageLayout';
import DynamicSiteApplicationForm from '@/app/components/forms/DynamicSiteApplicationForm';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function CourseApplicationFormPage({ params }: PageProps) {
  const { locale, slug } = await params;

  return (
    <PageLayout
      locale={locale}
      variant="application"
      title={locale === 'tr' ? 'Kurs Başvurusu' : 'Course Application'}
      description={
        locale === 'tr'
          ? 'Kursa katılmak için formu doldurun — ekibimiz en kısa sürede dönüş yapacak.'
          : 'Fill out the form to join the course — our team will get back to you soon.'
      }
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <DynamicSiteApplicationForm locale={locale} courseSlug={slug} />
      </div>
    </PageLayout>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'tr' ? 'Kurs Başvurusu | MyUNI' : 'Course Application | MyUNI',
  };
}
