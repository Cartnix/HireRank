"use client";

import { useState } from "react";
import {
  BriefcaseBusiness,
  CircleCheck,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { Job, Stage } from "@/entities/job";
import { Candidate } from "@/entities/candidate";
import { MainButton } from "@/shared/ui/buttons/MainButton";
import { DetailPanel } from "@/shared/ui/DetailPanel";
import { JobOverview } from "@/widgets/job-overview/ui/JobOverview";
import { JobsTable } from "@/widgets/job-table/ui/JobsTable";
import { SectionTitle } from "@/shared/ui/SectionTitle";

export const JobsView = ({
  jobs,
  candidates,
  selectedJob,
  onOpenJob,
  onBack,
  onCreateJob,
  onUpdateStages,
  onOpenCandidate,
  onDeleteJob,
  canCreate = false, canUpdate = false, canDelete = false, onUpdateJob,
}: {
  canCreate?: boolean; canUpdate?: boolean; canDelete?: boolean;
  onUpdateJob?: (id: string, payload: import("@/shared/api/ats").VacancyUpdate) => Promise<void>;
  jobs: Job[];
  candidates: Candidate[];
  selectedJob: Job | null;
  onOpenJob: (id: string) => void;
  onBack: () => void;
  onCreateJob: () => void;
  onUpdateStages: (stages: Stage[]) => void;
  onOpenCandidate: (id: string) => void;
  onDeleteJob?: (id: string) => Promise<void>;
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">(
    "all",
  );

  const openJobs = jobs.filter(
    (job) => job.status === "open" || job.status === "Открыта",
  ).length;
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = `${job.title} ${job.department}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    const isOpen = job.status === "open" || job.status === "Открыта";
    return (
      matchesSearch &&
      (statusFilter === "all" || (statusFilter === "open" ? isOpen : !isOpen))
    );
  });

  return (
    <div className="px-6 md:px-10 lg:px-15 space-y-8 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle
          title="Вакансии"
          subtitle="Управляйте позициями и отслеживайте поток кандидатов."
        />
        {canCreate && <MainButton
          onClick={onCreateJob}
          title="Создать вакансию"
          className="h-10 gap-2 rounded-lg px-4"
        >
          <Plus size={15} />
        </MainButton>}
      </header>

      <section
        aria-label="Сводка по вакансиям"
        className="grid grid-cols-2 divide-x divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-y-0"
      >
        {[
          {
            label: "Всего позиций",
            value: jobs.length,
            icon: BriefcaseBusiness,
            color: "text-brand-primary bg-brand-primary/10",
          },
          {
            label: "Активные",
            value: openJobs,
            icon: CircleCheck,
            color: "text-success bg-success/10",
          },
          {
            label: "Кандидатов",
            value: candidates.length,
            icon: Users,
            color: "text-warning bg-warning/10",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="flex min-w-0 items-center gap-3 px-3 py-4 first:pl-0 sm:px-5 sm:first:pl-0"
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}
            >
              <Icon size={17} />
            </div>
            <div className="min-w-0">
              <div className="text-xl font-semibold leading-none tabular-nums text-foreground">
                {value}
              </div>
              <div className="mt-1 truncate text-xs text-muted-foreground">
                {label}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section
        aria-label="Поиск и фильтры вакансий"
        className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:p-4 md:flex-row md:items-center md:justify-between"
      >
        <label className="relative block w-full md:max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по вакансии или отделу"
            aria-label="Поиск по вакансиям"
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
          />
        </label>
        <div
          className="flex items-center gap-1 overflow-x-auto"
          aria-label="Статус вакансии"
        >
          {(
            [
              ["all", "Все"],
              ["open", "Активные"],
              ["closed", "Закрытые"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`shrink-0 rounded-full px-3 py-2 text-xs font-medium transition-colors ${
                statusFilter === value
                  ? "bg-brand-primary text-brand-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="shrink-0 text-xs text-muted-foreground">
          Найдено{" "}
          <span className="font-semibold text-foreground">
            {filteredJobs.length}
          </span>{" "}
          из {jobs.length}
        </div>
      </section>

      <div className="inspector-workspace"><div className="min-w-0 flex-1">
      <JobsTable
        jobs={filteredJobs}
        candidates={candidates}
        selectedJobId={selectedJob?.id}
        onOpenJob={onOpenJob}
      />
      </div>{selectedJob && <div className="inspector-dock"><DetailPanel title="Детали вакансии" onClose={onBack}>
      <JobOverview
        canUpdate={canUpdate} canDelete={canDelete} onUpdateJob={onUpdateJob}
        job={selectedJob}
        candidates={candidates.filter(
          (c) => c.assigned_vacancy_id === selectedJob.id,
        )}
        onBack={onBack}
        onUpdateStages={onUpdateStages}
        onOpenCandidate={onOpenCandidate}
        onDeleteJob={onDeleteJob}
      />
      </DetailPanel></div>}</div>
    </div>
  );
};
