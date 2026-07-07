import ModuleAccessPage from '@/app/components/moduleAccess/ModuleAccessPage';

export default function SiteApplicationsAccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <ModuleAccessPage moduleKey="site-applications" params={params} />;
}
