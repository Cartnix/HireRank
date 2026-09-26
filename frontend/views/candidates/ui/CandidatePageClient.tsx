"use client";

import { CandidateProfile } from "@/widgets/candidate-profile";
import { SearchInput } from "@/features/search-candidates/ui/SearchInputCandidate";
import { StageFilter } from "@/features/filter-candidates/ui/StageFilter";
import { CandidatesTable } from "@/widgets/candidate-table/ui/CandidatesTable";
import type { Candidate } from "@/entities/candidate";
import type { Job } from "@/entities/job";
import { useCandidatesPage } from "@/features/candidate-page";
import { Sparkles, UserPlus } from "lucide-react";
import { SectionTitle } from "@/shared/ui/SectionTitle";

export function CandidatesPageClient({
  candidates,
  jobById,
  currentUserName,
  initialSelectedCandidateId = null,
}: {
  candidates: Candidate[];
  jobById: Record<string, Job>;
  currentUserName: string;
  initialSelectedCandidateId?: string | null;
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
  } = useCandidatesPage(
    candidates,
    jobById,
    currentUserName,
    initialSelectedCandidateId,
  );

  if (selectedCandidate && selectedJob) {
    return (
      <main className="w-full p-6">
        <CandidateProfile
          candidate={selectedCandidate}
          job={selectedJob}
          notes={notes}
          noteDraft={noteDraft}
          setNoteDraft={setNoteDraft}
          addNote={addNote}
          onBack={back}
        />
      </main>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <SectionTitle
            title="База кандидатов"
            subtitle="Управление потоком соискателей и AI-скрининг"
          />
        </div>

        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-main text-black font-semibold text-xs hover:opacity-90 transition-all shadow-sm">
          <UserPlus className="w-4 h-4" />
          <span>Добавить кандидата</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border">
        <div className="flex-1 max-w-md">
          <SearchInput value={search} onChange={setSearch} />
        </div>
        <div className="flex items-center gap-3">
          <StageFilter value={stageFilter} onChange={setStageFilter} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <CandidatesTable
          candidates={filteredCandidates}
          jobById={jobById}
          onOpenCandidate={openCandidate}
        />

        <div className="p-4 border-t border-border bg-secondary/10 flex items-center justify-between text-xs text-foreground-secondary">
          <span>
            Найдено кандидатов: <strong>{filteredCandidates.length}</strong>
          </span>
          <span className="flex items-center gap-1 text-cyan-main">
            <Sparkles className="w-3.5 h-3.5" />
            AI-парсер активен
          </span>
        </div>
      </div>
    </div>
  );
}
