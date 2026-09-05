import ModuleAccessPage from '@/app/components/moduleAccess/ModuleAccessPage';

export default function MentorshipAccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <ModuleAccessPage moduleKey="mentorship" params={params} />;
}
