import ModuleAccessPage from '@/app/components/moduleAccess/ModuleAccessPage';

export default function MembershipsAccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <ModuleAccessPage moduleKey="memberships" params={params} />;
}
