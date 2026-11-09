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

  if (selectedJob) {
    return (
      <div className="space-y-6 px-2 pb-12 md:px-4">
        <JobOverview
          canUpdate={canUpdate}
          canDelete={canDelete}
          onUpdateJob={onUpdateJob}
          job={selectedJob}
          candidates={candidates.filter(
            (candidate) => candidate.assigned_vacancy_id === selectedJob.id,
          )}
          onBack={onBack}
          onUpdateStages={onUpdateStages}
          onOpenCandidate={onOpenCandidate}
          onDeleteJob={onDeleteJob}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 pb-12 md:px-4">
      <SectionTitle
        title="Вакансии"
        subtitle="Управляйте позициями и отслеживайте поток кандидатов."
        variant="plain"
        action={
          canCreate ? (
            <MainButton
              onClick={onCreateJob}
              title="Создать вакансию"
              className="h-10 gap-2 rounded-xl px-4 shadow-sm"
            >
              <Plus size={15} />
            </MainButton>
          ) : undefined
        }
      />

      <section
        aria-label="Сводка по вакансиям"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
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
            className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card/80 p-3 shadow-sm sm:p-3.5"
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
        className="rounded-xl border border-border bg-card/80 p-3 shadow-sm"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative block w-full lg:max-w-sm">
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
            className="flex w-fit items-center gap-1 overflow-x-auto rounded-lg border border-border bg-muted/20 p-1"
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
                className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="shrink-0 text-xs text-muted-foreground lg:ml-auto">
            Найдено{" "}
            <span className="font-semibold text-foreground">
              {filteredJobs.length}
            </span>{" "}
            из {jobs.length} вакансий
          </div>
        </div>
      </section>

      <JobsTable
        jobs={filteredJobs}
        candidates={candidates}
        onOpenJob={onOpenJob}
      />
    </div>
  );
};
