import { CandidatesPageClient } from "@/widgets/candidate-page-ui/ui/CandidateUI";
import { getCandidates } from "@/entities/candidate";
import { getJobs, type Job } from "@/entities/job";

export default async function Page() {
  const [candidates, jobs] = await Promise.all([getCandidates(), getJobs()]);

  const jobById = Object.fromEntries(
    jobs.map((job: Job) => [job.id, job]),
  ) as Record<string, Job>;

  return (
    <CandidatesPageClient
      candidates={candidates}
      jobById={jobById}
      currentUserName="Test"
    />
  );
}