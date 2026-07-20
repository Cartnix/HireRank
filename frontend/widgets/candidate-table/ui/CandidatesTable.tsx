import { Star } from "lucide-react";
import { Candidate, StageBadge } from "@/entities/candidate";
import { Job } from "@/entities/job";
import { Card } from "@/shared/ui/Card";
import { Avatar } from "@/shared/ui/Avatar";

export function CandidatesTable({
  candidates,
  jobById,
  onOpenCandidate,
}: {
  candidates: Candidate[];
  jobById: Record<string, Job>;
  onOpenCandidate: (id: string) => void;
}) {
  return (
    <Card>
      <table className="w-full text-left text-[13.5px]">
        <thead>
          <tr className="border-b border-border text-[12px] uppercase tracking-wide text-muted-foreground">
            <th className="px-5 py-3 font-medium">Кандидат</th>
            <th className="px-5 py-3 font-medium">Вакансия</th>
            <th className="px-5 py-3 font-medium">Этап</th>
            <th className="px-5 py-3 font-medium">Навыки</th>
            <th className="px-5 py-3 font-medium">Источник</th>
            <th className="px-5 py-3 font-medium">Рейтинг</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => (
            <tr
              key={c.id}
              onClick={() => onOpenCandidate(c.id)}
              className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/60"
            >
              <td className="px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={c.name} size={30} />
                  <span className="font-medium">{c.name}</span>
                </div>
              </td>
              <td className="px-5 py-3 text-foreground-secondary">{jobById[c.jobId]?.title}</td>
              <td className="px-5 py-3">
                <StageBadge stage={c.stage} />
              </td>
              <td className="px-5 py-3">
                <div className="flex flex-wrap gap-1">
                  {c.skills.slice(0, 2).map((s) => (
                    <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-[11.5px] text-muted-foreground">
                      {s}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-5 py-3 text-foreground-secondary">{c.source}</td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={i < c.rating ? "fill-warning text-warning" : "text-muted"}
                    />
                  ))}
                </div>
              </td>
            </tr>
          ))}
          {candidates.length === 0 && (
            <tr>
              <td colSpan={6} className="px-5 py-8 text-center text-[13px] text-muted-foreground">
                Ничего не найдено. Попробуйте изменить фильтры.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}
