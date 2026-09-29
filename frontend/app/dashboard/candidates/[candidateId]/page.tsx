import { CandidatesPageClient } from "@/views/candidates";

export default async function Page({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  return (
    <main className="px-16">
      <CandidatesPageClient
        currentUserName="Test"
        initialSelectedCandidateId={candidateId}
      />
    </main>
  );
}