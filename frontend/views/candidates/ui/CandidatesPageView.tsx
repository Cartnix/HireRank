import type { Candidate } from "@/entities/candidate";
import type { Job } from "@/entities/job";
import { CandidatesPageClient } from "./CandidatePageClient";

export type CandidatesPageViewProps = {
  candidates: Candidate[];
  jobById: Record<string, Job>;
  currentUserName: string;
  initialSelectedCandidateId?: string | null;
};

export function CandidatesPageView(props: CandidatesPageViewProps) {
  return <CandidatesPageClient {...props} />;
}
