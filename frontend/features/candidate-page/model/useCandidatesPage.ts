import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Candidate, CandidateStatus } from "@/entities/candidate";
import { Job } from "@/entities/job";
import { Note } from "@/entities/note";

function getCandidateFullName(candidate: Candidate): string {
  const { surname, first_name, patronymic } = candidate.questionnaire;
  return candidate.name || [surname, first_name, patronymic].filter(Boolean).join(" ");
}

export function useCandidatesPage(
  candidates: Candidate[],
  jobById: Record<string, Job>,
  currentUserName: string,
  initialSelectedCandidateId: string | null = null,
) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilterState] = useState<CandidateStatus | "Все">(
    "Все",
  );

  const setStageFilter = (v: string) => {
    setStageFilterState(v as CandidateStatus | "Все");
  };

  const selectedId = initialSelectedCandidateId;
  const [noteDraft, setNoteDraft] = useState("");
  const [notesByCandidate, setNotesByCandidate] = useState<
    Record<string, Note[]>
  >({});

  const filteredCandidates = useMemo(() => {
    return candidates.filter(
      (c) =>
        (stageFilter === "Все" || c.status === stageFilter) &&
        getCandidateFullName(c).toLowerCase().includes(search.toLowerCase()),
    );
  }, [candidates, search, stageFilter]);

  const selectedCandidate = useMemo(
    () => candidates.find((c) => c.id === selectedId) ?? null,
    [candidates, selectedId],
  );

  const selectedJob = selectedCandidate?.assigned_vacancy_id
    ? (jobById[selectedCandidate.assigned_vacancy_id] ?? null)
    : null;
  const notes = selectedId ? (notesByCandidate[selectedId] ?? []) : [];

  const openCandidate = (id: string) => {
    router.push(`/dashboard/candidates/${id}`);
  };
  const back = () => {
    router.push("/dashboard/candidates");
  };

  const addNote = () => {
    if (!selectedId || !noteDraft.trim()) return;

    const newNote: Note = {
      id: crypto.randomUUID(),
      author: currentUserName,
      date: new Date().toISOString(),
      text: noteDraft,
    };

    setNotesByCandidate((prev) => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] ?? []), newNote],
    }));
    setNoteDraft("");
  };

  return {
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
  };
}
