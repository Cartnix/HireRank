import {
  ArrowUpRight,
  Banknote,
  BriefcaseBusiness,
  Clock3,
  MapPin,
  Users,
} from "lucide-react";
import { Job, JobStatusBadge } from "@/entities/job";
import { Candidate } from "@/entities/candidate";

export function JobsTable({
  jobs,
  candidates,
  onOpenJob,
}: {
  jobs: Job[];
  candidates: Candidate[];
  onOpenJob: (id: string) => void;
}) {
  return (
    <section aria-label="Список вакансий">
      {jobs.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => {
            const count = candidates.filter(
              (candidate) => candidate.assigned_vacancy_id === job.id,
            ).length;
            const createdAt = job.createdAt
              ? new Date(job.createdAt).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : null;
            const employmentTypeLabels: Record<
              NonNullable<Job["employmentType"]>,
              string
            > = {
              "full-time": "Полная занятость",
              "part-time": "Частичная занятость",
              internship: "Стажировка",
            };
            const employmentType = job.employmentType
              ? employmentTypeLabels[job.employmentType]
              : "Полная занятость";
            const salary =
              job.salaryMin != null || job.salaryMax != null
                ? `${job.salaryMin?.toLocaleString() ?? "от"}${job.salaryMax != null ? `–${job.salaryMax.toLocaleString()}` : ""} ₸`
                : "от 500 000 ₸";
            const experience = job.experience || "От 3 лет";
            const visibleRequirements = job.requirements.slice(0, 3);

            return (
              <button
                key={job.id}
                type="button"
                aria-label={`Открыть вакансию ${job.title}`}
                onClick={() => onOpenJob(job.id)}
                className="group flex min-h-[340px] flex-col justify-between rounded-2xl border border-border bg-card/80 p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-primary/35 hover:bg-card hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="flex flex-1 flex-col">
                  <span className="flex w-full items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block line-clamp-2 text-lg font-semibold leading-snug text-foreground">
                        {job.title}
                      </span>
                    </span>
                    <JobStatusBadge status={job.status} />
                  </span>
                  <span className="mt-1.5 block truncate text-sm text-muted-foreground">
                    {job.department || "Без отдела"}
                  </span>

                  <span className="mt-4 min-h-[60px] line-clamp-3 text-sm leading-5 text-foreground-secondary">
                    {job.description || "Описание вакансии пока не добавлено."}
                  </span>

                  <span className="mt-4 grid grid-cols-2 gap-2">
                    {[
                      {
                        icon: BriefcaseBusiness,
                        value: employmentType,
                        example: !job.employmentType,
                        label: "Формат работы",
                      },
                      {
                        icon: Clock3,
                        value: experience,
                        example: !job.experience,
                        label: "Опыт",
                      },
                      {
                        icon: Banknote,
                        value: salary,
                        example: job.salaryMin == null && job.salaryMax == null,
                        label: "Зарплата",
                      },
                      ...(job.location
                        ? [
                            {
                              icon: MapPin,
                              value: job.location,
                              example: false,
                              label: "Локация",
                            },
                          ]
                        : []),
                    ].map(({ icon: Icon, value, example, label }) => (
                      <span
                        key={label}
                        title={`${label}: ${value}${example ? " (пример)" : ""}`}
                        className="flex min-w-0 items-center gap-2 rounded-lg bg-muted/35 px-2.5 py-2 text-xs"
                      >
                        <Icon
                          size={14}
                          className="shrink-0 text-muted-foreground"
                        />
                        <span className="min-w-0 truncate text-foreground-secondary">
                          {value}
                        </span>
                        {example && (
                          <span className="shrink-0 text-[10px] text-muted-foreground/70">
                            *
                          </span>
                        )}
                      </span>
                    ))}
                  </span>

                  {visibleRequirements.length > 0 && (
                    <span className="mt-4 flex min-h-7 flex-wrap content-start gap-1.5">
                      {visibleRequirements.map((requirement) => (
                        <span
                          key={requirement}
                          className="max-w-full truncate rounded-md border border-border bg-background/50 px-2 py-1 text-[11px] text-foreground-secondary"
                        >
                          {requirement}
                        </span>
                      ))}
                      {job.requirements.length > visibleRequirements.length && (
                        <span className="rounded-md bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground">
                          +{job.requirements.length - visibleRequirements.length}
                        </span>
                      )}
                    </span>
                  )}
                </span>
                <span className="mt-5 flex w-full items-center justify-between border-t border-border/70 pt-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={13} />
                    {count} кандидатов
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    {createdAt ?? "Дата не указана"}
                    <ArrowUpRight
                      size={13}
                      className="text-brand-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center text-sm text-muted-foreground">
          Вакансий пока нет или они не подходят под фильтры.
        </div>
      )}
    </section>
  );
}
