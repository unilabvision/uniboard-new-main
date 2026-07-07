import ModuleAccessPage from '@/app/components/moduleAccess/ModuleAccessPage';

export default function Lms2AccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <ModuleAccessPage moduleKey="lms-2" params={params} />;
}
