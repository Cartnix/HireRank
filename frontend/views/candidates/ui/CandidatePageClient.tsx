"use client";
import { useDemo } from "@/features/demo/DemoProvider";
import { DemoCandidates } from "@/features/demo/DemoCandidates";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Clock3, Plus, Users, UserX } from "lucide-react";
import { CandidateProfile } from "@/widgets/candidate-profile";
import { CandidateEvaluationPanel } from "@/features/candidate-evaluation/ui/CandidateEvaluationPanel";
import { SearchInput } from "@/features/search-candidates/ui/SearchInputCandidate";
import { StageFilter } from "@/features/filter-candidates/ui/StageFilter";
import { CandidatesTable } from "@/widgets/candidate-table/ui/CandidatesTable";
import type { Job } from "@/entities/job";
import { useCandidatesPage } from "@/features/candidate-page";
import { IntakeTab } from "@/features/hr-copilot/ui/tabs/IntakeTab";
import { useAtsData } from "@/shared/api/useAtsData";
import { assignCandidate, createCandidate, deleteCandidate, updateCandidateStage, updateQuestionnaire } from "@/shared/api/ats";
import { MainButton } from "@/shared/ui/buttons/MainButton";
import { SectionTitle } from "@/shared/ui/SectionTitle";

function LiveCandidatesPageClient({
  currentUserName,
  initialSelectedCandidateId = null,
}: {
  currentUserName: string;
  initialSelectedCandidateId?: string | null;
}) {
  const router = useRouter();
  const { candidates, jobs, user, can, loading, error, reload } = useAtsData(initialSelectedCandidateId);
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [jobFilter, setJobFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("default");
  const [drawerTab, setDrawerTab] = useState<"profile" | "ai" | "job">("profile");
  const [saving, setSaving] = useState(false);
  const jobById = useMemo(() => Object.fromEntries(jobs.map(job => [job.id, job])) as Record<string, Job>, [jobs]);
  const vacancies = jobs.map(job => ({ id: job.id, title: job.title, open: job.status === "open" }));
  const needsGeminiAttestation = ["hr", "administrator", "superuser"].includes(user?.role ?? "");

  async function submitIntake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || (!can("candidate.create") && user?.role !== "candidate")) return;
    const values = new FormData(event.currentTarget);
    const file = event.currentTarget.querySelector<HTMLInputElement>('input[name="resumeFile"]')?.files?.[0];
    if (file) { setFormMessage("Загрузка файлов ожидает backend. Введите текст резюме или ссылку; файл сейчас не будет сохранён."); return; }
    const resumeText = String(values.get("resumeText") ?? "").trim();
    const resumeUrl = String(values.get("resumeUrl") ?? "").trim();
    const geminiConsentAttested = values.get("geminiConsent") === "on";
    if (!resumeText && !resumeUrl) { setFormMessage("Введите текст резюме или ссылку"); return; }
    if (values.get("processingConsent") !== "on") { setFormMessage("Подтвердите согласие на обработку данных"); return; }
    if (needsGeminiAttestation && !geminiConsentAttested) { setFormMessage("Подтвердите, что кандидат уже дал согласие на трансграничную обработку для Gemini"); return; }
    setSaving(true); setFormMessage("");
    try {
      const questionnaire = { name: String(values.get("name") ?? "").trim(), email: String(values.get("email") ?? "").trim(), location: String(values.get("location") ?? "").trim(), phone: String(values.get("phone") ?? "").trim(), experience: String(values.get("experience") ?? "").trim(), skills: String(values.get("skills") ?? "").trim(), resume_text: resumeText, resume_reference: resumeUrl || null, requested_vacancy_id: String(values.get("vacancyId") ?? "") || null, processing_consent: true };
      let created;
      if (user?.role === "candidate") {
        const own = candidates.find(candidate => candidate.user_id === user.id);
        if (!own) throw Error("Профиль кандидата не найден. Обратитесь к администратору.");
        created = await updateQuestionnaire(own.id, { ...own.questionnaire, ...questionnaire });
      } else created = await createCandidate({ questionnaire, email: questionnaire.email, resume_url: resumeUrl || null, gemini_consent_attested: needsGeminiAttestation && geminiConsentAttested });
      setIsIntakeOpen(false); reload(); router.push(`/dashboard/candidates/${created.id}`);
    } catch (e) { setFormMessage(e instanceof Error ? e.message : "Не удалось сохранить анкету"); }
    finally { setSaving(false); }
  }

  const {
    search,
    setSearch,
    stageFilter,
    setStageFilter,
    stageOptions,
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
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email || currentUserName,
    initialSelectedCandidateId,
  );

  const skills = [...new Set(candidates.flatMap(candidate => (candidate.skills ?? String((candidate.questionnaire as unknown as Record<string, unknown>).skills ?? "").split(/[,;]/)).map(skill => skill.trim()).filter(Boolean)))].sort();
  const displayedCandidates = filteredCandidates.filter(candidate => !skillFilter || (candidate.skills ?? String((candidate.questionnaire as unknown as Record<string, unknown>).skills ?? "").split(/[,;]/)).some(skill => skill.trim().toLowerCase() === skillFilter.toLowerCase())).sort((a, b) => sortOrder === "name" ? (a.name ?? a.email).localeCompare(b.name ?? b.email, "ru") : sortOrder === "score" ? (b.ai_score ?? 0) - (a.ai_score ?? 0) : 0);
  const visibleCandidates = displayedCandidates.filter(candidate =>
    !jobFilter || candidate.assigned_vacancy_id === jobFilter,
  );
  const handleOpenCandidate = (id: string) => {
    setDrawerTab("profile");
    openCandidate(id);
  };

  if (loading) return <div>Загрузка кандидатов...</div>;
  if (error) return <div role="alert">{error}<button onClick={reload} className="ml-3 text-brand-primary">Повторить</button></div>;
  if (!can("candidate.read")) return <p role="alert">Нет доступа к кандидатскому пулу</p>;
  if (initialSelectedCandidateId && !selectedCandidate) return <p role="alert">Кандидат не найден</p>;

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
    <div className="space-y-6 px-6 pb-12 md:px-10 lg:px-15">
      <SectionTitle
        badge="Talent pipeline"
        title="Кандидаты"
        subtitle="Кандидатский пул компании и текущий этап рассмотрения."
        action={
          (can("candidate.create") || user?.role === "candidate") ? (
            <MainButton
              onClick={() => {
                setFormMessage("");
                setIsIntakeOpen(true);
              }}
              title="Добавить кандидата"
              className="h-11 gap-2 rounded-xl px-4 shadow-sm"
            >
              <Plus size={15} />
            </MainButton>
          ) : undefined
        }
      />

      {!selectedCandidate && <section
        aria-label="Сводка по кандидатам"
        className="grid grid-cols-2 gap-3 xl:grid-cols-4"
      >
        {candidateStats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="flex min-h-24 min-w-0 items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-brand-primary/25"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}
            >
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-semibold leading-none tabular-nums text-foreground">
                {value}
              </div>
              <div className="mt-1 truncate text-xs text-muted-foreground">
                {label}
              </div>
            </div>
          </div>
        ))}
      </section>}

      <section
        aria-label="Поиск и фильтры"
        className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
      >
        <div className="grid gap-3 xl:grid-cols-12 xl:items-center">
          <div className="min-w-0 xl:col-span-3">
            <SearchInput value={search} onChange={setSearch} />
          </div>
          <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-background px-3 py-2.5 xl:col-span-3">
            <StageFilter
              value={stageFilter}
              onChange={setStageFilter}
              stages={stageOptions}
            />
          </div>
          <label className="flex h-11 min-w-0 items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 text-xs text-muted-foreground xl:col-span-2">
              Навык
              <select className="min-w-0 max-w-[60%] bg-transparent text-right text-sm text-foreground outline-none" value={skillFilter} onChange={event => setSkillFilter(event.target.value)}>
                <option value="">Все навыки</option>
                {skills.map(skill => <option key={skill}>{skill}</option>)}
              </select>
          </label>
          <label className="flex h-11 min-w-0 items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 text-xs text-muted-foreground xl:col-span-2">
              Вакансия
              <select className="min-w-0 max-w-[65%] bg-transparent text-right text-sm text-foreground outline-none" value={jobFilter} onChange={event => setJobFilter(event.target.value)}>
                <option value="">Все вакансии</option>
                {jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}
              </select>
          </label>
          <label className="flex h-11 min-w-0 items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 text-xs text-muted-foreground xl:col-span-2">
              Сортировка
              <select className="min-w-0 max-w-[60%] bg-transparent text-right text-sm text-foreground outline-none" value={sortOrder} onChange={event => setSortOrder(event.target.value)}>
                <option value="default">По умолчанию</option>
                <option value="name">По имени</option>
                <option value="score">По оценке</option>
              </select>
          </label>
          <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground xl:col-span-12">
            <span>Фильтры кандидатов</span>
            <span>
              Найдено{" "}
              <span className="font-semibold text-foreground">{visibleCandidates.length}</span>
              {" "}из {candidates.length}
            </span>
          </div>
        </div>
      </section>

      {selectedCandidate ? (
        <div className="grid min-h-[680px] items-start gap-4 lg:grid-cols-[minmax(260px,0.34fr)_minmax(0,0.66fr)]">
          <aside className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:sticky lg:top-4">
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="m-0 text-sm font-semibold text-foreground">Пул кандидатов</h2>
                <p className="mb-0 mt-0.5 text-xs text-muted-foreground">{visibleCandidates.length} найдено</p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs tabular-nums text-muted-foreground">{candidates.length}</span>
            </header>
            <div className="max-h-[calc(100vh-250px)] min-h-64 space-y-1 overflow-y-auto p-2">
              {visibleCandidates.map(candidate => {
                const active = candidate.id === selectedCandidate.id;
                const name = candidate.name || candidate.email;
                const stage = candidate.current_stage_name || candidate.stage || candidate.status;
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => handleOpenCandidate(candidate.id)}
                    aria-current={active ? "true" : undefined}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                      active
                        ? "border-brand-primary/25 bg-brand-primary/5"
                        : "border-transparent hover:border-border hover:bg-muted/40"
                    }`}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
                        <span className="mt-1 block truncate text-xs text-muted-foreground">
                          {jobById[candidate.assigned_vacancy_id ?? ""]?.title || "Без назначения"}
                        </span>
                      </span>
                      {candidate.ai_score != null && (
                        <span className="shrink-0 rounded-md bg-brand-primary/10 px-1.5 py-1 text-[10px] font-semibold text-brand-primary">
                          {candidate.ai_score.toFixed(1)}
                        </span>
                      )}
                    </span>
                    <span className="mt-2 block truncate text-[11px] text-muted-foreground">{stage}</span>
                  </button>
                );
              })}
              {!visibleCandidates.length && (
                <p className="p-3 text-sm text-muted-foreground">Нет кандидатов по выбранным фильтрам.</p>
              )}
            </div>
            <button
              type="button"
              onClick={back}
              className="w-full border-t border-border px-4 py-3 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            >
              ← Вернуться к списку
            </button>
          </aside>

          <section
            aria-labelledby="candidate-drawer-title"
            className="flex min-h-[680px] min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
          >
            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-7">
              <div className="min-w-0">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-primary">
                  Карточка кандидата
                </p>
                <h2 id="candidate-drawer-title" className="m-0 truncate text-lg font-semibold text-foreground">
                  {selectedCandidate.name || selectedCandidate.email}
                </h2>
                <p className="mb-0 mt-1 truncate text-xs text-muted-foreground">
                  {selectedJob?.title || "Без назначения"}
                </p>
              </div>
              <button
                type="button"
                onClick={back}
                className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Закрыть
              </button>
            </header>
            <nav aria-label="Разделы карточки кандидата" className="flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-muted/20 px-4 py-2 sm:px-6">
              {([
                ["profile", "Анкета"],
                ["ai", "HR Copilot / AI-анализ"],
                ["job", "Вакансия"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={drawerTab === key}
                  onClick={() => setDrawerTab(key)}
                  className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    drawerTab === key
                      ? "bg-brand-primary text-brand-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              {formMessage && (
                <p role="alert" className="mb-4 rounded-xl border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
                  {formMessage}
                </p>
              )}
              {drawerTab === "profile" && (
                <div className="space-y-4">
                  {(can("application.assign") || can("candidate.update") || can("candidate.delete") || user?.role === "candidate") && (
                    <section aria-label="Действия с кандидатом" className="space-y-3 rounded-xl border border-border bg-card p-3">
                      {can("application.assign") && (
                        <form className="flex flex-wrap gap-2" onSubmit={async event => {
                          event.preventDefault();
                          if (saving) return;
                          const vacancyId = String(new FormData(event.currentTarget).get("vacancyId") ?? "");
                          if (!vacancyId || !confirm("Подтвердить назначение кандидата на выбранную вакансию?")) return;
                          setSaving(true); setFormMessage("");
                          try { await assignCandidate(selectedCandidate.id, vacancyId); reload(); }
                          catch (e) { setFormMessage(e instanceof Error ? e.message : "Не удалось назначить кандидата"); }
                          finally { setSaving(false); }
                        }}>
                          <select name="vacancyId" required aria-label="Вакансия для назначения" className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm">
                            <option value="">Выберите открытую вакансию</option>
                            {jobs.filter(job => job.status === "open").map(job => <option key={job.id} value={job.id}>{job.title}</option>)}
                          </select>
                          <button type="submit" disabled={saving} className="h-10 rounded-lg bg-brand-primary px-4 text-sm font-medium text-brand-primary-foreground disabled:opacity-50">Назначить</button>
                        </form>
                      )}
                      {(can("candidate.update") || user?.role === "candidate") && (
                        <details className="rounded-lg border border-border bg-background">
                          <summary className="cursor-pointer px-3 py-2.5 text-sm font-medium">Редактировать анкету</summary>
                          <div className="border-t border-border p-3">
                            <IntakeTab mvp busy={saving} initialValues={selectedCandidate.questionnaire as unknown as Record<string, unknown>} vacancies={vacancies} submitIntake={async event => {
                              event.preventDefault(); if (saving) return;
                              const values = new FormData(event.currentTarget);
                              if (values.get("processingConsent") !== "on") return;
                              setSaving(true); setFormMessage("");
                              try {
                                const questionnaire = { ...selectedCandidate.questionnaire, name: String(values.get("name") ?? ""), email: String(values.get("email") ?? ""), location: String(values.get("location") ?? "").trim(), phone: String(values.get("phone") ?? ""), experience: String(values.get("experience") ?? ""), skills: String(values.get("skills") ?? ""), resume_text: String(values.get("resumeText") ?? ""), resume_reference: String(values.get("resumeUrl") ?? "") || null, requested_vacancy_id: String(values.get("vacancyId") ?? "") || null, processing_consent: true };
                                if (!questionnaire.resume_text.trim() && !questionnaire.resume_reference) throw Error("Введите текст резюме или ссылку");
                                await updateQuestionnaire(selectedCandidate.id, questionnaire); reload();
                              } catch (e) { setFormMessage(e instanceof Error ? e.message : "Не удалось обновить анкету"); }
                              finally { setSaving(false); }
                            }} />
                          </div>
                        </details>
                      )}
                      {can("candidate.delete") && (
                        <button type="button" disabled={saving} className="rounded-lg border border-danger/20 px-3 py-2 text-sm text-danger hover:bg-danger/5 disabled:opacity-50" onClick={async () => {
                          if (!confirm("Удалить кандидата?")) return;
                          setSaving(true); setFormMessage("");
                          try { await deleteCandidate(selectedCandidate.id); back(); reload(); }
                          catch (e) { setFormMessage(e instanceof Error ? e.message : "Не удалось удалить кандидата"); }
                          finally { setSaving(false); }
                        }}>Удалить кандидата</button>
                      )}
                    </section>
                  )}
                  <CandidateProfile
                    key={`${selectedCandidate.id}-${selectedCandidate.current_stage_id ?? "unassigned"}`}
                    candidate={selectedCandidate}
                    job={selectedJob}
                    stages={selectedJob?.stages ?? []}
                    canChangeStage={can("application.assign")}
                    savingStage={saving}
                    onChangeStage={async (stageId, scheduledAt) => {
                      if (!selectedCandidate.assigned_vacancy_id || saving) return;
                      setSaving(true); setFormMessage("");
                      try {
                        await updateCandidateStage(selectedCandidate.id, selectedCandidate.assigned_vacancy_id, stageId, scheduledAt);
                        reload();
                      } catch (e) {
                        setFormMessage(e instanceof Error ? e.message : "Не удалось изменить этап кандидата");
                      } finally { setSaving(false); }
                    }}
                    notes={notes}
                    noteDraft={noteDraft}
                    setNoteDraft={setNoteDraft}
                    addNote={addNote}
                    onBack={back}
                    drawerMode
                    showAiMatch={false}
                  />
                </div>
              )}
              {drawerTab === "ai" && (
                <div className="space-y-4">
                  {selectedCandidate.ai_rankings && selectedCandidate.ai_rankings.length > 0 && (
                    <section className="rounded-xl border border-border bg-card p-4">
                      <h3 className="m-0 text-sm font-semibold">Совпадение с вакансиями</h3>
                      <div className="mt-3 space-y-2">
                        {selectedCandidate.ai_rankings.map(match => (
                          <div key={match.vacancy_id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                            <span className="truncate">{match.vacancy_title}</span>
                            <span className="shrink-0 font-semibold text-brand-primary">{match.score.toFixed(1)}/10</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                  {["hr", "administrator", "superuser"].includes(user?.role ?? "") ? (
                    <CandidateEvaluationPanel key={selectedCandidate.id} candidate={selectedCandidate} vacancies={jobs} />
                  ) : (
                    <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                      AI-анализ доступен HR и администраторам.
                    </p>
                  )}
                </div>
              )}
              {drawerTab === "job" && (
                <section className="rounded-xl border border-border bg-card p-5">
                  {selectedJob ? (
                    <>
                      <h3 className="m-0 text-lg font-semibold text-foreground">{selectedJob.title}</h3>
                      <p className="mb-0 mt-1 text-sm text-muted-foreground">{selectedJob.department || "Отдел не указан"}</p>
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-foreground-secondary">{selectedJob.description || "Описание не добавлено."}</p>
                      <h4 className="mb-0 mt-5 border-t border-border pt-4 text-sm font-semibold">Требования</h4>
                      {selectedJob.requirements.length ? (
                        <ul className="mt-3 space-y-2 pl-5 text-sm text-foreground-secondary">
                          {selectedJob.requirements.map((requirement, index) => <li key={`${index}-${requirement}`}>{requirement}</li>)}
                        </ul>
                      ) : <p className="mb-0 mt-2 text-sm text-muted-foreground">Требования не указаны.</p>}
                    </>
                  ) : (
                    <p className="m-0 text-sm text-muted-foreground">Кандидат пока не назначен на вакансию.</p>
                  )}
                </section>
              )}
            </div>
          </section>
        </div>
      ) : (
        <CandidatesTable
          candidates={visibleCandidates}
          jobById={jobById}
          onOpenCandidate={handleOpenCandidate}
        />
      )}
      {isIntakeOpen && (can("candidate.create") || user?.role === "candidate") && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Добавить кандидата"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
        >
          <div className="my-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border bg-card px-5 py-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">Новая анкета</span>
                <h2 className="mt-1 text-xl font-semibold">Новый кандидат</h2>
              </div>
              <button
                onClick={() => setIsIntakeOpen(false)}
                className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
            <div className="max-h-[75vh] overflow-y-auto p-5">
              <IntakeTab mvp busy={saving} showGeminiConsent={needsGeminiAttestation} vacancies={vacancies} submitIntake={submitIntake} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CandidatesPageClient(props: { currentUserName: string; initialSelectedCandidateId?: string | null }) { const demo = useDemo(); return demo.enabled ? <DemoCandidates key={demo.role} initialId={props.initialSelectedCandidateId} /> : <LiveCandidatesPageClient {...props} />; }
