import { cookies } from "next/headers";
import { getVacancies, type Job } from "@/entities/job";
import { CandidatesPageClient } from "@/views/candidates";
import { mockCandidates } from "@/entities/candidate/model/data.mock";

export default async function Page() {
  const cookieStore = await cookies();
  const requestHeaders = {
    Cookie: cookieStore.toString(),
  };

  const jobs = await getVacancies(requestHeaders);

  const jobById = Object.fromEntries(
    jobs.map((job: Job) => [job.id, job]),
  ) as Record<string, Job>;

  return (
    <main className="px-16">
      <CandidatesPageClient
        candidates={mockCandidates}
        jobById={jobById}
        currentUserName="Test"
      />
    </main>
  );
}