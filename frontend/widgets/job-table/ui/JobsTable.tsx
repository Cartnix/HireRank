import { ChevronRight } from "lucide-react";
import { Job, JobStatusBadge } from "@/entities/job";
import { Candidate } from "@/entities/candidate";
import { Card } from "@/shared/ui/Card";

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
            <th className="px-5 py-3 font-medium">Мета</th>
            <th className="px-5 py-3 font-medium">Статус</th>
            <th className="px-5 py-3 font-medium">Кандидаты</th>
            <th className="px-5 py-3 font-medium">Создана</th>
            <th className="px-5 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const count = candidates.filter((c) => c.jobId === job.id).length;
            return (
              <tr
                key={job.id}
                onClick={() => onOpenJob(job.id)}
                className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/60"
              >
                <td className="px-5 py-3.5 font-medium">{job.title}</td>
                <td className="px-5 py-3.5 text-foreground-secondary">{job.department}</td>
                <td className="px-5 py-3.5 text-foreground-secondary">
                  <div className="line-clamp-2 max-w-60">
                    {job.salaryMin && job.salaryMax ? `${job.salaryMin.toLocaleString()}–${job.salaryMax.toLocaleString()} ${job.currency ?? "KZT"}` : "—"}
                  </div>
                  <div className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {job.workMode ?? "—"} · {job.experienceLevel ?? "—"}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <JobStatusBadge status={job.status} />
                </td>
                <td className="px-5 py-3.5 text-foreground-secondary">{count}</td>
                <td className="px-5 py-3.5 text-foreground-secondary">{job.createdAt}</td>
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
