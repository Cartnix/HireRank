"use client";

import { useState } from "react";
import { ChevronLeft, Mail, Phone, MapPin, FileText, Paperclip } from "lucide-react";
import { Candidate, StageBadge } from "@/entities/candidate";
import { Job } from "@/entities/job";
import { Note } from "@/entities/note";
import { NoteComposer } from "@/features/add-candidate-note";
import { Card } from "@/shared/ui/Card";
import { Avatar } from "@/shared/ui/Avatar";
import { GhostButton } from "@/shared/ui/buttons/GhostButton";

const tabs = [
  { key: "profile", label: "Анкета" },
  { key: "history", label: "История" },
  { key: "files", label: "Файлы" },
  { key: "notes", label: "Заметки" },
] as const;

export function CandidateProfile({
  candidate,
  job,
  notes,
  noteDraft,
  setNoteDraft,
  addNote,
  onBack,
}: {
  candidate: Candidate;
  job: Job;
  notes: Note[];
  noteDraft: string;
  setNoteDraft: (v: string) => void;
  addNote: () => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<"profile" | "history" | "files" | "notes">("profile");
  const q = candidate.questionnaire;

  return (
    <div>
      <button onClick={onBack} className="mb-5 flex items-center gap-1 text-[13px] font-medium text-foreground-secondary hover:text-foreground">
        <ChevronLeft size={15} /> Все кандидаты
      </button>

      <div className="grid grid-cols-3 gap-5">
        <Card className="h-fit p-6">
          <div className="mb-4 flex flex-col items-center text-center">
            <Avatar name={candidate.name} size={64} />
            <div className="mt-3 text-[17px] font-semibold">{candidate.name}</div>
            <div className="text-[13px] text-foreground-secondary">{job?.title}</div>
            <div className="mt-2">
              <StageBadge stage={candidate.stage} />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                {candidate.status === "assigned" ? "Назначен" : "Не назначен"}
              </span>
              {candidate.ai_score != null && (
                <span className="rounded-full bg-brand-primary/10 px-2.5 py-1 text-[11px] font-medium text-brand-primary">
                  AI score {candidate.ai_score.toFixed(1)}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2.5 border-t border-border pt-4 text-[13px]">
            <div className="flex items-center gap-2 text-foreground-secondary">
              <Mail size={14} /> {candidate.email}
            </div>
            <div className="flex items-center gap-2 text-foreground-secondary">
              <Phone size={14} /> {candidate.phone}
            </div>
            <div className="flex items-center gap-2 text-foreground-secondary">
              <MapPin size={14} /> {candidate.location}
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <div className="mb-2 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">Навыки</div>
            <div className="flex flex-wrap gap-1.5">
              {candidate.skills.map((s) => (
                <span key={s} className="rounded-full bg-muted px-2.5 py-1 text-[12px] text-muted-foreground">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </Card>

        <div className="col-span-2">
          <div className="mb-4 inline-flex rounded-[10px] border border-border bg-background p-1">
            {tabs.map((item) => {
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key as typeof tab)}
                  className={`rounded-lg px-3 py-2 text-[12.5px] font-medium transition-colors ${
                    active ? "bg-brand-primary text-brand-primary-foreground" : "text-foreground-secondary hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {tab === "profile" && (
            <Card className="p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">Основные данные</div>
                  <div className="space-y-2 text-[13px] text-foreground-secondary">
                    <div><span className="font-medium text-foreground">Дата рождения:</span> {q.birth_date || "—"}</div>
                    <div><span className="font-medium text-foreground">Место рождения:</span> {q.birth_place || "—"}</div>
                    <div><span className="font-medium text-foreground">Национальность:</span> {q.nationality || "—"}</div>
                    <div><span className="font-medium text-foreground">Гражданство:</span> {q.citizenship || "—"}</div>
                    <div><span className="font-medium text-foreground">Языки:</span> {q.languages || "—"}</div>
                    <div><span className="font-medium text-foreground">Уровень образования:</span> {q.education_level || "—"}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">Образование</div>
                  {q.education.length === 0 ? (
                    <div className="text-[13px] text-muted-foreground">Данных об образовании пока нет.</div>
                  ) : (
                    <div className="space-y-2">
                      {q.education.map((entry, index) => (
                        <div key={`${entry.institution}-${index}`} className="rounded-[10px] border border-border bg-muted/40 p-3">
                          <div className="text-[13px] font-medium text-foreground">{entry.institution}</div>
                          <div className="text-[12px] text-muted-foreground">
                            {entry.year_from}–{entry.year_to} · {entry.specialty}
                          </div>
                          <div className="mt-1 text-[12px] text-foreground-secondary">{entry.diploma}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 rounded-[10px] border border-border bg-muted/30 p-4">
                <div className="mb-2 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">AI Match по вакансиям</div>
                {candidate.ai_rankings && candidate.ai_rankings.length > 0 ? (
                  <div className="space-y-2">
                    {candidate.ai_rankings.map((item) => (
                      <div key={item.vacancy_id} className="flex items-center justify-between rounded-lg bg-background px-3 py-2">
                        <span className="text-[13px] text-foreground-secondary">{item.vacancy_title}</span>
                        <span className="text-[13px] font-semibold text-brand-primary">{item.score.toFixed(1)}/10</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[13px] text-muted-foreground">Пока нет оценок совместимости.</div>
                )}
              </div>
            </Card>
          )}

          {tab === "history" && (
            <Card className="p-6">
              <div className="space-y-4">
                {candidate.history.map((h, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-brand-primary" />
                      {idx !== candidate.history.length - 1 && <div className="w-px flex-1 bg-border" />}
                    </div>
                    <div className="pb-4">
                      <div className="text-[13px] font-medium">{h.action}</div>
                      <div className="text-[12px] text-muted-foreground">{h.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === "files" && (
            <Card className="p-6">
              <div className="flex items-center justify-between rounded-[10px] border border-border px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-danger/10 text-danger">
                    <FileText size={16} />
                  </div>
                  <div>
                    <div className="text-[13px] font-medium">{candidate.resumeFileName}</div>
                    <div className="text-[12px] text-muted-foreground">Резюме · загружено {candidate.appliedDate}</div>
                  </div>
                </div>
                <GhostButton icon={<Paperclip size={13} />}>Открыть</GhostButton>
              </div>
            </Card>
          )}

          {tab === "notes" && (
            <Card className="p-6">
              <div className="mb-4 space-y-3">
                {notes.length === 0 && <div className="text-[13px] text-muted-foreground">Заметок пока нет.</div>}
                {notes.map((n) => (
                  <div key={n.id} className="rounded-[10px] bg-muted/60 p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[12.5px] font-semibold">{n.author}</span>
                      <span className="text-[11.5px] text-muted-foreground">{n.date}</span>
                    </div>
                    <div className="text-[13px] text-foreground-secondary">{n.text}</div>
                  </div>
                ))}
              </div>
              <NoteComposer value={noteDraft} onChange={setNoteDraft} onSubmit={addNote} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
