import { ChevronRight, Users, MapPin } from "lucide-react";
import { Job, JobStatusBadge } from "@/entities/job";
import { Candidate } from "@/entities/candidate";

export function JobsTable({ jobs, candidates, onOpenJob }: { jobs: Job[]; candidates: Candidate[]; onOpenJob: (id: string) => void }) {
  return <section aria-label="Список вакансий" className="grid gap-3">{jobs.map(job => {
    const count = candidates.filter(candidate => candidate.assigned_vacancy_id === job.id).length;
    return <button key={job.id} type="button" onClick={() => onOpenJob(job.id)} className="group w-full rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-brand-primary focus-visible:ring-2 focus-visible:ring-ring">
      <div className="flex flex-wrap items-start justify-between gap-3"><span className="text-base font-semibold">{job.title}</span><JobStatusBadge status={job.status} /></div>
      <p className="mb-0 mt-2 text-xs text-muted-foreground">{job.department || "Отдел не указан"}</p>
      <p className="mb-0 mt-3 line-clamp-2 text-sm text-foreground-secondary">{job.description || "Описание пока не добавлено"}</p>
      {job.salaryMin != null && <p className="mb-0 mt-3 text-sm font-medium">{job.salaryMin.toLocaleString()}{job.salaryMax != null ? `–${job.salaryMax.toLocaleString()}` : ""} ₸</p>}
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><MapPin size={14} />{job.location || "Локация не указана"}</span><span className="inline-flex items-center gap-1"><Users size={14} />{count} кандидатов</span><span className="ml-auto inline-flex items-center gap-1 font-medium text-brand-primary">Подробнее<ChevronRight size={14} /></span></div>
    </button>;
  })}{!jobs.length && <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Вакансий пока нет или они не подходят под фильтры.</div>}</section>;
}
