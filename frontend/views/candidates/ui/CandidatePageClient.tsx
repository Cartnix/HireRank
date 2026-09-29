"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Clock3, Plus, Users, UserX } from "lucide-react";
import { CandidateProfile } from "@/widgets/candidate-profile";
import { SearchInput } from "@/features/search-candidates/ui/SearchInputCandidate";
import { StageFilter } from "@/features/filter-candidates/ui/StageFilter";
import { CandidatesTable } from "@/widgets/candidate-table/ui/CandidatesTable";
import type { Job } from "@/entities/job";
import { useCandidatesPage } from "@/features/candidate-page";
import { IntakeTab } from "@/features/hr-copilot/ui/tabs/IntakeTab";
import { intake } from "@/features/hr-copilot/model/engine";
import {
  toDashboardCandidate,
  toDashboardJob,
} from "@/features/hr-copilot/model/dashboardAdapters";
import {
  loadCopilotState,
  saveCopilotState,
} from "@/features/hr-copilot/model/storage";
import type { CopilotState } from "@/features/hr-copilot/model/types";
import { MainButton } from "@/shared/ui/buttons/MainButton";
import { SectionTitle } from "@/shared/ui/SectionTitle";

export function CandidatesPageClient({
  currentUserName,
  initialSelectedCandidateId = null,
}: {
  currentUserName: string;
  initialSelectedCandidateId?: string | null;
}) {
  const router = useRouter();
  const [copilotState, setCopilotState] = useState<CopilotState | null>(null);
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [formMessage, setFormMessage] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setCopilotState(loadCopilotState());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const tenantId = copilotState?.tenants[0]?.id ?? "";
  const vacancies = useMemo(
    () =>
      copilotState?.vacancies.filter(
        (vacancy) => vacancy.tenantId === tenantId,
      ) ?? [],
    [copilotState, tenantId],
  );
  const jobById = useMemo(
    () =>
      Object.fromEntries(
        vacancies.map((vacancy) => [vacancy.id, toDashboardJob(vacancy)]),
      ) as Record<string, Job>,
    [vacancies],
  );
  const candidates = useMemo(
    () =>
      copilotState?.candidates
        .filter((candidate) => candidate.tenantId === tenantId)
        .map((candidate) =>
          toDashboardCandidate(
            candidate,
            vacancies.find(
              (vacancy) =>
                vacancy.id ===
                (candidate.vacancyId ?? candidate.requestedVacancyId),
            ),
          ),
        ) ?? [],
    [copilotState, tenantId, vacancies],
  );

  function submitIntake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!copilotState || !tenantId) return;

    const form = event.currentTarget;
    const values = new FormData(form);
    const file = form.querySelector<HTMLInputElement>(
      'input[name="resumeFile"]',
    )?.files?.[0];
    const resumeText = String(values.get("resumeText") ?? "").trim();
    const resumeRef =
      file?.name ||
      String(values.get("resumeUrl") ?? "").trim() ||
      (resumeText ? "Текст в HTML форме" : "");

    if (!resumeRef) {
      setFormMessage("Добавьте файл, ссылку или текст резюме");
      return;
    }
    if (file && !/\.(pdf|docx?|html?|txt)$/i.test(file.name)) {
      setFormMessage("Доступны PDF, DOC, DOCX, HTML и TXT");
      return;
    }

    const next = structuredClone(copilotState);
    try {
      const created = intake(next, tenantId, "hr", {
        name: String(values.get("name") ?? "").trim(),
        email: String(values.get("email") ?? "")
          .trim()
          .toLowerCase(),
        phone: String(values.get("phone") ?? "").trim(),
        experience: String(values.get("experience") ?? "").trim(),
        skills: String(values.get("skills") ?? "").trim(),
        resumeRef,
        resumeText,
        requestedVacancyId: String(values.get("vacancyId") ?? "") || null,
      });
      saveCopilotState(next);
      setCopilotState(next);
      setIsIntakeOpen(false);
      router.push(`/dashboard/candidates/${created.id}`);
    } catch (error) {
      setFormMessage(
        error instanceof Error
          ? error.message
          : "Не удалось добавить кандидата",
      );
    }
  }

  const {
    search,
    setSearch,
    stageFilter,
    setStageFilter,
    filteredCandidates,
    openCandidate,
    selectedCandidate,
    selectedJob,
    notes,
    noteDraft,
    setNoteDraft,
    addNote,
    back,
  } = useCandidatesPage(
    candidates,
    jobById,
    currentUserName,
    initialSelectedCandidateId,
  );

  if (!copilotState) return <div>Loading...</div>;

  if (selectedCandidate && selectedJob) {
    return (
      <main className="w-full p-6">
        <CandidateProfile
          candidate={selectedCandidate}
          job={selectedJob}
          notes={notes}
          noteDraft={noteDraft}
          setNoteDraft={setNoteDraft}
          addNote={addNote}
          onBack={back}
        />
      </main>
    );
  }

  const candidateStats = [
    {
      label: "Всего кандидатов",
      value: candidates.length,
      icon: Users,
      color: "text-brand-primary bg-brand-primary/10",
    },
    {
      label: "Без назначения",
      value: candidates.filter((candidate) => candidate.status === "unassigned")
        .length,
      icon: Clock3,
      color: "text-warning bg-warning/10",
    },
    {
      label: "В работе",
      value: candidates.filter((candidate) => candidate.status === "assigned")
        .length,
      icon: CircleCheck,
      color: "text-success bg-success/10",
    },
    {
      label: "Отклонены",
      value: candidates.filter((candidate) => candidate.status === "rejected")
        .length,
      icon: UserX,
      color: "text-muted-foreground bg-muted",
    },
  ];

  return (
    <div className="px-6 md:px-10 lg:px-15 space-y-8 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle
          title="Кандидаты"
          subtitle="Кандидатский пул компании и текущий этап рассмотрения."
        />
        <MainButton
          onClick={() => {
            setFormMessage("");
            setIsIntakeOpen(true);
          }}
          title="Добавить кандидата"
          className="h-10 gap-2 rounded-lg px-4"
        >
          <Plus size={15} />
        </MainButton>
      </header>

      <section
        aria-label="Сводка по кандидатам"
        className="grid grid-cols-2 divide-x divide-y divide-border border-y border-border sm:grid-cols-4 sm:divide-y-0"
      >
        {candidateStats.map(({ label, value, icon: Icon, color }) => (
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
        aria-label="Поиск и фильтры"
        className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="w-full lg:max-w-sm">
          <SearchInput value={search} onChange={setSearch} />
        </div>
        <div className="min-w-0 flex-1 lg:pl-3">
          <StageFilter value={stageFilter} onChange={setStageFilter} />
        </div>
        <div className="shrink-0 border-t border-border pt-3 text-xs text-muted-foreground lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
          Найдено{" "}
          <span className="font-semibold text-foreground">
            {filteredCandidates.length}
          </span>{" "}
          из {candidates.length}
        </div>
      </section>

      <CandidatesTable
        candidates={filteredCandidates}
        jobById={jobById}
        onOpenCandidate={openCandidate}
      />
      {isIntakeOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Добавить кандидата"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
        >
          <div className="my-auto w-full max-w-5xl rounded-xl bg-background p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Новый кандидат</h2>
              <button
                onClick={() => setIsIntakeOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Закрыть
              </button>
            </div>
            {formMessage && (
              <p
                role="alert"
                className="mb-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
              >
                {formMessage}
              </p>
            )}
            <IntakeTab vacancies={vacancies} submitIntake={submitIntake} />
          </div>
        </div>
      )}
    </div>
  );
}
