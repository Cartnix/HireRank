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
    <Card>
      <table className="w-full text-left text-[13.5px]">
        <thead>
          <tr className="border-b border-border text-[12px] uppercase tracking-wide text-muted-foreground">
            <th className="px-5 py-3 font-medium">Название</th>
            <th className="px-5 py-3 font-medium">Отдел</th>
            <th className="px-5 py-3 font-medium">Зарплата</th>
            <th className="px-5 py-3 font-medium">Условия</th>
            <th className="px-5 py-3 font-medium">Статус</th>
            <th className="px-5 py-3 font-medium">Кандидаты</th>
            <th className="px-5 py-3 font-medium">Создана</th>
            <th className="px-5 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const count = candidates.filter((c) => c.jobId === job.id).length;
            const hasSalary = job.salaryMin != null && job.salaryMax != null;

            return (
              <tr
                key={job.id}
                onClick={() => onOpenJob(job.id)}
                className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/60 transition-colors"
              >
                {/* Название вакансии */}
                <td className="px-5 py-3.5 font-medium text-foreground">{job.title}</td>

                {/* Отдел */}
                <td className="px-5 py-3.5 text-foreground-secondary">{job.department}</td>

                {/* Зарплатная вилка */}
                <td className="px-5 py-3.5 font-medium text-foreground">
                  {hasSalary
                    ? `${job.salaryMin!.toLocaleString()}–${job.salaryMax!.toLocaleString()} ₸`
                    : <span className="text-muted-foreground font-normal">—</span>}
                </td>

                {/* Условия (Локация и Тип занятости) */}
                <td className="px-5 py-3.5 text-foreground-secondary">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-foreground">{job.location ?? "—"}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">
                      {job.employmentType ? EMPLOYMENT_LABELS[job.employmentType] : "—"}
                    </span>
                  </div>
                </td>

                {/* Статус */}
                <td className="px-5 py-3.5">
                  <JobStatusBadge status={job.status} />
                </td>

                {/* Количество кандидатов */}
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground-secondary">
                    {count}
                  </span>
                </td>

                {/* Дата создания */}
                <td className="px-5 py-3.5 text-xs text-muted-foreground">{job.createdAt ?? "—"}</td>

                {/* Стрелочка перехода */}
                <td className="px-5 py-3.5 text-right">
                  <ChevronRight size={16} className="ml-auto text-muted-foreground" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}