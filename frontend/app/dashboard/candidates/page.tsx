import { CandidatesPageClient } from "@/views/candidates";

export default function Page() {
  return (
    <main className="px-16">
      <CandidatesPageClient currentUserName="Test" />
    </main>
  );
}