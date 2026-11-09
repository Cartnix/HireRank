import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Candidate } from "@/entities/candidate";
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
  const [stageFilter, setStageFilterState] = useState("Все");

  const setStageFilter = (v: string) => {
    setStageFilterState(v);
  };

  const stageOptions = useMemo(() => {
    const stages = new Set(
      Object.values(jobById).flatMap((job) =>
        (job.stages ?? []).map((stage) => stage.stage_name),
      ),
    );
    if (candidates.some((candidate) => !candidate.assigned_vacancy_id))
      stages.add("Без назначения");
    if (
      candidates.some(
        (candidate) =>
          candidate.assigned_vacancy_id && !candidate.current_stage_name,
      )
    )
      stages.add("Без этапа");
    return [...stages].sort((a, b) => a.localeCompare(b, "ru"));
  }, [candidates, jobById]);

  const selectedId = initialSelectedCandidateId;
  const [noteDraft, setNoteDraft] = useState("");
  const [notesByCandidate, setNotesByCandidate] = useState<
    Record<string, Note[]>
  >({});

  const filteredCandidates = useMemo(() => {
    return candidates.filter(
      (c) =>
        (stageFilter === "Все" ||
          (c.assigned_vacancy_id
            ? c.current_stage_name || "Без этапа"
            : "Без назначения") === stageFilter) &&
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
    stageOptions,
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
