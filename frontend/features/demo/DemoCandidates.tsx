"use client";
import Link from "next/link";
import { useState, useRef, useEffect, type FormEvent } from "react";
import { candidateContext } from "@/features/hr-copilot/model/candidateContext";
import { DetailPanel } from "@/shared/ui/DetailPanel";
import { Avatar } from "@/shared/ui/Avatar";
import { Sparkles } from "lucide-react";
import { apiFetch } from "@/shared/api/client";
import type { CandidateEvaluationResponse } from "@/shared/api/ats";
import { canReadDemoCandidate } from "./access";
import { useDemo, DEMO_TENANT } from "./DemoProvider";
import {
  intake,
  evaluate,
  confirmDecision,
  saveMemory,
} from "@/features/hr-copilot/model/engine";
import { IntakeTab } from "@/features/hr-copilot/ui/tabs/IntakeTab";
import {
  actionLabel,
  statusLabel,
  inputClass,
  primary,
  secondary,
  card,
} from "@/features/hr-copilot/ui/constants";
import type {
  Action,
  Candidate,
  Evaluation,
} from "@/features/hr-copilot/model/types";
import { EvaluationSchema } from "@/features/hr-copilot/model/types";

// A deterministic demo matching score: percentage of vacancy skills present in the resume.
export function demoScore(candidate: Candidate, description: string) {
  const terms = description
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 3);
  const unique = [...new Set(terms)];
  const resume =
    `${candidate.skills} ${candidate.experience} ${candidate.resumeText}`.toLowerCase();
  return unique.length
    ? Math.round(
        (unique.filter((term) => resume.includes(term)).length /
          unique.length) *
          100,
      )
    : 0;
}
export function DemoCandidates({ initialId }: { initialId?: string | null }) {
  const { state, role, update, message, canMutate, pending } = useDemo();
  const [vacancyOpen, setVacancyOpen] = useState(true);
  const setVacancyId = (id: string | null) => setVacancyOpen(!!id);
  const [search, setSearch] = useState("");
  const [skill, setSkill] = useState("");
  const [stage, setStage] = useState("");
  const [vacancyFilter, setVacancyFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [selection, setSelection] = useState({
    id: initialId ?? null,
    routeId: initialId,
  });
  const selected =
    selection.routeId === initialId ? selection.id : (initialId ?? null);
  const setSelected = (id: string | null) =>
    setSelection({ id, routeId: initialId });
  const [copilotOpen, setCopilotOpen] = useState(true);
  const formRef = useRef<HTMLElement>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [reason, setReason] = useState("");
  const [decision, setDecision] = useState<Record<string, Action>>({});
  const [geminiConsentCandidate, setGeminiConsentCandidate] = useState<string | null>(null);
  const [geminiPending, setGeminiPending] = useState(false);
  const [geminiError, setGeminiError] = useState("");
  const full =
    canMutate &&
    (role === "hr" || role === "administrator" || role === "superuser");
  const vacancies = state.vacancies.filter((v) => v.tenantId === DEMO_TENANT);
  const visible = state.candidates.filter((c) => canReadDemoCandidate(role, c));
  const skills = [
    ...new Set(
      visible.flatMap((c) =>
        c.skills
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ),
  ].sort();
  const score = (c: Candidate) => {
    const vacancy = vacancies.find(
      (v) => v.id === (vacancyFilter || c.vacancyId || c.requestedVacancyId),
    );
    return demoScore(
      c,
      [vacancy?.description, ...(vacancy?.requirements ?? [])].join(" "),
    );
  };
  const filtered = visible
    .filter(
      (c) =>
        `${c.name} ${c.email} ${c.skills}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (!skill ||
          c.skills
            .split(/[,;]/)
            .some((s) => s.trim().toLowerCase() === skill.toLowerCase())) &&
        (!stage || c.status === stage) &&
        (!vacancyFilter ||
          c.vacancyId === vacancyFilter ||
          c.requestedVacancyId === vacancyFilter),
    )
    .sort((a, b) =>
      sort === "score"
        ? score(b) - score(a)
        : sort === "name"
          ? a.name.localeCompare(b.name, "ru")
          : b.createdAt.localeCompare(a.createdAt),
    );
  const context = candidateContext(
    state,
    visible.some((c) => c.id === selected) ? selected : null,
  );
  const candidate = context.candidate;
  const copilotCandidate = copilotOpen ? candidate : undefined;
  const evaluation = copilotOpen ? context.evaluation : undefined;
  const vacancyId = vacancyOpen ? context.vacancy?.id : null;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const file = event.currentTarget.querySelector<HTMLInputElement>(
      '[name="resumeFile"]',
    )?.files?.[0];
    const text = String(values.get("resumeText") ?? "");
    const ref =
      file?.name ||
      String(values.get("resumeUrl") ?? "") ||
      (text.trim()
        ? "Текст резюме"
        : (visible.find(
            (c) => c.id === (editId ?? (role === "candidate" ? "c-aliya" : "")),
          )?.resumeRef ?? ""));
    if (
      update((next) => {
        if (!full && role !== "candidate" && role !== "recruiter")
          throw Error("Нет права на приём резюме");
        if (!ref || values.get("processingConsent") !== "on")
          throw Error("Добавьте резюме и согласие на обработку данных");
        const input = {
          name: String(values.get("name")),
          email: String(values.get("email")),
          phone: String(values.get("phone")),
          location: String(values.get("location") ?? "").trim(),
          experience: String(values.get("experience")),
          skills: String(values.get("skills")),
          resumeRef: ref,
          resumeText: text,
          requestedVacancyId: String(values.get("vacancyId")) || null,
        };
        if (role === "candidate" || (full && editId)) {
          const own = next.candidates.find(
            (c) => c.id === (role === "candidate" ? "c-aliya" : editId),
          );
          if (!own) throw Error("Анкета недоступна");
          Object.assign(own, input);
          const vacancy = next.vacancies.find(
            (v) =>
              v.id === (own.vacancyId || input.requestedVacancyId) && v.open,
          );
          if (vacancy) evaluate(next, own, vacancy, "intake-hook");
        } else
          intake(
            next,
            DEMO_TENANT,
            role === "recruiter" ? "recruiter" : "hr",
            input,
          );
      })
    )
      setIntakeOpen(false);
  }
  function openCopilot(c: Candidate) {
    if (!full) return;
    setSelected(c.id);
    setCopilotOpen(true);
    setVacancyOpen(true);
    setReason("");
    if (
      !state.evaluations.some(
        (e) =>
          e.candidateId === c.id &&
          (!(c.vacancyId || c.requestedVacancyId) ||
            e.vacancyId === (c.vacancyId || c.requestedVacancyId)),
      )
    ) {
      if (
        !update((next) => {
          const vacancy =
            next.vacancies.find(
              (v) => v.id === (c.vacancyId || c.requestedVacancyId) && v.open,
            ) ??
            (!(c.vacancyId || c.requestedVacancyId)
              ? next.vacancies.find((v) => v.tenantId === DEMO_TENANT && v.open)
              : undefined);
          if (!vacancy) throw Error("Создайте открытую вакансию для анализа");
          evaluate(next, c, vacancy, role);
        })
      )
        return;
    }
  }
  async function runGeminiEvaluation() {
    if (!candidate || !evaluation || geminiPending) return;
    if (geminiConsentCandidate !== candidate.id) {
      setGeminiError("Подтвердите, что кандидат дал согласие на передачу данных Google Gemini.");
      return;
    }
    const vacancy = state.vacancies.find((item) => item.id === evaluation.vacancyId);
    const prompt = state.prompts.find((item) => item.tenantId === candidate.tenantId);
    if (!vacancy || !prompt) {
      setGeminiError("Не найдены настройки Copilot или вакансия для оценки.");
      return;
    }

    setGeminiPending(true);
    setGeminiError("");
    try {
      const result = await apiFetch<CandidateEvaluationResponse>("/developer/evaluate", {
        method: "POST",
        json: {
          candidate: {
            id: candidate.id,
            tenantId: candidate.tenantId,
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone,
            experience: candidate.experience,
            skills: candidate.skills,
            resumeText: candidate.resumeText,
            resumeRef: candidate.resumeRef,
          },
          vacancy: {
            id: vacancy.id,
            tenantId: vacancy.tenantId,
            title: vacancy.title,
            description: vacancy.description,
            requirements: vacancy.requirements ?? [],
          },
          copilot: {
            text: prompt.text,
            greenFlags: prompt.greenFlags,
            redFlags: prompt.redFlags,
            useMemory: prompt.useMemory,
            memoryMarkdown: prompt.memoryMarkdown,
            allowedActions: prompt.allowedActions,
            version: prompt.version,
          },
          consent_attested: true,
        },
      });
      const nextEvaluation: Evaluation = EvaluationSchema.parse({
        id: crypto.randomUUID(),
        tenantId: candidate.tenantId,
        candidateId: candidate.id,
        vacancyId: vacancy.id,
        promptVersion: prompt.version,
        input: {
          resume: {
            reference: candidate.resumeRef,
            text: candidate.resumeText,
            experience: candidate.experience,
            skills: candidate.skills,
          },
          vacancy: { ...vacancy, requirements: vacancy.requirements ?? [] },
          prompt: prompt.text,
          memory: prompt.useMemory
            ? [
                ...state.memory
                  .filter((item) => item.tenantId === candidate.tenantId)
                  .slice(-3)
                  .map((item) => item.markdown),
                ...(prompt.memoryMarkdown ? [prompt.memoryMarkdown] : []),
              ]
            : [],
          managerFeedback: state.feedback
            .filter(
              (item) =>
                item.tenantId === candidate.tenantId &&
                item.candidateId === candidate.id,
            )
            .map((item) => item.note),
        },
        output: {
          summary: `Gemini · ${result.match_score}/100. ${result.summary}`,
          greenFlags: result.green_flags.map(
            (item) =>
              `${item.status === "matched" ? "Совпало" : "Не найдено"}: ${item.flag} · ${item.evidence}`,
          ),
          redFlags: result.red_flags.map(
            (item) =>
              `${item.status === "matched" ? "Обнаружен" : "Не выявлен"}: ${item.flag} · ${item.evidence}`,
          ),
          recommendations: result.recommendations,
        },
        state: "draft",
        chosenAction: null,
        createdAt: new Date().toISOString(),
        confirmedAt: null,
      });
      if (
        !update((next) => {
          next.evaluations = next.evaluations.filter(
            (item) =>
              item.candidateId !== candidate.id || item.vacancyId !== vacancy.id,
          );
          next.evaluations.unshift(nextEvaluation);
          next.audit.unshift({
            id: crypto.randomUUID(),
            tenantId: candidate.tenantId,
            candidateId: candidate.id,
            actor: role,
            action: "ai.gemini_draft",
            detail: `Gemini · prompt v${prompt.version}`,
            createdAt: new Date().toISOString(),
          });
        })
      ) {
        throw Error("Не удалось сохранить результат в Dev mode");
      }
    } catch (error) {
      setGeminiError(error instanceof Error ? error.message : "Gemini evaluation failed");
    } finally {
      setGeminiPending(false);
    }
  }
  useEffect(() => {
    if (!copilotOpen || !full || !candidate || evaluation || pending) return;
    const vacancy = state.vacancies.find(
      (v) =>
        v.id === (candidate.vacancyId || candidate.requestedVacancyId) &&
        v.open,
    );
    if (vacancy) update((next) => evaluate(next, candidate, vacancy, role));
  }, [
    copilotOpen,
    candidate,
    evaluation,
    full,
    state.vacancies,
    role,
    update,
    pending,
  ]);
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            Dev mode ·{" "}
            {role === "candidate"
              ? "Моя анкета"
              : role === "recruiter"
                ? "Приём резюме"
                : "Кандидаты"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {role === "manager"
              ? "Кандидаты вашей вакансии Product Designer"
              : "HireRank · единая организация"}
          </p>
        </div>
        {(full || role === "candidate" || role === "recruiter") && (
          <button
            className={primary}
            onClick={() => {
              setEditId(null);
              setIntakeOpen(!intakeOpen);
            }}
          >
            {role === "candidate"
              ? "Редактировать мою анкету"
              : "Добавить резюме"}
          </button>
        )}
      </header>
      {message && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3">
          {message}
        </p>
      )}
      {intakeOpen && canMutate && (
        <section ref={formRef} className={card}>
          <button
            className={`${secondary} mb-4`}
            onClick={() => setIntakeOpen(false)}
          >
            Закрыть форму
          </button>
          <IntakeTab
            vacancies={vacancies}
            submitIntake={submit}
            key={editId ?? role}
            initialValues={
              role === "candidate" || editId
                ? (() => {
                    const c = visible.find(
                      (c) => c.id === (editId ?? "c-aliya"),
                    );
                    return {
                      ...c,
                      resume_text: c?.resumeText,
                      resume_reference: c?.resumeRef?.startsWith("http")
                        ? c.resumeRef
                        : "",
                      requested_vacancy_id: c?.requestedVacancyId,
                    };
                  })()
                : undefined
            }
          />
        </section>
      )}
      {role !== "recruiter" && (
        <>
          <section
            aria-label="Фильтры кандидатов"
            className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-5"
          >
            <label className="text-xs">
              Поиск
              <input
                aria-label="Поиск кандидатов"
                placeholder="Имя, email, навык"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${inputClass} mt-2`}
              />
            </label>
            <label className="text-xs">
              Навык
              <select
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                className={`${inputClass} mt-2`}
              >
                <option value="">Все навыки</option>
                {skills.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              Этап
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className={`${inputClass} mt-2`}
              >
                <option value="">Все этапы</option>
                {Object.entries(statusLabel).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              Вакансия
              <select
                value={vacancyFilter}
                onChange={(e) => setVacancyFilter(e.target.value)}
                className={`${inputClass} mt-2`}
              >
                <option value="">Все вакансии</option>
                {vacancies.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              Сортировка
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className={`${inputClass} mt-2`}
              >
                <option value="newest">Сначала новые</option>
                <option value="score">По баллам ↓</option>
                <option value="name">По имени</option>
              </select>
            </label>
            <div className="flex items-center gap-3 text-xs text-muted-foreground md:col-span-2 xl:col-span-5">
              Найдено {filtered.length} из {visible.length}
              <button
                className="text-brand-primary"
                onClick={() => {
                  setSearch("");
                  setSkill("");
                  setStage("");
                  setVacancyFilter("");
                  setSort("newest");
                }}
              >
                Сбросить фильтры
              </button>
              <span>
                Демо-балл: совпадение слов резюме с описанием вакансии
              </span>
            </div>
          </section>
          <div className="inspector-workspace">
            <section
              aria-label="Пул кандидатов"
              className="w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Пул кандидатов</span>
                <span>{filtered.length} из {visible.length}</span>
              </div>
              {filtered.map((c) => {
                const topSkills = c.skills
                  .split(/[,;]/)
                  .map((item) => item.trim())
                  .filter(Boolean)
                  .slice(0, 3);
                const vacancyTitle = vacancies.find(
                  (item) => item.id === (c.vacancyId || c.requestedVacancyId),
                )?.title;
                return (
                  <button
                    key={c.id}
                    aria-pressed={selected === c.id}
                    className={`flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/40 ${selected === c.id ? "bg-brand-primary/5" : ""}`}
                    onClick={() => {
                      if (full) openCopilot(c);
                      else {
                        setSelected(c.id);
                        setVacancyOpen(true);
                      }
                      setReason("");
                      setEditId(null);
                      setIntakeOpen(false);
                    }}
                  >
                    <Avatar name={c.name} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-3">
                        <strong className="truncate text-sm">{c.name}</strong>
                        <span className="shrink-0 rounded-md bg-brand-primary/10 px-2 py-1 text-xs font-semibold tabular-nums text-brand-primary">
                          {score(c)}%
                        </span>
                      </span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">
                        {vacancyTitle || "Без назначения"} · {statusLabel[c.status]}
                      </span>
                      {topSkills.length > 0 && (
                        <span className="mt-2 flex flex-wrap gap-1.5">
                          {topSkills.map((item) => (
                            <span
                              key={item}
                              className="rounded-md bg-secondary px-2 py-1 text-[11px] text-secondary-foreground"
                            >
                              {item}
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                    {full && <Sparkles size={15} className="mt-1 shrink-0 text-brand-primary" />}
                  </button>
                );
              })}
              {!filtered.length && (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  Кандидаты не найдены. Измените фильтры.
                </p>
              )}
            </section>
            <div className="inspector-dock" aria-live="polite">
              {candidate && (
                <nav
                  aria-label="Карточки выбранного кандидата"
                  className="sticky top-2 z-10 col-span-full flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 text-xs shadow-sm"
                >
                  <strong>{candidate.name}</strong>
                  <a href="#candidate-profile" className="text-brand-primary">
                    Анкета
                  </a>
                  {full && (
                    <a
                      href="#candidate-copilot"
                      onClick={() => setCopilotOpen(true)}
                      className="text-brand-primary"
                    >
                      HR Copilot
                    </a>
                  )}
                  {context.vacancy && (
                    <a
                      href="#candidate-vacancy"
                      onClick={() => setVacancyOpen(true)}
                      className="text-brand-primary"
                    >
                      Вакансия
                    </a>
                  )}
                </nav>
              )}
              {candidate && (
                <DetailPanel
                  id="candidate-profile"
                  key={candidate.id}
                  title="Анкета кандидата"
                  onClose={() => setSelected(null)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={candidate.name} size={40} />
                    <h2 className="m-0 text-base font-semibold leading-normal">
                      {candidate.name}
                    </h2>
                  </div>
                  <button
                    className={`${secondary} mt-4 w-full`}
                    disabled={
                      !candidate.vacancyId && !candidate.requestedVacancyId
                    }
                    onClick={() =>
                      setVacancyId(
                        candidate.vacancyId || candidate.requestedVacancyId,
                      )
                    }
                  >
                    Посмотреть вакансию
                  </button>
                  {full && (
                    <button
                      className={`${primary} mt-3 w-full`}
                      onClick={() => openCopilot(candidate)}
                    >
                      <Sparkles size={14} className="mr-2 inline" />
                      HR Copilot · анализ кандидата
                    </button>
                  )}
                  <p className="mt-3 text-sm">
                    {candidate.email}
                    <br />
                    {candidate.phone}
                    <br />
                    {candidate.location || "Локация не указана"}
                  </p>
                  <h3 className="mt-5 mb-0 text-sm font-semibold">Опыт</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {candidate.experience}
                  </p>
                  <h3 className="mt-5 mb-0 text-sm font-semibold">Навыки</h3>
                  <p className="mt-2 text-sm">{candidate.skills}</p>
                  <h3 className="mt-5 mb-0 text-sm font-semibold">Резюме</h3>
                  <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm">
                    {candidate.resumeText || candidate.resumeRef}
                  </p>
                  {full && (
                    <button
                      className={`${secondary} mt-4`}
                      onClick={() => {
                        setEditId(candidate.id);
                        setIntakeOpen(true);
                        requestAnimationFrame(() =>
                          formRef.current?.scrollIntoView({
                            block: "start",
                            behavior: "smooth",
                          }),
                        );
                      }}
                    >
                      Редактировать анкету
                    </button>
                  )}
                  {full && (
                    <label className="mt-5 block text-xs">
                      Назначить на вакансию
                      <select
                        className={`${inputClass} mt-2`}
                        value={candidate.vacancyId ?? ""}
                        onChange={(e) =>
                          update((next) => {
                            if (!full) throw Error("Нет права назначения");
                            const c = next.candidates.find(
                              (c) => c.id === candidate.id,
                            )!;
                            c.vacancyId = e.target.value || null;
                            c.status = c.vacancyId ? "assigned" : "new";
                            const vacancy = next.vacancies.find(
                              (v) => v.id === c.vacancyId && v.open,
                            );
                            if (vacancy) evaluate(next, c, vacancy, role);
                            next.audit.unshift({
                              id: crypto.randomUUID(),
                              tenantId: DEMO_TENANT,
                              candidateId: c.id,
                              actor: role,
                              action: "application.assigned",
                              detail: c.vacancyId ?? "Без назначения",
                              createdAt: new Date().toISOString(),
                            });
                          })
                        }
                      >
                        <option value="">Без назначения</option>
                        {vacancies
                          .filter((v) => v.open)
                          .map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.title}
                            </option>
                          ))}
                      </select>
                    </label>
                  )}
                  {role === "manager" && (
                    <form
                      className="mt-5 space-y-3"
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (
                          update((next) => {
                            if (
                              candidate.vacancyId !== "v-design" ||
                              feedback.trim().length < 3
                            )
                              throw Error("Проверьте предложение");
                            next.feedback.unshift({
                              id: crypto.randomUUID(),
                              tenantId: DEMO_TENANT,
                              candidateId: candidate.id,
                              intent: "interview",
                              note: feedback.trim(),
                              state: "pending",
                              createdAt: new Date().toISOString(),
                            });
                          })
                        )
                          setFeedback("");
                      }}
                    >
                      <label className="block text-xs">
                        Предложение HR
                        <textarea
                          required
                          minLength={3}
                          className={`${inputClass} mt-2`}
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                        />
                      </label>
                      <button className={secondary}>Передать HR</button>
                    </form>
                  )}
                  {full &&
                    state.feedback
                      .filter((f) => f.candidateId === candidate.id)
                      .map((f) => (
                        <div
                          key={f.id}
                          className="mt-4 rounded-lg border border-border p-3 text-xs"
                        >
                          <strong>Предложение менеджера</strong>
                          <p className="mt-2">{f.note}</p>
                          <p className="mt-2">{f.state}</p>
                          {(role === "hr" ||
                            (role === "superuser" && canMutate)) &&
                            f.state === "pending" && (
                              <div className="mt-2 flex gap-2">
                                {[true, false].map((approved) => (
                                  <button
                                    key={String(approved)}
                                    className={secondary}
                                    onClick={() =>
                                      update((next) => {
                                        next.feedback.find(
                                          (item) => item.id === f.id,
                                        )!.state = approved
                                          ? "approved"
                                          : "declined";
                                        next.audit.unshift({
                                          id: crypto.randomUUID(),
                                          tenantId: DEMO_TENANT,
                                          candidateId: candidate.id,
                                          actor: role,
                                          action: "feedback.reviewed",
                                          detail: approved
                                            ? "approved"
                                            : "declined",
                                          createdAt: new Date().toISOString(),
                                        });
                                      })
                                    }
                                  >
                                    {approved ? "Согласовать" : "Отклонить"}
                                  </button>
                                ))}
                              </div>
                            )}
                        </div>
                      ))}
                  {canMutate &&
                    (role === "administrator" || role === "superuser") && (
                      <button
                        className={`${secondary} mt-4 text-destructive`}
                        onClick={() => {
                          if (confirm("Удалить демо-кандидата?"))
                            update((next) => {
                              next.candidates = next.candidates.filter(
                                (c) => c.id !== candidate.id,
                              );
                              next.audit.unshift({
                                id: crypto.randomUUID(),
                                tenantId: DEMO_TENANT,
                                candidateId: candidate.id,
                                actor: role,
                                action: "candidate.deleted",
                                detail: candidate.name,
                                createdAt: new Date().toISOString(),
                              });
                            });
                        }}
                      >
                        Удалить кандидата
                      </button>
                    )}
                </DetailPanel>
              )}
              {full && copilotCandidate && evaluation && (
                <DetailPanel
                  id="candidate-copilot"
                  key={`copilot-${copilotCandidate.id}-${evaluation.id}`}
                  title="HR Copilot"
                  onClose={() => setCopilotOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <Link
                      href="/dashboard/copilot"
                      className="text-xs text-brand-primary"
                    >
                      Настроить Copilot
                    </Link>
                    <Avatar name="HR Copilot" size={36} />
                    <span className="text-sm font-semibold">Помощник HR</span>
                  </div>
                  <button
                    className={`${secondary} mt-4 w-full`}
                    onClick={() => setVacancyId(evaluation.vacancyId)}
                  >
                    Посмотреть вакансию ·{" "}
                    {
                      vacancies.find((v) => v.id === evaluation.vacancyId)
                        ?.title
                    }
                  </button>
                  <p className="mt-2 text-sm font-semibold">
                    {copilotCandidate.name}
                  </p>
                  <label className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={geminiConsentCandidate === copilotCandidate.id}
                      onChange={(event) => {
                        setGeminiConsentCandidate(
                          event.target.checked ? copilotCandidate.id : null,
                        );
                        setGeminiError("");
                      }}
                    />
                    Подтверждаю, что кандидат дал согласие на передачу обезличенных
                    данных Google Gemini в настроенную страну обработки.
                  </label>
                  {geminiError && (
                    <p role="alert" className="mt-2 text-xs text-destructive">
                      {geminiError}
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={
                      geminiPending ||
                      geminiConsentCandidate !== copilotCandidate.id
                    }
                    onClick={() => void runGeminiEvaluation()}
                    className={`${primary} mt-3 w-full disabled:opacity-50`}
                  >
                    <Sparkles size={14} className="mr-2 inline" />
                    {geminiPending ? "Gemini оценивает..." : "Оценить Gemini"}
                  </button>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {evaluation.output.summary}
                  </p>
                  <div className="mt-4 space-y-2">
                    {evaluation.output.greenFlags.map((flag) => (
                      <p
                        key={flag}
                        className="rounded-lg bg-success/10 p-2 text-xs"
                      >
                        + {flag}
                      </p>
                    ))}
                    {evaluation.output.redFlags.map((flag) => (
                      <p
                        key={flag}
                        className="rounded-lg bg-destructive/10 p-2 text-xs"
                      >
                        − {flag}
                      </p>
                    ))}
                  </div>
                  <fieldset
                    disabled={
                      evaluation.state !== "draft" ||
                      (role !== "hr" && role !== "superuser")
                    }
                    className="mt-4 space-y-3"
                  >
                    <legend className="mb-2 text-sm font-semibold">
                      Рекомендации
                    </legend>
                    {evaluation.output.recommendations.map((r) => (
                      <label
                        key={r.action}
                        className="flex gap-2 rounded-lg border border-border p-3 text-xs"
                      >
                        <input
                          type="radio"
                          name={evaluation.id}
                          checked={
                            (decision[evaluation.id] ??
                              evaluation.output.recommendations[0]?.action) ===
                            r.action
                          }
                          onChange={() =>
                            setDecision({
                              ...decision,
                              [evaluation.id]: r.action,
                            })
                          }
                        />
                        <span>
                          <strong>{r.title}</strong>
                          <span className="mt-1 block">
                            {r.reason}. {r.evidence}
                          </span>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                  {(role === "hr" || (role === "superuser" && canMutate)) &&
                    evaluation.state === "draft" && (
                      <button
                        className={`${primary} mt-4 w-full`}
                        onClick={() => {
                          const action =
                            decision[evaluation.id] ??
                            evaluation.output.recommendations[0].action;
                          if (confirm(`Подтвердить: ${actionLabel[action]}?`))
                            update((next) =>
                              confirmDecision(
                                next,
                                DEMO_TENANT,
                                role,
                                evaluation.id,
                                action,
                              ),
                            );
                        }}
                      >
                        Подтвердить решение
                      </button>
                    )}
                  {evaluation.state === "confirmed" && (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm">
                        HR подтвердил:{" "}
                        {evaluation.chosenAction &&
                          actionLabel[evaluation.chosenAction]}
                      </p>
                      {(role === "hr" || (role === "superuser" && canMutate)) &&
                        !state.memory.some(
                          (m) => m.evaluationId === evaluation.id,
                        ) && (
                          <>
                            <label className="block text-xs">
                              Проверенная причина для памяти
                              <textarea
                                className={`${inputClass} mt-2`}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                              />
                            </label>
                            <button
                              disabled={!reason.trim()}
                              className={secondary}
                              onClick={() =>
                                update((next) =>
                                  saveMemory(
                                    next,
                                    DEMO_TENANT,
                                    role,
                                    evaluation.id,
                                    reason,
                                  ),
                                )
                              }
                            >
                              Сохранить в память
                            </button>
                          </>
                        )}
                    </div>
                  )}
                  {(role === "administrator" || role === "superuser") && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Решение подтверждает HR.
                    </p>
                  )}
                </DetailPanel>
              )}
              {full && copilotCandidate && !evaluation && (
                <DetailPanel
                  id="candidate-copilot"
                  key={`empty-${copilotCandidate.id}`}
                  title="HR Copilot"
                  onClose={() => setCopilotOpen(false)}
                >
                  <p className="text-sm font-semibold">
                    {copilotCandidate.name}
                  </p>
                  <p className="mt-3 text-sm">
                    Анализ ещё не подготовлен для выбранной вакансии.
                  </p>
                  <button
                    className={`${primary} mt-4`}
                    onClick={() => openCopilot(copilotCandidate)}
                  >
                    Запустить тестовый анализ
                  </button>
                  <Link
                    className={`${secondary} mt-3 block`}
                    href="/dashboard/copilot"
                  >
                    Настройки Copilot
                  </Link>
                </DetailPanel>
              )}
              {vacancyId && (
                <DetailPanel
                  id="candidate-vacancy"
                  key={vacancyId}
                  title="Вакансия"
                  onClose={() => setVacancyId(null)}
                >
                  {(() => {
                    const vacancy = vacancies.find((v) => v.id === vacancyId);
                    return vacancy ? (
                      <>
                        <h2 className="m-0 text-xl font-semibold">
                          {vacancy.title}
                        </h2>
                        <p className="mt-3 text-sm text-muted-foreground">
                          {vacancy.department} ·{" "}
                          {vacancy.open ? "Открыта" : "Закрыта"}
                        </p>
                        <p className="whitespace-pre-wrap text-sm">
                          {vacancy.description || "Описание пока не добавлено."}
                        </p>
                        <h3 className="text-sm">Требования</h3>
                        {!vacancy.requirements?.length && (
                          <p className="text-sm text-muted-foreground">
                            Требования пока не добавлены.
                          </p>
                        )}
                        <ul className="list-disc space-y-2 pl-5 text-sm">
                          {(vacancy.requirements ?? []).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                        <Link
                          className={`${secondary} mt-5 inline-block`}
                          href={`/dashboard/jobs/${vacancy.id}`}
                        >
                          Открыть полную карточку
                        </Link>
                      </>
                    ) : (
                      <p>Вакансия недоступна.</p>
                    );
                  })()}
                </DetailPanel>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
