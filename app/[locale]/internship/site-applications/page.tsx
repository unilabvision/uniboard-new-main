import { redirect } from 'next/navigation';

export default async function LegacySiteApplicationsRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/site-applications/applications`);
}
