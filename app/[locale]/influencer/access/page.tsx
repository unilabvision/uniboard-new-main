import ModuleAccessPage from '@/app/components/moduleAccess/ModuleAccessPage';

export default function InfluencerAccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <ModuleAccessPage moduleKey="influencer" params={params} />;
}
