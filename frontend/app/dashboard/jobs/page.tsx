import { getCandidates } from "@/entities/candidate";
import { type Job } from "@/entities/job";
import { getServerVacancies } from "@/entities/job/model/api";
import { JobsPageClient } from "@/views/jobs";

export default async function Page() {
  const [candidates, jobs] = await Promise.all([
    getCandidates(),
    getServerVacancies(),
  ]);

  return (
    <>
      <JobsPageClient
        initialCandidates={candidates as any[]}
        initialJobs={jobs as Job[]}
      />
    </>
  );
}
