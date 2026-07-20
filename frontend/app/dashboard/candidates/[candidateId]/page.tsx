import { getCandidates } from "@/entities/candidate";
import { getJobs, type Job } from "@/entities/job";
import { CandidatesPageView } from "@/views/candidates";

export default async function Page({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  const [candidates, jobs] = await Promise.all([getCandidates(), getJobs()]);

  const jobById = Object.fromEntries(
    jobs.map((job: Job) => [job.id, job]),
  ) as Record<string, Job>;

  return (
    <CandidatesPageView
      candidates={candidates}
      jobById={jobById}
      currentUserName="Test"
      initialSelectedCandidateId={candidateId}
    />
  );
}
