import { getCandidates } from "@/entities/candidate";
import { getJobs, type Job } from "@/entities/job";
import { JobsPageClient } from "@/views/jobs";

export default async function Page({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const [candidates, jobs] = await Promise.all([getCandidates(), getJobs()]);

  return (
    <JobsPageClient
      initialCandidates={candidates as any[]}
      initialJobs={jobs as Job[]}
      initialSelectedJobId={jobId}
    />
  );
}
