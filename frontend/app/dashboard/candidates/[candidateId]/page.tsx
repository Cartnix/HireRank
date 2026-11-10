import { CandidatesPageClient } from "@/views/candidates";

export default async function Page({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  return (
    <main className="min-w-0">
      <CandidatesPageClient
        currentUserName="Test"
        initialSelectedCandidateId={candidateId}
      />
    </main>
  );
}