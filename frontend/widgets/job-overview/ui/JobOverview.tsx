"use client";

import { useDemo } from "@/features/demo/DemoProvider";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Banknote,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Clock3,
  Copy,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { deleteVacancy, Job, JobStatusBadge, Stage } from "@/entities/job";
import { Candidate, getCandidateFullName, StageBadge } from "@/entities/candidate";
import { StagesEditor } from "@/features/manage-job-stages";
import { Card } from "@/shared/ui/card";
import { Avatar } from "@/shared/ui/Avatar";

const candidateStatusLabels: Record<string, string> = {
  unassigned: "Без назначения",
  assigned: "В работе",
  rejected: "Отклонён",
  pending_hitl: "На рассмотрении",
  action_applied: "Обработан",
};

const employmentTypeLabels: Record<string, string> = {
  "full-time": "Полная занятость",
  "part-time": "Частичная занятость",
  internship: "Стажировка",
};

export function JobOverview({
  job,
  candidates,
  onBack,
  onUpdateStages,
  onOpenCandidate,
  onDeleteJob,
  canUpdate = false,
  canDelete = false,
  onUpdateJob,
}: {
  canUpdate?: boolean;
  canDelete?: boolean;
  onUpdateJob?: (id: string, payload: import("@/shared/api/ats").VacancyUpdate) => Promise<void>;
  job: Job;
  candidates: Candidate[];
  onBack: () => void;
  onUpdateStages: (stages: Stage[]) => void;
  onOpenCandidate: (id: string) => void;
  onDeleteJob?: (id: string) => void;
}) {
  const { enabled } = useDemo();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [shareError, setShareError] = useState("");
  const [candidateFilter, setCandidateFilter] = useState("all");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const stages = useMemo(() => {
    const counts = new Map<string, number>();
    candidates.forEach((candidate) => {
      const stage =
        candidate.current_stage_name ||
        candidate.stage ||
        candidateStatusLabels[candidate.status] ||
        candidate.status;
      counts.set(stage, (counts.get(stage) ?? 0) + 1);
    });
    const stageNames = job.stages?.length
      ? [...job.stages]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((stage) => stage.stage_name)
      : [...counts.keys()];
    const allStageNames = [...new Set([...stageNames, ...counts.keys()])];
    return allStageNames.map((name) => ({ name, count: counts.get(name) ?? 0 }));
  }, [candidates, job.stages]);

  const filteredCandidates =
    candidateFilter === "all"
      ? candidates
      : candidates.filter((candidate) => candidate.status === candidateFilter);

  const handleShare = async () => {
    setIsSharing(true);
    setShareMessage("");
    setShareError("");
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareMessage("Ссылка скопирована");
    } catch {
      setShareError("Не удалось скопировать ссылку");
    } finally {
      setIsSharing(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete || !confirm(`Удалить вакансию «${job.title}»? Это действие необратимо.`)) return;
    setIsDeleting(true);
    try {
      if (onDeleteJob) await onDeleteJob(job.id);
      else await deleteVacancy(job.id);
      setIsMenuOpen(false);
      onBack();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Не удалось удалить вакансию");
    } finally {
      setIsDeleting(false);
    }
  };

  const formattedSalary =
    job.salaryMin != null || job.salaryMax != null
      ? `${job.salaryMin?.toLocaleString() ?? "от"}${job.salaryMax != null ? `–${job.salaryMax.toLocaleString()}` : ""} ₸`
      : "Не указана";
  const publicationDate = job.createdAt
    ? new Date(job.createdAt).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Не указана";

  return (
    <div className="space-y-6 pb-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-foreground-secondary transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} /> Назад к вакансиям
      </button>

      <header className="space-y-4 rounded-2xl border border-border bg-card/70 p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="m-0 text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
            {job.title}
          </h1>
          <JobStatusBadge status={job.status} />
        </div>
        <p className="m-0 text-sm text-muted-foreground">
          {job.department || "Отдел не указан"}
        </p>
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          {[
            { icon: Banknote, label: "Зарплата", value: formattedSalary },
            { icon: Clock3, label: "Опыт", value: job.experience || "Не указан" },
            {
              icon: BriefcaseBusiness,
              label: "Занятость",
              value: job.employmentType
                ? employmentTypeLabels[job.employmentType] ?? job.employmentType
                : "Не указана",
            },
          ].map(({ icon: Icon, label, value }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/70 px-3 py-2 text-xs"
            >
              <Icon size={14} className="text-brand-primary" />
              <span className="text-muted-foreground">{label}:</span>
              <span className="font-medium text-foreground">{value}</span>
            </span>
          ))}
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
        <main className="min-w-0 space-y-5">
          <Card className="p-5 sm:p-6">
            <h2 className="m-0 text-base font-semibold text-foreground">Описание вакансии</h2>
            <p className="mb-0 mt-4 max-w-3xl whitespace-pre-line text-sm leading-7 text-foreground-secondary">
              {job.description || "Описание пока не добавлено."}
            </p>
            <section className="mt-6 border-t border-border pt-5">
              <h2 className="m-0 text-base font-semibold text-foreground">Требования</h2>
              {!job.requirements.length ? (
                <p className="mb-0 mt-3 text-sm text-muted-foreground">
                  Требования пока не добавлены.
                </p>
              ) : (
                <ul className="mb-0 mt-4 space-y-3 pl-5 text-sm leading-6 text-foreground-secondary marker:text-brand-primary">
                  {job.requirements.map((requirement, index) => (
                    <li key={`${index}-${requirement}`}>{requirement}</li>
                  ))}
                </ul>
              )}
            </section>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="m-0 text-base font-semibold text-foreground">Кандидаты на вакансию</h2>
                <p className="mb-0 mt-1 text-xs text-muted-foreground">
                  Кандидаты, привязанные к этой позиции
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/dashboard/candidates")}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-primary px-3 text-xs font-medium text-brand-primary-foreground transition-colors hover:bg-brand-primary-hover"
              >
                <Plus size={14} /> Добавить кандидата
              </button>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <span className="text-xs text-muted-foreground">
                Всего: <strong className="text-foreground">{candidates.length}</strong>
              </span>
              <select
                aria-label="Фильтр кандидатов по статусу"
                value={candidateFilter}
                onChange={(event) => setCandidateFilter(event.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground"
              >
                <option value="all">Все статусы</option>
                {Object.entries(candidateStatusLabels).map(([status, label]) => (
                  <option key={status} value={status}>{label}</option>
                ))}
              </select>
            </div>
            <div className="divide-y divide-border">
              {!filteredCandidates.length ? (
                <p className="mb-0 py-8 text-center text-sm text-muted-foreground">
                  {candidates.length
                    ? "Нет кандидатов с таким статусом."
                    : "Пока нет кандидатов на эту позицию."}
                </p>
              ) : (
                filteredCandidates.map((candidate) => {
                  const fullName = getCandidateFullName(candidate);
                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => onOpenCandidate(candidate.id)}
                      className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-muted/40"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar name={fullName} size={36} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-foreground">{fullName}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {new Date(candidate.created_at).toLocaleDateString("ru-RU")}
                          </span>
                        </span>
                      </span>
                      <StageBadge
                        stage={
                          candidate.current_stage_name ||
                          candidate.stage ||
                          candidateStatusLabels[candidate.status] ||
                          candidate.status
                        }
                      />
                    </button>
                  );
                })
              )}
            </div>
          </Card>
        </main>

        <aside className="min-w-0 space-y-5 lg:sticky lg:top-5">
          <Card className="space-y-3 p-5">
            <h2 className="m-0 text-sm font-semibold text-foreground">Быстрые действия</h2>
            <button
              type="button"
              onClick={handleShare}
              disabled={isSharing}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
            >
              {shareMessage ? <Check size={15} /> : <Copy size={15} />}
              {isSharing ? "Копируем..." : shareMessage || "Поделиться ссылкой"}
            </button>
            {shareError && <p role="alert" className="m-0 text-xs text-danger">{shareError}</p>}
            {canUpdate && onUpdateJob && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing((editing) => !editing)}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <Pencil size={15} /> {isEditing ? "Скрыть редактирование" : "Редактировать"}
                </button>
                <label className="block space-y-1.5 pt-1 text-xs text-muted-foreground">
                  Изменить статус
                  <select
                    aria-label="Изменить статус вакансии"
                    value={job.status}
                    onChange={(event) => {
                      void onUpdateJob(job.id, {
                        status: event.target.value as "draft" | "open" | "closed",
                      });
                    }}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                  >
                    <option value="draft">Черновик</option>
                    <option value="open">Открыта</option>
                    <option value="closed">Закрыта</option>
                  </select>
                </label>
              </>
            )}
            {canDelete && (
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((open) => !open)}
                  className="flex h-9 w-full items-center justify-center gap-2 rounded-lg text-xs text-muted-foreground transition-colors hover:bg-danger/5 hover:text-danger"
                >
                  <MoreHorizontal size={15} /> Действия
                </button>
                {isMenuOpen && (
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={isDeleting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-danger/20 px-3 py-2 text-xs text-danger hover:bg-danger/5 disabled:opacity-50"
                  >
                    <Trash2 size={14} /> {isDeleting ? "Удаление..." : "Удалить вакансию"}
                  </button>
                )}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="m-0 text-sm font-semibold text-foreground">Воронка кандидатов</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-2.5 py-1 text-xs font-semibold text-brand-primary">
                <Users size={13} /> {candidates.length}
              </span>
            </div>
            {stages.length ? (
              <div className="mt-4 space-y-3">
                {stages.map((stage, index) => {
                  const max = Math.max(1, ...stages.map((item) => item.count));
                  return (
                    <div key={stage.name}>
                      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                        <span className="truncate text-foreground-secondary">{stage.name}</span>
                        <span className="font-semibold tabular-nums text-foreground">{stage.count}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${["bg-sky-400", "bg-indigo-400", "bg-violet-400", "bg-emerald-400"][index % 4]}`}
                          style={{ width: `${(stage.count / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mb-0 mt-4 text-xs text-muted-foreground">Этапы появятся вместе с кандидатами.</p>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="m-0 text-sm font-semibold text-foreground">Информация о вакансии</h2>
            <dl className="mb-0 mt-4 space-y-4 text-xs">
              <div>
                <dt className="text-muted-foreground">Ответственный HR</dt>
                <dd className="mb-0 mt-1 font-medium text-foreground">{job.recruiter || "Не указан"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Дата публикации</dt>
                <dd className="mb-0 mt-1 inline-flex items-center gap-1.5 font-medium text-foreground">
                  <CalendarDays size={13} /> {publicationDate}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Локация</dt>
                <dd className="mb-0 mt-1 inline-flex items-center gap-1.5 font-medium text-foreground">
                  <MapPin size={13} /> {job.location || "Не указана"}
                </dd>
              </div>
            </dl>
          </Card>

          {isEditing && canUpdate && onUpdateJob && (
            <Card className="p-5">
              <form
                key={job.id + (job.status ?? "")}
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  void onUpdateJob(job.id, {
                    title: String(form.get("title")),
                    department: String(form.get("department")),
                    description: String(form.get("description")),
                    requirements: String(form.get("requirements"))
                      .split("\n")
                      .map((value) => value.trim())
                      .filter(Boolean),
                    status: String(form.get("status")) as "draft" | "open" | "closed",
                  });
                }}
                className="space-y-3"
              >
                <h2 className="m-0 text-sm font-semibold">Редактировать вакансию</h2>
                <input aria-label="Название" name="title" required maxLength={255} defaultValue={job.title} className="w-full rounded-lg border border-input bg-background p-2 text-sm" />
                <input aria-label="Отдел" name="department" maxLength={255} defaultValue={job.department} className="w-full rounded-lg border border-input bg-background p-2 text-sm" />
                <textarea aria-label="Описание" name="description" defaultValue={job.description} className="min-h-24 w-full rounded-lg border border-input bg-background p-2 text-sm" />
                <textarea aria-label="Требования, по одному на строку" name="requirements" defaultValue={job.requirements.join("\n")} className="min-h-24 w-full rounded-lg border border-input bg-background p-2 text-sm" />
                <select aria-label="Статус вакансии" name="status" defaultValue={job.status} className="w-full rounded-lg border border-input bg-background p-2 text-sm">
                  <option value="draft">Черновик</option>
                  <option value="open">Открыта</option>
                  <option value="closed">Закрыта</option>
                </select>
                <button type="submit" className="h-9 w-full rounded-lg bg-brand-primary text-sm font-medium text-brand-primary-foreground">Сохранить</button>
              </form>
            </Card>
          )}

          {enabled && canUpdate && (
            <StagesEditor demo stages={job.stages ?? []} onChange={onUpdateStages} />
          )}
        </aside>
      </div>
    </div>
  );
}
