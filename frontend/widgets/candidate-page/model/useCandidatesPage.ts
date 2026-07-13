import { useState, useMemo } from "react";
import { Candidate } from "@/entities/candidate";
import { Job, Stage } from "@/entities/job";
import { Note } from "@/entities/note";

export function useCandidatesPage(
  candidates: Candidate[],
  jobById: Record<string, Job>,
  currentUserName: string,
) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "Все">("Все");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [notesByCandidate, setNotesByCandidate] = useState<
    Record<string, Note[]>
  >({});

  const filteredCandidates = useMemo(() => {
    return candidates.filter(
      (c) =>
        (stageFilter === "Все" || c.stage === stageFilter) &&
        c.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [candidates, search, stageFilter]);

  const selectedCandidate = useMemo(
    () => candidates.find((c) => c.id === selectedId) ?? null,
    [candidates, selectedId],
  );

  const selectedJob = selectedCandidate
    ? (jobById[selectedCandidate.jobId] ?? null)
    : null;
  const notes = selectedId ? (notesByCandidate[selectedId] ?? []) : [];

  const openCandidate = (id: string) => setSelectedId(id);
  const back = () => setSelectedId(null);

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
