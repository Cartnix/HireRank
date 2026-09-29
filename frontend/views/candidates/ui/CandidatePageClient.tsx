"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
      copilotState?.vacancies.filter((vacancy) => vacancy.tenantId === tenantId) ?? [],
    [copilotState, tenantId],
  );
  const jobById = useMemo(
    () =>
      Object.fromEntries(vacancies.map((vacancy) => [vacancy.id, toDashboardJob(vacancy)])) as Record<string, Job>,
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
    const file = form.querySelector<HTMLInputElement>('input[name="resumeFile"]')?.files?.[0];
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
        email: String(values.get("email") ?? "").trim().toLowerCase(),
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
      setFormMessage(error instanceof Error ? error.message : "Не удалось добавить кандидата");
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
      <CandidateProfile
        candidate={selectedCandidate}
        job={selectedJob}
        notes={notes}
        noteDraft={noteDraft}
        setNoteDraft={setNoteDraft}
        addNote={addNote}
        onBack={back}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <SearchInput value={search} onChange={setSearch} />
          <StageFilter value={stageFilter} onChange={setStageFilter} />
        </div>
        <MainButton
          onClick={() => {
            setFormMessage("");
            setIsIntakeOpen(true);
          }}
          title="Добавить кандидата"
        >
          <Plus size={15} />
        </MainButton>
      </div>
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
              <p role="alert" className="mb-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
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