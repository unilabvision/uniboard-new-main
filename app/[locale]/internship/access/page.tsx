import ModuleAccessPage from '@/app/components/moduleAccess/ModuleAccessPage';

export default function InternshipAccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return (
    <ModuleAccessPage moduleKey="internship" params={params} showReviewerOption />
  );
}
