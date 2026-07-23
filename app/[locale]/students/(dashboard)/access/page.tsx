import ModuleAccessPage from '@/app/components/moduleAccess/ModuleAccessPage';

export default function StudentsAccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <ModuleAccessPage moduleKey="students" params={params} />;
}
