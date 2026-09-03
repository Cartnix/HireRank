import { JobsPageClient } from "@/views/jobs";

export default async function Page({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  return <JobsPageClient initialSelectedJobId={jobId} />;
}