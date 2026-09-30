"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/shared/ui/card";
import { Segmented } from "@/shared/ui/Segmanted";
import type { components } from "@/shared/api/schema";

type Meeting = components["schemas"]["ScheduledInterview"];
const formatDay = (date: Date) => date.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" });

export function CalendarGrid({ meetings }: { meetings: Meeting[] }) {
  const [mode, setMode] = useState<"week" | "day">("week");
  const [offset, setOffset] = useState(0);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + offset);
  const days = Array.from({ length: mode === "week" ? 7 : 1 }, (_, index) => {
    const day = new Date(start);
    day.setDate(day.getDate() + index);
    return day;
  });
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <button aria-label="Предыдущий период" onClick={() => setOffset(value => value - (mode === "week" ? 7 : 1))} className="p-2"><ChevronLeft size={18} /></button>
        <span>{formatDay(days[0])}{mode === "week" ? ` — ${formatDay(days[6])}` : ""}</span>
        <button aria-label="Следующий период" onClick={() => setOffset(value => value + (mode === "week" ? 7 : 1))} className="p-2"><ChevronRight size={18} /></button>
        <button onClick={() => setOffset(0)} className="text-sm text-cyan-main">Сегодня</button>
      </div>
      <Segmented<"week" | "day"> value={mode} onChange={setMode} options={[{ value: "week", label: "Неделя" }, { value: "day", label: "День" }]} />
    </div>
    <Card className="overflow-x-auto">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(160px, 1fr))` }}>
        {days.map(day => {
          const next = new Date(day); next.setDate(next.getDate() + 1);
          const events = meetings.filter(meeting => { const at = new Date(meeting.scheduled_at); return at >= day && at < next; });
          return <section key={day.toISOString()} className="min-h-64 border-r border-border p-3 space-y-3">
            <h3 className="text-sm font-semibold border-b border-border pb-3">{formatDay(day)}</h3>
            {events.length ? events.map(meeting => <div key={meeting.id} className="rounded-lg border border-cyan-main/30 bg-cyan-main/10 p-3 text-sm space-y-1">
              <p className="font-semibold">{meeting.candidate_name}</p>
              <p className="text-xs">{meeting.position}</p>
              <p>{new Date(meeting.scheduled_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })} · {meeting.duration_minutes} мин</p>
              <p className="text-xs text-muted-foreground">{meeting.stage}</p>
            </div>) : <p className="text-xs text-muted-foreground">Нет встреч</p>}
          </section>;
        })}
      </div>
    </Card>
  </div>;
}
