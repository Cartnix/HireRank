import { mockCandidates } from "@/entities/candidate/model/data.mock";
import { getVacancies, type Job } from "@/entities/job";
import { CandidatesPageClient } from "@/views/candidates";

export default async function Page({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  const jobs = await getVacancies();

  const jobById = Object.fromEntries(
    jobs.map((job: Job) => [job.id, job]),
  ) as Record<string, Job>;

  return (
    <main className="px-16">
      <CandidatesPageClient
        candidates={mockCandidates}
        jobById={jobById}
        currentUserName="Test"
        initialSelectedCandidateId={candidateId}
      />
    </main>
  );
}