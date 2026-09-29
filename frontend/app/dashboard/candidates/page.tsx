import { CandidatesPageClient } from "@/views/candidates";

export default function Page() {
  return (
    <main className="min-w-0">
      <CandidatesPageClient currentUserName="Test" />
    </main>
  );
}