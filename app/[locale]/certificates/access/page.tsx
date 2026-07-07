import ModuleAccessPage from '@/app/components/moduleAccess/ModuleAccessPage';

export default function CertificatesAccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <ModuleAccessPage moduleKey="certificates" params={params} />;
}
