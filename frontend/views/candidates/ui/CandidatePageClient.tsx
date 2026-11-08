"use client";
import Link from "next/link";
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
  const [sortOrder, setSortOrder] = useState("default");
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

  if (loading) return <div>Загрузка кандидатов...</div>;
  if (error) return <div role="alert">{error}<button onClick={reload} className="ml-3 text-brand-primary">Повторить</button></div>;
  if (!can("candidate.read")) return <p role="alert">Нет доступа к кандидатскому пулу</p>;
  if (initialSelectedCandidateId && !selectedCandidate) return <p role="alert">Кандидат не найден</p>;

  if (selectedCandidate) {
    return (
      <div className="grid gap-5 px-6 pb-12 pt-4 md:px-10 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="min-w-0">
          <section aria-label="Выбор кандидата" className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm xl:sticky xl:top-5">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="m-0 text-sm font-semibold">Кандидаты</h2>
              <span className="rounded-full bg-muted px-2 py-1 text-xs tabular-nums text-muted-foreground">{displayedCandidates.length}</span>
            </div>
            <div className="max-h-[70vh] space-y-1 overflow-y-auto p-2">
              {displayedCandidates.map(candidate => (
                <button
                  key={candidate.id}
                  onClick={() => openCandidate(candidate.id)}
                  aria-pressed={candidate.id === selectedCandidate.id}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                    candidate.id === selectedCandidate.id
                      ? "border-brand-primary/30 bg-brand-primary/5"
                      : "border-transparent hover:border-border hover:bg-muted/40"
                  }`}
                >
                  <strong className="block truncate text-sm font-semibold text-foreground">{candidate.name || candidate.email}</strong>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">{jobById[candidate.assigned_vacancy_id ?? ""]?.title || "Без назначения"}</span>
                </button>
              ))}
              {!displayedCandidates.length && <p className="p-3 text-sm text-muted-foreground">Нет кандидатов для отображения.</p>}
            </div>
          </section>
        </aside>

        <main className="min-w-0 space-y-5" key={selectedCandidate.id}>
          {formMessage && <p role="alert" className="m-0 rounded-xl border border-danger/20 bg-danger/5 p-3 text-sm text-danger">{formMessage}</p>}

          {(can("application.assign") || can("candidate.update") || can("candidate.delete") || user?.role === "candidate" || ["hr", "administrator", "superuser"].includes(user?.role ?? "")) && (
            <section aria-label="Действия с кандидатом" className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
              {can("application.assign") && (
                <form className="flex min-w-0 flex-1 flex-wrap items-center gap-2" onSubmit={async event => {
                  event.preventDefault(); if (saving) return;
                  const vacancyId = String(new FormData(event.currentTarget).get("vacancyId") ?? "");
                  if (!vacancyId || !confirm("Подтвердить назначение кандидата на выбранную вакансию?")) return;
                  setSaving(true); setFormMessage("");
                  try { await assignCandidate(selectedCandidate.id, vacancyId); reload(); }
                  catch (e) { setFormMessage(e instanceof Error ? e.message : "Не удалось назначить кандидата"); }
                  finally { setSaving(false); }
                }}>
                  <select name="vacancyId" required aria-label="Вакансия для назначения" className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-sm">
                    <option value="">Выберите открытую вакансию</option>
                    {jobs.filter(j => j.status === "open").map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                  </select>
                  <button type="submit" disabled={saving} className="h-10 rounded-xl bg-brand-primary px-4 text-sm font-medium text-brand-primary-foreground transition-colors hover:bg-brand-primary-hover disabled:opacity-50">Назначить</button>
                </form>
              )}

              {(can("candidate.update") || user?.role === "candidate") && (
                <details className="basis-full rounded-xl border border-border bg-background">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Редактировать анкету</summary>
                  <div className="border-t border-border p-4">
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

              {(user?.role === "hr" || user?.role === "administrator" || user?.role === "superuser") && (
                <a href="#candidate-copilot" className="rounded-xl border border-border px-3 py-2 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-primary/5">HR Copilot · {selectedCandidate.name}</a>
              )}
              {can("candidate.delete") && (
                <button type="button" disabled={saving} className="rounded-xl border border-danger/20 px-3 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/5 disabled:opacity-50" onClick={async () => {
                  if (!confirm("Удалить кандидата?")) return;
                  setSaving(true); setFormMessage("");
                  try { await deleteCandidate(selectedCandidate.id); router.push("/dashboard/candidates"); reload(); }
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
            onChangeStage={async (stageId) => {
              if (!selectedCandidate.assigned_vacancy_id || saving) return;
              setSaving(true);
              setFormMessage("");
              try {
                await updateCandidateStage(selectedCandidate.id, selectedCandidate.assigned_vacancy_id, stageId);
                reload();
              } catch (e) {
                setFormMessage(e instanceof Error ? e.message : "Не удалось изменить этап кандидата");
              } finally {
                setSaving(false);
              }
            }}
            notes={notes}
            noteDraft={noteDraft}
            setNoteDraft={setNoteDraft}
            addNote={addNote}
            onBack={back}
          />
          <div className="grid gap-5 lg:grid-cols-2">
            <section aria-label="Вакансия кандидата" className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="m-0 text-lg font-semibold">{selectedJob?.title || "Кандидат пока не назначен"}</h2>
              {selectedJob && (
                <>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-foreground-secondary">{selectedJob.description}</p>
                  {!!selectedJob.requirements?.length && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-foreground-secondary">{selectedJob.requirements.map(item => <li key={item}>{item}</li>)}</ul>}
                  <Link href={`/dashboard/jobs/${selectedJob.id}`} className="mt-4 inline-flex rounded-lg bg-brand-primary/10 px-3 py-2 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-primary/15">Полная вакансия</Link>
                </>
              )}
            </section>
            {["hr", "administrator", "superuser"].includes(user?.role ?? "") && <CandidateEvaluationPanel key={selectedCandidate.id} candidate={selectedCandidate} vacancies={jobs} />}
          </div>
        </main>
      </div>
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

      <section
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
      </section>

      <section
        aria-label="Поиск и фильтры"
        className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
      >
        <div className="grid gap-4 xl:grid-cols-12 xl:items-center">
          <div className="min-w-0 xl:col-span-4">
            <SearchInput value={search} onChange={setSearch} />
          </div>
          <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-background px-3 py-2.5 xl:col-span-4">
            <StageFilter value={stageFilter} onChange={setStageFilter} />
          </div>
          <label className="flex h-11 min-w-0 items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 text-xs text-muted-foreground xl:col-span-2">
              Навык
              <select className="min-w-0 max-w-[60%] bg-transparent text-right text-sm text-foreground outline-none" value={skillFilter} onChange={event => setSkillFilter(event.target.value)}>
                <option value="">Все навыки</option>
                {skills.map(skill => <option key={skill}>{skill}</option>)}
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
              <span className="font-semibold text-foreground">{displayedCandidates.length}</span>
              {" "}из {candidates.length}
            </span>
          </div>
        </div>
      </section>

      <CandidatesTable
        candidates={displayedCandidates}
        jobById={jobById}
        onOpenCandidate={openCandidate}
      />
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
