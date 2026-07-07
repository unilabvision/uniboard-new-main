import ModuleAccessPage from '@/app/components/moduleAccess/ModuleAccessPage';

export default function EventsAccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <ModuleAccessPage moduleKey="events" params={params} />;
}
