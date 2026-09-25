"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, MoreHorizontal, Trash2 } from "lucide-react";
import { DEFAULT_STAGES, deleteVacancy, Job, JobStatusBadge, Stage } from "@/entities/job";
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
}: {
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
      await deleteVacancy(job.id);
      setIsMenuOpen(false);
      onDeleteJob?.(job.id);
      onBack();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Не удалось удалить вакансию");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-1 text-[13px] font-medium text-foreground-secondary hover:text-foreground"
      >
        <ChevronLeft size={15} /> Все вакансии
      </button>

      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="text-[26px] font-bold tracking-tight">
              {job.title}
            </div>
            <JobStatusBadge status={job.status} />
          </div>
          <div className="mt-1 text-[13.5px] text-foreground-secondary">
            {job.department} · {job.location} · {job.employmentType}
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
                disabled={isDeleting}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-danger hover:bg-muted disabled:opacity-50"
              >
                <Trash2 size={14} />
                {isDeleting ? "Удаление..." : "Удалить вакансию"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Переработанная плашка метаданных */}
      <div className="mb-6 flex flex-wrap items-center gap-2.5">
        {job.salaryMin != null && job.salaryMax != null ? (
          <span className="rounded-full border border-brand-primary/20 bg-brand-primary/10 px-3 py-1 text-[12px] font-medium text-brand-primary">
            💰 {job.salaryMin.toLocaleString()}–{job.salaryMax.toLocaleString()}
          </span>
        ) : null}

        {job.experience ? (
          <span className="rounded-full bg-muted px-3 py-1 text-[12px] font-medium text-foreground-secondary">
            📈 Опыт: {job.experience}
          </span>
        ) : null}

        {job.department ? (
          <span className="rounded-full bg-muted px-3 py-1 text-[12px] font-medium text-foreground-secondary">
            🏢 {job.department}
          </span>
        ) : null}

        <span className="rounded-full bg-muted px-3 py-1 text-[12px] font-medium text-foreground-secondary">
          👥 Кандидатов: {candidates.length}
        </span>

        {job.createdAt ? (
          <span className="ml-auto text-[12px] text-muted-foreground">
            Создано: {job.createdAt}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2">
          <Card className="p-6">
            <div className="mb-3 text-[15px] font-semibold">
              Описание вакансии
            </div>
            <p className="mb-0 max-w-none text-[13.5px] leading-relaxed text-foreground-secondary">
              {job.description}
            </p>

            <div className="my-5 border-t border-border" />

            <div className="mb-4 flex items-center justify-between">
              <div className="text-[15px] font-semibold">
                Кандидаты по вакансии ({candidates.length})
              </div>
            </div>
            <div className="divide-y divide-border">
              {candidates.length === 0 && (
                <div className="py-6 text-center text-[13px] text-muted-foreground">
                  Пока нет кандидатов на эту позицию.
                </div>
              )}
              {candidates.map((c) => {
                const fullName = getCandidateFullName(c);
                return (
                  <div
                    key={c.id}
                    onClick={() => onOpenCandidate(c.id)}
                    className="flex cursor-pointer items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:opacity-80"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={fullName} size={32} />
                      <div>
                        <div className="text-[13.5px] font-medium">{fullName}</div>
                        <div className="text-[12px] text-foreground-secondary">
                          {new Date(c.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <StageBadge stage={c.status} />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <StagesEditor
          stages={job.stages ?? DEFAULT_STAGES}
          onChange={onUpdateStages}
        />
      </div>
    </div>
  );
}