import ModuleAccessPage from '@/app/components/moduleAccess/ModuleAccessPage';

export default function SettingsAccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <ModuleAccessPage moduleKey="settings" params={params} />;
}
