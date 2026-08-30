"use client";

import { useEffect, useMemo, useState } from "react";
import { CandidateProfile } from "@/widgets/candidate-profile";
import { SearchInput } from "@/features/search-candidates/ui/SearchInputCandidate";
import { StageFilter } from "@/features/filter-candidates/ui/StageFilter";
import { CandidatesTable } from "@/widgets/candidate-table/ui/CandidatesTable";
import { getCandidates, type Candidate } from "@/entities/candidate";
import { getVacancies, type Job } from "@/entities/job";
import { useCandidatesPage } from "@/features/candidate-page";

export function CandidatesPageClient({
  currentUserName,
  initialSelectedCandidateId = null,
}: {
  currentUserName: string;
  initialSelectedCandidateId?: string | null;
}) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    Promise.all([getCandidates(), getVacancies()])
      .then(([candidatesData, jobsData]) => {
        if (cancelled) return;
        setCandidates(
          Array.isArray(candidatesData) ? (candidatesData as Candidate[]) : [],
        );
        setJobs(Array.isArray(jobsData) ? (jobsData as Job[]) : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Ошибка загрузки данных");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const jobById = useMemo(
    () => Object.fromEntries(jobs.map((job) => [job.id, job])) as Record<string, Job>,
    [jobs],
  );

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

  if (loading) return <div>Loading...</div>;

  if (error) {
    return <div>Не удалось загрузить данные: {error}</div>;
  }

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