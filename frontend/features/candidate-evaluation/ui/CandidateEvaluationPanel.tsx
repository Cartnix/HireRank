"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { Candidate } from "@/entities/candidate";
import type { Job } from "@/entities/job";
import {
  evaluateCandidate,
  type CandidateEvaluationResponse,
} from "@/shared/api/ats";

const criterionStatus: Record<string, string> = {
  met: "Подтверждено",
  partial: "Частично",
  not_found: "Нет данных",
};

const recommendationLabel: Record<string, string> = {
  review: "Дополнительное рассмотрение",
  interview: "Пригласить на интервью",
  rejected: "Отклонить после проверки HR",
};

export function CandidateEvaluationPanel({
  candidate,
  vacancies,
}: {
  candidate: Candidate;
  vacancies: Job[];
}) {
  const [vacancyId, setVacancyId] = useState(
    candidate.assigned_vacancy_id ?? vacancies[0]?.id ?? "",
  );
  const [evaluation, setEvaluation] =
    useState<CandidateEvaluationResponse | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function runEvaluation() {
    if (!vacancyId || pending) return;
    setPending(true);
    setError("");
    setEvaluation(null);
    try {
      setEvaluation(await evaluateCandidate(candidate.id, vacancyId));
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Не удалось оценить кандидата",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      aria-label="Оценка кандидата Gemini"
      className="rounded-xl border border-border p-5"
    >
      <h2 className="font-semibold">Оценка соответствия вакансии</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Gemini сравнит требования с обезличенным профилем. Нужны активные
        трансграничные согласия кандидата или подтверждение HR, что оно получено
        для страны обработки, заданной backend. Результат проверяет HR и не меняет
        статус автоматически.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <select
          aria-label="Вакансия для оценки"
          disabled={pending}
          className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
          value={vacancyId}
          onChange={(event) => {
            setVacancyId(event.target.value);
            setEvaluation(null);
            setError("");
          }}
        >
          <option value="">Выберите вакансию</option>
          {vacancies.map((vacancy) => (
            <option key={vacancy.id} value={vacancy.id}>
              {vacancy.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-busy={pending}
          disabled={!vacancyId || pending}
          onClick={() => void runEvaluation()}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-brand-primary-foreground disabled:opacity-50"
        >
          <Sparkles size={15} />
          {pending ? "Оценка..." : "Оценить Gemini"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {evaluation && (
        <div className="mt-5 border-t border-border pt-4">
          <div className="flex items-start gap-3">
            <span className="shrink-0 text-2xl font-semibold tabular-nums text-brand-primary">
              {evaluation.match_score}%
            </span>
            <p className="m-0 text-sm">{evaluation.summary}</p>
          </div>
          {evaluation.strengths.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold">Подтверждённые сильные стороны</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {evaluation.strengths.map((strength, index) => (
                  <li key={`${strength}-${index}`}>{strength}</li>
                ))}
              </ul>
            </div>
          )}
          {evaluation.green_flags.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold">Green flags</h3>
              <ul className="mt-2 space-y-2 p-0">
                {evaluation.green_flags.map((item, index) => (
                  <li
                    key={`${item.flag}-${index}`}
                    className="list-none border-l-2 border-success pl-3 text-sm"
                  >
                    <strong>{item.flag}</strong>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {item.status === "matched" ? "Найден" : "Не найден"}
                    </span>
                    <p className="mb-0 mt-1 text-muted-foreground">
                      {item.evidence}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {evaluation.red_flags.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold">Red flags</h3>
              <ul className="mt-2 space-y-2 p-0">
                {evaluation.red_flags.map((item, index) => (
                  <li
                    key={`${item.flag}-${index}`}
                    className="list-none border-l-2 border-destructive pl-3 text-sm"
                  >
                    <strong>{item.flag}</strong>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {item.status === "matched" ? "Обнаружен" : "Не выявлен"}
                    </span>
                    <p className="mb-0 mt-1 text-muted-foreground">
                      {item.evidence}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ul className="mt-4 space-y-3 p-0">
            {evaluation.criteria.map((criterion, index) => (
              <li
                key={`${criterion.criterion}-${index}`}
                className="list-none border-l-2 border-border pl-3 text-sm"
              >
                <strong>{criterion.criterion}</strong>
                <span className="ml-2 text-xs text-muted-foreground">
                  {criterionStatus[criterion.status]}
                </span>
                <p className="mb-0 mt-1 text-muted-foreground">
                  {criterion.evidence}
                </p>
              </li>
            ))}
          </ul>
          {evaluation.gaps.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold">Что уточнить</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {evaluation.gaps.map((gap, index) => (
                  <li key={`${gap}-${index}`}>{gap}</li>
                ))}
              </ul>
            </div>
          )}
          {evaluation.follow_up_questions.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold">Вопросы для интервью</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {evaluation.follow_up_questions.map((question, index) => (
                  <li key={`${question}-${index}`}>{question}</li>
                ))}
              </ul>
            </div>
          )}
          {evaluation.recommendations.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <h3 className="text-sm font-semibold">Варианты для HR</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Действия не выполняются автоматически.
              </p>
              <ul className="mt-3 space-y-2 p-0">
                {evaluation.recommendations.map((item, index) => (
                  <li
                    key={`${item.action}-${index}`}
                    className="list-none rounded-lg border border-border p-3 text-sm"
                  >
                    <strong>
                      {recommendationLabel[item.action] ?? item.title}
                    </strong>
                    <p className="mb-0 mt-1 text-muted-foreground">
                      {item.reason} {item.evidence}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}