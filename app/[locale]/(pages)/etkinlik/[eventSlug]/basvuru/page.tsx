import PageLayout from '@/app/components/layout/PageLayout';
import DynamicSiteApplicationForm from '@/app/components/forms/DynamicSiteApplicationForm';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ locale: string; eventSlug: string }>;
}

export default async function EventApplicationFormPage({ params }: PageProps) {
  const { locale, eventSlug } = await params;

  return (
    <PageLayout
      locale={locale}
      variant="application"
      title={locale === 'tr' ? 'Etkinlik Başvurusu' : 'Event Application'}
      description={
        locale === 'tr'
          ? 'Etkinliğe katılmak için formu doldurun — ekibimiz en kısa sürede dönüş yapacak.'
          : 'Fill out the form to join the event — our team will get back to you soon.'
      }
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <DynamicSiteApplicationForm locale={locale} eventSlug={eventSlug} />
      </div>
    </PageLayout>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'tr' ? 'Etkinlik Başvurusu | MyUNI' : 'Event Application | MyUNI',
  };
}
