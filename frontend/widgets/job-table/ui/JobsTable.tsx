import { ChevronRight } from "lucide-react";
import { Job, JobStatusBadge } from "@/entities/job";
import { Candidate } from "@/entities/candidate";
import { Card } from "@/shared/ui/card";

const EMPLOYMENT_LABELS: Record<NonNullable<Job["employmentType"]>, string> = {
  "full-time": "Полная",
  "part-time": "Частичная",
  internship: "Стажировка",
};

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
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-[13.5px]">
          <thead className="bg-muted/40">
            <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3.5">Вакансия</th>
              <th className="px-5 py-3.5">Отдел</th>
              <th className="px-5 py-3.5">Зарплата</th>
              <th className="px-5 py-3.5">Условия</th>
              <th className="px-5 py-3.5">Статус</th>
              <th className="px-5 py-3.5">Кандидаты</th>
              <th className="w-10 px-3 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => {
              const count = candidates.filter(
                (candidate) => candidate.assigned_vacancy_id === job.id,
              ).length;
              const hasSalary = job.salaryMin != null && job.salaryMax != null;

              return (
                <tr
                  key={job.id}
                  onClick={() => onOpenJob(job.id)}
                  className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-muted/50"
                >
                  <td className="max-w-[300px] px-5 py-4">
                    <div className="truncate font-semibold text-foreground">
                      {job.title}
                    </div>
                    <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {job.description}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-foreground-secondary">
                    {job.department || "—"}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-foreground">
                    {hasSalary ? (
                      `${job.salaryMin!.toLocaleString()}–${job.salaryMax!.toLocaleString()} ₸`
                    ) : (
                      <span className="font-normal text-muted-foreground">
                        Не указана
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-foreground-secondary">
                    <div>{job.location ?? "Локация не указана"}</div>
                    {job.employmentType && (
                      <div className="mt-1 text-muted-foreground">
                        {EMPLOYMENT_LABELS[job.employmentType]}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <JobStatusBadge status={job.status} />
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-muted px-2 py-1 text-xs font-semibold tabular-nums text-foreground-secondary">
                      {count}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-right">
                    <ChevronRight
                      size={16}
                      className="ml-auto text-muted-foreground"
                    />
                  </td>
                </tr>
              );
            })}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center">
                  <div className="text-sm font-medium text-foreground">
                    Вакансии не найдены
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Измените запрос или выберите другой статус.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}