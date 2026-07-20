"use client";

import { CandidateProfile } from "@/widgets/candidate-profile";
import { SearchInput } from "@/features/search-candidates/ui/SearchInputCandidate";
import { StageFilter } from "@/features/filter-candidates/ui/StageFilter";
import { CandidatesTable } from "@/widgets/candidate-table/ui/CandidatesTable";
import { Candidate } from "@/entities/candidate";
import { Job } from "@/entities/job";
import { useCandidatesPage } from "@/features/candidate-page";

export function CandidatesPageClient({
  candidates,
  jobById,
  currentUserName,
}: {
  candidates: Candidate[];
  jobById: Record<string, Job>;
  currentUserName: string;
}) {
  const {
    search,
    setSearch,
    stageFilter,
    setStageFilter,
    filteredCandidates,
    openCandidate,
    selectedCandidate,
    selectedJob,
    notes,
    noteDraft,
    setNoteDraft,
    addNote,
    back,
  } = useCandidatesPage(candidates, jobById, currentUserName);

  if (selectedCandidate && selectedJob) {
    return (
      <CandidateProfile
        candidate={selectedCandidate}
        job={selectedJob}
        notes={notes}
        noteDraft={noteDraft}
        setNoteDraft={setNoteDraft}
        addNote={addNote}
        onBack={back}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <SearchInput value={search} onChange={setSearch} />
        <StageFilter value={stageFilter} onChange={setStageFilter} />
      </div>
      <CandidatesTable
        candidates={filteredCandidates}
        jobById={jobById}
        onOpenCandidate={openCandidate}
      />
    </div>
  );
}