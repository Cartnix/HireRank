import { useState, useMemo } from "react";
import { Candidate } from "@/entities/candidate";

export function useCandidatesList(candidates: Candidate[]) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string | "Все">("Все");

  const filteredCandidates = useMemo(() => {
    return candidates.filter(
      (c) =>
        (stageFilter === "Все" || c.stage === stageFilter) &&
        c.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [candidates, search, stageFilter]);

  return { search, setSearch, stageFilter, setStageFilter, filteredCandidates };
}