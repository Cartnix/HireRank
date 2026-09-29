import { Filter } from "lucide-react";
import type { CandidateStatus } from "@/entities/candidate";

export function StageFilter({
  value,
  onChange,
}: {
  value: CandidateStatus | "Все";
  onChange: (v: string | "Все") => void;
}) {
  const stages: { value: CandidateStatus | "Все"; label: string }[] = [
    { value: "Все", label: "Все" },
    { value: "unassigned", label: "Без назначения" },
    { value: "assigned", label: "В работе" },
    { value: "rejected", label: "Отклонённые" },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto">
      <Filter size={14} className="mr-0.5 shrink-0 text-muted-foreground" />
      {stages.map(({ value: stage, label }) => (
        <button
          key={stage}
          onClick={() => onChange(stage)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
            value === stage
              ? "bg-brand-primary text-brand-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}