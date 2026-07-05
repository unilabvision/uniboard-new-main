import { redirect } from 'next/navigation';

export default async function KariyerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/internship/applications`);
}
