import { Candidate } from "@/entities/candidate";
import { useState } from "react";

export const useCandidateFilters = (candidates: Candidate[]) => {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string | "Все">("Все");

  const filtered = candidates.filter((c) => {
    const matchesSearch =
      search.trim() === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchesStage = stageFilter === "Все" || c.stage === stageFilter;
    return matchesStage && matchesSearch;
  });

  return { search, setSearch, stageFilter, setStageFilter, filtered };
};