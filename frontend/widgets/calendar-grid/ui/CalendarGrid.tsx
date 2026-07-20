"use client";

import { Fragment, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Candidate } from "@/entities/candidate";
import { interviews } from "@/entities/interview";
import { Card } from "@/shared/ui/Card";
import { dayFull, weekDays } from "@/shared/lib/constants";
import { Segmented } from "@/shared/ui/Segmanted";

const interviewerColors: Record<string, string> = {
  "Анна Петрова":
    "bg-brand-primary/15 text-brand-primary border-brand-primary/30",
  "Игорь Соколов": "bg-success/15 text-success border-success/30",
  "Мария Ким": "bg-warning/15 text-warning border-warning/30",
  "Дмитрий Волков": "bg-danger/10 text-danger border-danger/30",
};

export function CalendarGrid({
  candidateById = {},
}: {
  candidateById?: Record<string, Candidate>;
}) {
  const [mode, setMode] = useState<"week" | "day">("week");
  const [dayIdx, setDayIdx] = useState(0);
  const hours = Array.from({ length: 9 }).map((_, i) => 9 + i);

  const daysToShow = mode === "week" ? [0, 1, 2, 3, 4] : [dayIdx];

  return (
    <div>
      <div className="mb-6 flex items-center justify-end gap-3">
        {mode === "day" && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDayIdx((d) => Math.max(0, d - 1))}
              className="rounded-full p-1.5 hover:bg-muted"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="w-24 text-center text-[13px] font-medium">
              {dayFull[dayIdx]}
            </div>
            <button
              onClick={() => setDayIdx((d) => Math.min(4, d + 1))}
              className="rounded-full p-1.5 hover:bg-muted"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
        <Segmented<"week" | "day">
          value={mode}
          onChange={setMode}
          options={[
            { value: "week", label: "Неделя" },
            { value: "day", label: "День" },
          ]}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="mb-3 flex items-center gap-4 border-b border-border px-5 py-3 text-[12.5px]">
          <span className="text-muted-foreground">Рекрутеры:</span>
          {Object.keys(interviewerColors).map((name) => (
            <span key={name} className="flex items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded-full border ${interviewerColors[name]}`}
              />
              {name}
            </span>
          ))}
        </div>

        <div
          className="grid w-full"
          style={{
            gridTemplateColumns: `56px repeat(${daysToShow.length}, 1fr)`,
          }}
        >
          <div />
          {daysToShow.map((d) => (
            <div
              key={d}
              className="border-b border-l border-border px-3 py-2 text-center text-[12.5px] font-semibold"
            >
              {weekDays[d]}
            </div>
          ))}

          {hours.map((h) => (
            <Fragment key={`h-${h}`}>
              <div className="border-b border-border px-2 py-4 text-right text-[11.5px] text-muted-foreground">
                {h}:00
              </div>
              {daysToShow.map((d) => {
                const iv = interviews.find(
                  (i) => i.day === d && Math.floor(i.startHour) === h,
                );
                const candidate = iv
                  ? candidateById[iv.candidateId]
                  : undefined;

                return (
                  <div
                    key={`${d}-${h}`}
                    className="relative min-h-13 border-b border-l border-border px-1.5 py-1.5"
                  >
                    {iv && (
                      <div
                        className={`rounded-lg border px-2 py-1.5 text-[11.5px] leading-tight ${interviewerColors[iv.interviewer]}`}
                      >
                        <div className="font-semibold">
                          {candidate?.name ?? "Неизвестный кандидат"}
                        </div>
                        <div className="opacity-80">
                          {iv.type} · {iv.duration * 60} мин
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </Card>
    </div>
  );
}
