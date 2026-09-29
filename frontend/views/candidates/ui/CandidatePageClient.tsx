"use client";
import { useDemo } from "@/features/demo/DemoProvider";
import { DemoCandidates } from "@/features/demo/DemoCandidates";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Clock3, Plus, Users, UserX } from "lucide-react";
import { CandidateProfile } from "@/widgets/candidate-profile";
import { SearchInput } from "@/features/search-candidates/ui/SearchInputCandidate";
import { StageFilter } from "@/features/filter-candidates/ui/StageFilter";
import { CandidatesTable } from "@/widgets/candidate-table/ui/CandidatesTable";
import type { Job } from "@/entities/job";
import { useCandidatesPage } from "@/features/candidate-page";
import { IntakeTab } from "@/features/hr-copilot/ui/tabs/IntakeTab";
import { useAtsData } from "@/shared/api/useAtsData";
import { assignCandidate, createCandidate, deleteCandidate, updateQuestionnaire } from "@/shared/api/ats";
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

  async function submitIntake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const values = new FormData(event.currentTarget);
    const file = event.currentTarget.querySelector<HTMLInputElement>('input[name="resumeFile"]')?.files?.[0];
    if (file) { setFormMessage("Загрузка файлов ожидает backend. Введите текст резюме или ссылку; файл сейчас не будет сохранён."); return; }
    const resumeText = String(values.get("resumeText") ?? "").trim();
    const resumeUrl = String(values.get("resumeUrl") ?? "").trim();
    if (!resumeText && !resumeUrl) { setFormMessage("Введите текст резюме или ссылку"); return; }
    if (values.get("processingConsent") !== "on") { setFormMessage("Подтвердите согласие на обработку данных"); return; }
    setSaving(true); setFormMessage("");
    try {
      const questionnaire = { name: String(values.get("name") ?? "").trim(), email: String(values.get("email") ?? "").trim(), phone: String(values.get("phone") ?? "").trim(), experience: String(values.get("experience") ?? "").trim(), skills: String(values.get("skills") ?? "").trim(), resume_text: resumeText, resume_reference: resumeUrl || null, requested_vacancy_id: String(values.get("vacancyId") ?? "") || null, processing_consent: true };
      let created;
      if (user?.role === "candidate") {
        const own = candidates.find(candidate => candidate.user_id === user.id);
        if (!own) throw Error("Профиль кандидата не найден. Обратитесь к администратору.");
        created = await updateQuestionnaire(own.id, { ...own.questionnaire, ...questionnaire });
      } else created = await createCandidate({ questionnaire, email: questionnaire.email, resume_url: resumeUrl || null });
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
      <main className="w-full p-6">
        {formMessage && <p role="alert" className="text-danger">{formMessage}</p>}
        {can("application.assign") && <form className="mb-4 flex flex-wrap gap-3" onSubmit={async event => {
          event.preventDefault(); if (saving) return;
          const vacancyId = String(new FormData(event.currentTarget).get("vacancyId") ?? "");
          if (!vacancyId || !confirm("Подтвердить назначение кандидата на выбранную вакансию?")) return;
          setSaving(true); setFormMessage("");
          try { await assignCandidate(selectedCandidate.id, vacancyId); reload(); }
          catch (e) { setFormMessage(e instanceof Error ? e.message : "Не удалось назначить кандидата"); }
          finally { setSaving(false); }
        }}>
          <select name="vacancyId" required aria-label="Вакансия для назначения" className="rounded-lg border border-input bg-background px-3 py-2"><option value="">Выберите открытую вакансию</option>{jobs.filter(j => j.status === "open").map(j => <option key={j.id} value={j.id}>{j.title}</option>)}</select>
          <button disabled={saving} className="text-brand-primary">Назначить</button>
        </form>}
        {(can("candidate.update") || user?.role === "candidate") && <details className="mb-4"><summary className="cursor-pointer text-sm">Редактировать анкету</summary>
          <IntakeTab mvp busy={saving} initialValues={selectedCandidate.questionnaire as unknown as Record<string, unknown>} vacancies={vacancies} submitIntake={async event => {
            event.preventDefault(); if (saving) return;
            const values = new FormData(event.currentTarget);
            if (values.get("processingConsent") !== "on") return;
            setSaving(true); setFormMessage("");
            try {
              const questionnaire = { ...selectedCandidate.questionnaire, name: String(values.get("name") ?? ""), email: String(values.get("email") ?? ""), phone: String(values.get("phone") ?? ""), experience: String(values.get("experience") ?? ""), skills: String(values.get("skills") ?? ""), resume_text: String(values.get("resumeText") ?? ""), resume_reference: String(values.get("resumeUrl") ?? "") || null, requested_vacancy_id: String(values.get("vacancyId") ?? "") || null, processing_consent: true };
              if (!questionnaire.resume_text.trim() && !questionnaire.resume_reference) throw Error("Введите текст резюме или ссылку");
              await updateQuestionnaire(selectedCandidate.id, questionnaire); reload();
            } catch (e) { setFormMessage(e instanceof Error ? e.message : "Не удалось обновить анкету"); }
            finally { setSaving(false); }
          }} />
        </details>}
        {can("candidate.delete") && <button disabled={saving} className="mb-4 text-danger" onClick={async () => {
          if (!confirm("Удалить кандидата?")) return;
          setSaving(true); setFormMessage("");
          try { await deleteCandidate(selectedCandidate.id); router.push("/dashboard/candidates"); reload(); }
          catch (e) { setFormMessage(e instanceof Error ? e.message : "Не удалось удалить кандидата"); }
          finally { setSaving(false); }
        }}>Удалить кандидата</button>}
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
          disabled={!can("candidate.create") && user?.role !== "candidate"}
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
        {candidateStats.filter(item => item.label !== "Отклонены").map(({ label, value, icon: Icon, color }) => (
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
            {displayedCandidates.length}
          </span>{" "}
          из {candidates.length}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <label className="text-xs">Навык<select className="ml-2 rounded-lg border border-input bg-background px-3 py-2" value={skillFilter} onChange={event => setSkillFilter(event.target.value)}><option value="">Все навыки</option>{skills.map(skill => <option key={skill}>{skill}</option>)}</select></label>
        <label className="text-xs">Сортировка<select className="ml-2 rounded-lg border border-input bg-background px-3 py-2" value={sortOrder} onChange={event => setSortOrder(event.target.value)}><option value="default">По умолчанию</option><option value="name">По имени</option></select></label>
      </div>
      <CandidatesTable
        candidates={displayedCandidates}
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
            <IntakeTab mvp busy={saving} vacancies={vacancies} submitIntake={submitIntake} />
          </div>
        </div>
      )}
    </div>
  );
}

export function CandidatesPageClient(props: { currentUserName: string; initialSelectedCandidateId?: string | null }) { const demo = useDemo(); return demo.enabled ? <DemoCandidates key={demo.role} initialId={props.initialSelectedCandidateId} /> : <LiveCandidatesPageClient {...props} />; }
