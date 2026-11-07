import { ChevronRight, MapPin, Users } from "lucide-react";
import { Job, JobStatusBadge } from "@/entities/job";
import { Candidate } from "@/entities/candidate";

export function JobsTable({
  jobs,
  candidates,
  onOpenJob,
  selectedJobId,
}: {
  jobs: Job[];
  candidates: Candidate[];
  onOpenJob: (id: string) => void;
  selectedJobId?: string | null;
}) {
  return (
    <section
      aria-label="Список вакансий"
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      {jobs.map((job) => {
        const count = candidates.filter(
          (candidate) => candidate.assigned_vacancy_id === job.id,
        ).length;
        const selected = selectedJobId === job.id;

        return (
          <button
            key={job.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onOpenJob(job.id)}
            className={`group w-full border-b border-border px-5 py-5 text-left transition-all duration-200 last:border-b-0 hover:bg-muted/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${selected ? "bg-brand-primary/6 shadow-inner ring-1 ring-brand-primary/25" : "bg-card"}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="min-w-0 truncate text-base font-semibold text-foreground">
                {job.title}
              </span>
              <JobStatusBadge status={job.status} />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {job.department || "Отдел не указан"}
            </div>
            <p className="mb-0 mt-3 line-clamp-2 text-sm leading-6 text-foreground-secondary">
              {job.description || "Описание пока не добавлено"}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} />
                {job.location || "Локация не указана"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users size={14} />
                {count} кандидатов
              </span>
              {job.salaryMin != null && (
                <span className="font-medium text-foreground-secondary">
                  {job.salaryMin.toLocaleString()}
                  {job.salaryMax != null
                    ? `–${job.salaryMax.toLocaleString()}`
                    : ""} ₸
                </span>
              )}
              <span className="ml-auto inline-flex items-center gap-1 font-medium text-brand-primary">
                Открыть <ChevronRight size={14} />
              </span>
            </div>
          </button>
        );
      })}
      {!jobs.length && (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Вакансий пока нет или они не подходят под фильтры.
        </div>
      )}
    </section>
  );
}
