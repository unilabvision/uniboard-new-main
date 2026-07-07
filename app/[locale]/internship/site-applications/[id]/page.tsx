import { redirect } from 'next/navigation';

export default async function LegacySiteApplicationDetailRedirect({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  redirect(`/${locale}/site-applications/applications/${id}`);
}
