import ModuleAccessPage from '@/app/components/moduleAccess/ModuleAccessPage';

export default function LmsAccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <ModuleAccessPage moduleKey="lms" params={params} />;
}
