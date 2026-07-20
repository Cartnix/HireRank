import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Candidate } from "@/entities/candidate";
import { Job, Stage } from "@/entities/job";
import { Note } from "@/entities/note";

export function useCandidatesPage(
  candidates: Candidate[],
  jobById: Record<string, Job>,
  currentUserName: string,
  initialSelectedCandidateId: string | null = null,
) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "Все">("Все");

  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedCandidateId);
  const [noteDraft, setNoteDraft] = useState("");
  const [notesByCandidate, setNotesByCandidate] = useState<Record<string, Note[]>>({});

  useEffect(() => {
    setSelectedId(initialSelectedCandidateId);
  }, [initialSelectedCandidateId]);

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

  const openCandidate = (id: string) => {
    setSelectedId(id);
    router.push(`${pathname}/${id}`);
  };
  const back = () => {
    setSelectedId(null);
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
