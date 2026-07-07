import ModuleAccessPage from '@/app/components/moduleAccess/ModuleAccessPage';

export default function AnalyticsAccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <ModuleAccessPage moduleKey="analytics" params={params} />;
}
