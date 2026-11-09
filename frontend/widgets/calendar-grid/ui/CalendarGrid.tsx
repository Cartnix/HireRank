"use client";

import { useState, type FormEvent } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, Clock3, Plus, X } from "lucide-react";
import type { Candidate } from "@/entities/candidate";
import type { Job } from "@/entities/job";
import { Card } from "@/shared/ui/card";
import { Segmented } from "@/shared/ui/Segmanted";
import type { components } from "@/shared/api/schema";

type Meeting = components["schemas"]["ScheduledInterview"];
type MeetingDraft = {
  applicationId: string;
  scheduledAt: string;
  durationMinutes: number;
};

const formatDay = (date: Date) =>
  date.toLocaleDateString("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

const departmentStyle = (department: string) => {
  const value = department.toLowerCase();
  const styles = [
    { bar: "bg-sky-500", card: "border-sky-500/30 bg-sky-500/10", label: "text-sky-700 dark:text-sky-300" },
    { bar: "bg-violet-500", card: "border-violet-500/30 bg-violet-500/10", label: "text-violet-700 dark:text-violet-300" },
    { bar: "bg-emerald-500", card: "border-emerald-500/30 bg-emerald-500/10", label: "text-emerald-700 dark:text-emerald-300" },
    { bar: "bg-amber-500", card: "border-amber-500/30 bg-amber-500/10", label: "text-amber-700 dark:text-amber-300" },
    { bar: "bg-cyan-500", card: "border-cyan-500/30 bg-cyan-500/10", label: "text-cyan-700 dark:text-cyan-300" },
  ];
  if (/(^|\b)it(\b|$)|разработ|технолог|инженер|data|devops/.test(value))
    return { bar: "bg-sky-500", card: "border-sky-500/30 bg-sky-500/10", label: "text-sky-700 dark:text-sky-300" };
  if (/(маркет|marketing|дизайн|brand|контент)/.test(value))
    return { bar: "bg-violet-500", card: "border-violet-500/30 bg-violet-500/10", label: "text-violet-700 dark:text-violet-300" };
  if (/(продаж|sales|коммерц|аккаунт)/.test(value))
    return { bar: "bg-emerald-500", card: "border-emerald-500/30 bg-emerald-500/10", label: "text-emerald-700 dark:text-emerald-300" };
  if (/(hr|кадр|персонал|рекрут)/.test(value))
    return { bar: "bg-amber-500", card: "border-amber-500/30 bg-amber-500/10", label: "text-amber-700 dark:text-amber-300" };
  const hash = [...value].reduce((result, character) => result + character.charCodeAt(0), 0);
  return styles[hash % styles.length];
};

function localDateTime(date: Date) {
  const local = new Date(date);
  local.setHours(10, 0, 0, 0);
  const now = new Date();
  if (local.toDateString() === now.toDateString() && local <= now) {
    local.setHours(now.getHours(), Math.ceil((now.getMinutes() + 1) / 15) * 15, 0, 0);
  }
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`;
}

function localDateTimeNow() {
  const now = new Date();
  now.setSeconds(0, 0);
  now.setMinutes(now.getMinutes() + 1);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function CalendarGrid({
  meetings,
  candidates = [],
  vacancies = [],
  canCreate = false,
  onCreateMeeting,
}: {
  meetings: Meeting[];
  candidates?: Candidate[];
  vacancies?: Job[];
  canCreate?: boolean;
  onCreateMeeting?: (draft: MeetingDraft) => Promise<void>;
}) {
  const [mode, setMode] = useState<"week" | "day" | "month">("week");
  const [offset, setOffset] = useState(0);
  const [createDay, setCreateDay] = useState<Date | null>(null);
  const [applicationId, setApplicationId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const anchor = new Date(today);
  anchor.setDate(anchor.getDate() + offset);
  const start = new Date(anchor);

  if (mode === "week") start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  if (mode === "month") {
    start.setDate(1);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  }

  const days = Array.from(
    { length: mode === "month" ? 42 : mode === "week" ? 7 : 1 },
    (_, index) => {
      const day = new Date(start);
      day.setDate(day.getDate() + index);
      return day;
    },
  );
  const schedulableCandidates = candidates.filter(
    (candidate) => candidate.active_application_id,
  );

  function move(direction: number) {
    if (mode === "month") {
      const target = new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      setOffset(Math.round((target.getTime() - todayDate.getTime()) / 86400000));
    } else {
      setOffset((value) => value + direction * (mode === "week" ? 7 : 1));
    }
  }

  function openCreate(day: Date) {
    if (!canCreate || !onCreateMeeting) return;
    setCreateDay(day);
    setApplicationId(schedulableCandidates[0]?.active_application_id ?? "");
    setScheduledAt(localDateTime(day));
    setError("");
  }

  async function submitMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onCreateMeeting || !applicationId || !scheduledAt) return;
    setSaving(true);
    setError("");
    try {
      await onCreateMeeting({
        applicationId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes,
      });
      setCreateDay(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось создать встречу");
    } finally {
      setSaving(false);
    }
  }

  const periodTitle =
    mode === "month"
      ? anchor.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })
      : mode === "week"
        ? `${formatDay(days[0])} — ${formatDay(days[6])}`
        : formatDay(days[0]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button aria-label="Предыдущий период" onClick={() => move(-1)} className="rounded-lg p-2 transition-colors hover:bg-muted">
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-36 font-medium capitalize">{periodTitle}</span>
          <button aria-label="Следующий период" onClick={() => move(1)} className="rounded-lg p-2 transition-colors hover:bg-muted">
            <ChevronRight size={18} />
          </button>
          <button onClick={() => setOffset(0)} className="text-sm font-medium text-cyan-main">
            Сегодня
          </button>
        </div>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: "week", label: "Неделя" },
            { value: "day", label: "День" },
            { value: "month", label: "Месяц" },
          ]}
        />
      </div>
      <Card className="overflow-x-auto">
        <div
          className="grid transition-[grid-template-columns] duration-200 ease-in-out"
          style={{
            gridTemplateColumns: `repeat(${mode === "month" ? 7 : days.length}, minmax(${mode === "month" ? 140 : 190}px, 1fr))`,
          }}
        >
          {days.map((day) => {
            const next = new Date(day);
            next.setDate(next.getDate() + 1);
            const events = meetings.filter((meeting) => {
              const at = new Date(meeting.scheduled_at);
              return at >= day && at < next;
            });
            const isCurrentMonth = day.getMonth() === anchor.getMonth();
            const isPastDay = day < today;
            return (
              <section
                key={day.toISOString()}
                className={`${mode === "month" ? "min-h-36 border-b" : "min-h-72"} ${
                  mode === "month" && !isCurrentMonth ? "opacity-55" : ""
                } space-y-3 border-r border-border p-3`}
              >
                <h3 className="border-b border-border pb-3 text-sm font-semibold capitalize">
                  {formatDay(day)}
                </h3>
                {events.length ? (
                  events.map((meeting) => {
                    const department =
                      vacancies.find((vacancy) => vacancy.title === meeting.position)?.department ||
                      meeting.position;
                    const style = departmentStyle(department);
                    return (
                      <article
                        key={meeting.id}
                        className={`relative overflow-hidden rounded-xl border p-3 pl-4 text-sm shadow-sm transition-shadow hover:shadow-md ${style.card}`}
                      >
                        <span className={`absolute inset-y-0 left-0 w-1 ${style.bar}`} />
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 truncate font-semibold">{meeting.candidate_name}</p>
                          <span className={`shrink-0 text-[11px] font-semibold ${style.label}`}>
                            {new Date(meeting.scheduled_at).toLocaleTimeString("ru-RU", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{meeting.position}</p>
                        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                          <span className="truncate">{meeting.stage}</span>
                          <span className="flex shrink-0 items-center gap-1">
                            <Clock3 size={12} />
                            {meeting.duration_minutes} мин
                          </span>
                        </div>
                        <p className={`mt-2 truncate text-[10px] font-medium ${style.label}`}>{department}</p>
                      </article>
                    );
                  })
                ) : (
                  <button
                    type="button"
                    disabled={!canCreate || !schedulableCandidates.length || isPastDay}
                    onClick={() => openCreate(day)}
                    aria-label={`Запланировать встречу на ${day.toLocaleDateString("ru-RU")}`}
                    className={`group flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-3 text-center transition-colors hover:border-cyan-main/50 hover:bg-cyan-main/5 disabled:cursor-not-allowed disabled:opacity-70 ${
                      mode === "month" ? "min-h-10" : "min-h-24"
                    }`}
                    title={
                      canCreate && !schedulableCandidates.length
                        ? "Нет кандидатов с активной вакансией для встречи"
                        : undefined
                    }
                  >
                    <span className={`flex items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors group-hover:border-cyan-main group-hover:text-cyan-main ${mode === "month" ? "h-6 w-6" : "h-8 w-8"}`}>
                      <Plus size={mode === "month" ? 14 : 16} />
                    </span>
                    <span className={`text-xs text-muted-foreground ${mode === "month" ? "sr-only" : ""}`}>
                      {canCreate ? "Свободный слот · добавить встречу" : "Свободный день"}
                    </span>
                  </button>
                )}
              </section>
            );
          })}
        </div>
      </Card>

      {createDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-interview-title"
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="create-interview-title" className="text-lg font-semibold">Новая встреча</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {createDay.toLocaleDateString("ru-RU", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
              <button type="button" aria-label="Закрыть" onClick={() => setCreateDay(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitMeeting} className="mt-5 space-y-4">
              <label className="block space-y-1.5 text-sm">
                <span>Кандидат и вакансия</span>
                <select
                  required
                  value={applicationId}
                  onChange={(event) => setApplicationId(event.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
                >
                  {schedulableCandidates.map((candidate) => (
                    <option key={candidate.active_application_id} value={candidate.active_application_id!}>
                      {candidate.name || candidate.email} ·{" "}
                      {vacancies.find((vacancy) => vacancy.id === candidate.assigned_vacancy_id)?.title || "Вакансия"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5 text-sm">
                <span>Дата и время</span>
                <input
                  required
                  type="datetime-local"
                  min={localDateTimeNow()}
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
                />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span>Длительность</span>
                <select
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(Number(event.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
                >
                  {[30, 45, 60, 90].map((minutes) => (
                    <option key={minutes} value={minutes}>{minutes} минут</option>
                  ))}
                </select>
              </label>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setCreateDay(null)} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-muted">
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving || !schedulableCandidates.length}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-main px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <CalendarPlus size={16} />
                  {saving ? "Сохраняем..." : "Создать встречу"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
