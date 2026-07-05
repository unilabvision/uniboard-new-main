import { redirect } from 'next/navigation';

interface ReportsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function ReportsPage({ params }: ReportsPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/analytics`);
}
