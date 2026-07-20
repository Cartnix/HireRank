"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Stage } from "@/entities/job";
import { Card } from "@/shared/ui/Card";
import { GhostButton } from "@/shared/ui/buttons/GhostButton";

export function StagesEditor({
  stages,
  onChange,
}: {
  stages: Stage[];
  onChange: (stages: Stage[]) => void;
}) {
  const [newStage, setNewStage] = useState("");

  return (
    <Card className="h-fit p-6">
      <div className="mb-1 text-[15px] font-semibold">Этапы отбора</div>
      <div className="mb-4 text-[12.5px] text-foreground-secondary">Настройте порядок этапов воронки для этой вакансии.</div>
      <div className="space-y-2">
        {stages.map((s, idx) => (
          <div key={s} className="flex items-center gap-2.5 rounded-[10px] border border-border px-3 py-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
              {idx + 1}
            </span>
            <span className="text-[13px] font-medium">{s}</span>
            <button
              onClick={() => onChange(stages.filter((st) => st !== s))}
              className="ml-auto text-muted-foreground hover:text-danger"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={newStage}
          onChange={(e) => setNewStage(e.target.value)}
          placeholder="Новый этап"
          className="w-full rounded-[10px] border border-border bg-background px-3 py-1.5 text-[13px] outline-none focus:border-brand-primary"
        />
        <GhostButton
          onClick={() => {
            if (newStage.trim() === "") return;
            onChange([...stages, newStage.trim() as Stage]);
            setNewStage("");
          }}
        >
          Добавить
        </GhostButton>
      </div>
    </Card>
  );
}
