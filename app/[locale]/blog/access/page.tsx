import ModuleAccessPage from '@/app/components/moduleAccess/ModuleAccessPage';

export default function BlogAccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <ModuleAccessPage moduleKey="blog" params={params} />;
}
