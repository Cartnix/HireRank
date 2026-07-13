import { useState, useMemo } from "react";
import { Candidate } from "@/entities/candidate";
import { Stage } from "@/entities/job";

export function useCandidatesList(candidates: Candidate[]) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "Все">("Все");

  const filteredCandidates = useMemo(() => {
    return candidates.filter(
      (c) =>
        (stageFilter === "Все" || c.stage === stageFilter) &&
        c.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [candidates, search, stageFilter]);

  return { search, setSearch, stageFilter, setStageFilter, filteredCandidates };
}