"use client";

import { useEffect, useRef, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  Clock3,
  MapPin,
  MoreHorizontal,
  Trash2,
  Users,
} from "lucide-react";
import { deleteVacancy, Job, JobStatusBadge, Stage } from "@/entities/job";
import { Candidate, getCandidateFullName, StageBadge } from "@/entities/candidate";
import { StagesEditor } from "@/features/manage-job-stages";
import { Card } from "@/shared/ui/card";
import { GhostButton } from "@/shared/ui/buttons/GhostButton";
import { Avatar } from "@/shared/ui/Avatar";

export function JobOverview({
  job,
  candidates,
  onBack,
  onUpdateStages,
  onOpenCandidate,
  onDeleteJob,
  canUpdate = true, canDelete = true, onUpdateJob,
}: {
  canUpdate?: boolean; canDelete?: boolean;
  onUpdateJob?: (id: string, payload: import("@/shared/api/ats").VacancyUpdate) => Promise<void>;
  job: Job;
  candidates: Candidate[];
  onBack: () => void;
  onUpdateStages: (stages: Stage[]) => void;
  onOpenCandidate: (id: string) => void;
  onDeleteJob?: (id: string) => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const handleDelete = async () => {
    if (!confirm(`Удалить вакансию «${job.title}»? Это действие необратимо.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      if (onDeleteJob) await onDeleteJob(job.id);
      else await deleteVacancy(job.id);
      setIsMenuOpen(false);
      onBack();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Не удалось удалить вакансию");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[13px] font-medium text-foreground-secondary transition-colors hover:text-foreground"
      >
        <ChevronLeft size={15} /> Все вакансии
      </button>

      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div className="min-w-0">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-primary">
            Детали позиции
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
              {job.title}
            </h1>
            <JobStatusBadge status={job.status} />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-foreground-secondary">
            {job.department && <span>{job.department}</span>}
            {job.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} /> {job.location}
              </span>
            )}
            {job.employmentType && (
              <span className="inline-flex items-center gap-1.5">
                <BriefcaseBusiness size={14} /> {job.employmentType}
              </span>
            )}
          </div>
        </div>

        <div ref={menuRef} className="relative">
          <GhostButton
            icon={<MoreHorizontal size={15} />}
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            Действия
          </GhostButton>

          {isMenuOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-lg border border-border bg-background py-1 shadow-lg">
              <button
                onClick={handleDelete}
                disabled={isDeleting || !canDelete}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-danger hover:bg-muted disabled:opacity-50"
              >
                <Trash2 size={14} />
                {isDeleting ? "Удаление..." : "Удалить вакансию"}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border pb-5 text-sm">
        {job.salaryMin != null && job.salaryMax != null && (
          <div>
            <div className="text-[11px] font-medium uppercase text-muted-foreground">Зарплата</div>
            <div className="mt-1 font-semibold text-foreground">
              {job.salaryMin.toLocaleString()}–{job.salaryMax.toLocaleString()} ₸
            </div>
          </div>
        )}
        {job.experience && (
          <div>
            <div className="text-[11px] font-medium uppercase text-muted-foreground">Опыт</div>
            <div className="mt-1 inline-flex items-center gap-1.5 font-medium text-foreground">
              <Clock3 size={14} className="text-muted-foreground" /> {job.experience}
            </div>
          </div>
        )}
        <div>
          <div className="text-[11px] font-medium uppercase text-muted-foreground">Кандидаты</div>
          <div className="mt-1 inline-flex items-center gap-1.5 font-semibold text-foreground">
            <Users size={14} className="text-muted-foreground" /> {candidates.length}
          </div>
        </div>
        {job.createdAt && (
          <div className="ml-auto">
            <div className="text-[11px] font-medium uppercase text-muted-foreground">Создана</div>
            <div className="mt-1 inline-flex items-center gap-1.5 text-foreground-secondary">
              <CalendarDays size={14} /> {job.createdAt}
            </div>
          </div>
        )}
      </div>

      {canUpdate && onUpdateJob && <form key={job.id + (job.status ?? "")} onSubmit={event => {
        event.preventDefault(); const form = new FormData(event.currentTarget);
        void onUpdateJob(job.id, { title: String(form.get("title")), department: String(form.get("department")), description: String(form.get("description")), requirements: String(form.get("requirements")).split("\n").map(s => s.trim()).filter(Boolean), status: String(form.get("status")) as "draft" | "open" | "closed" });
      }} className="rounded-xl border border-border p-4 space-y-3">
        <details><summary className="cursor-pointer text-sm font-medium">Редактировать вакансию</summary>
          <div className="mt-3 grid gap-3">
            <input aria-label="Название" name="title" required maxLength={255} defaultValue={job.title} className="rounded-lg border border-input bg-background p-2" />
            <input aria-label="Отдел" name="department" maxLength={255} defaultValue={job.department} className="rounded-lg border border-input bg-background p-2" />
            <textarea aria-label="Описание" name="description" defaultValue={job.description} className="rounded-lg border border-input bg-background p-2" />
            <textarea aria-label="Требования, по одному на строку" name="requirements" defaultValue={job.requirements.join("\n")} className="rounded-lg border border-input bg-background p-2" />
            <select aria-label="Статус вакансии" name="status" defaultValue={job.status} className="rounded-lg border border-input bg-background p-2"><option value="draft">Черновик</option><option value="open">Открыта</option><option value="closed">Закрыта</option></select>
            <button type="submit" className="text-brand-primary">Сохранить</button>
          </div>
        </details>
      </form>}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="p-5 sm:p-6">
          <section>
            <h2 className="text-sm font-semibold text-foreground">Описание вакансии</h2>
            <p className="mt-3 whitespace-pre-line text-[13.5px] leading-6 text-foreground-secondary">
              {job.description || "Описание пока не добавлено."}
            </p>
          </section>

          <section className="mt-6 border-t border-border pt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground">
                Кандидаты по вакансии
              </h2>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium tabular-nums text-foreground-secondary">
                {candidates.length}
              </span>
            </div>
            <div className="divide-y divide-border">
              {candidates.length === 0 && (
                <div className="py-8 text-center text-[13px] text-muted-foreground">
                  Пока нет кандидатов на эту позицию.
                </div>
              )}
              {candidates.map((candidate) => {
                const fullName = getCandidateFullName(candidate);
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => onOpenCandidate(candidate.id)}
                    className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-muted/40"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar name={fullName} size={34} />
                      <span className="min-w-0">
                        <span className="block truncate text-[13.5px] font-medium text-foreground">
                          {fullName}
                        </span>
                        <span className="mt-0.5 block text-xs text-foreground-secondary">
                          {new Date(candidate.created_at).toLocaleDateString()}
                        </span>
                      </span>
                    </span>
                    <StageBadge stage={candidate.stage ?? candidate.status} />
                  </button>
                );
              })}
            </div>
          </section>
        </Card>

        <aside>
          <StagesEditor
            demo
            stages={job.stages ?? []}
            onChange={onUpdateStages}
          />
        </aside>
      </div>
    </div>
  );
}