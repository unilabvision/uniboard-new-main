import { redirect } from 'next/navigation';

export default async function CareerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/internship/applications`);
}
