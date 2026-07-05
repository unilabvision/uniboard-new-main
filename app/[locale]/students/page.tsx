import { redirect } from 'next/navigation';

interface StudentsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function StudentsPage({ params }: StudentsPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/lms/progress`);
}
