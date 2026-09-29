import type {
  Action,
  Candidate,
  CopilotState,
  Evaluation,
} from "../../model/types";
import { actionLabel, card, date, inputClass, primary, secondary, statusLabel } from "../constants";
import { Section } from "../Section";

export function CopilotDashboardTab({
  state,
  tenantId,
  candidates,
  evaluations,
  selectedCandidate,
  promptText,
  prompt,
  allowed,
  memoryEnabled,
  setSelectedCandidate,
  setTab,
  setPromptText,
  setAllowed,
  setMemoryEnabled,
  setDecision,
  ownCandidate,
  confirm,
  savePrompt,
  reviewFeedback,
}: {
  state: CopilotState;
  tenantId: string;
  candidates: Candidate[];
  evaluations: Evaluation[];
  selectedCandidate: string;
  promptText: string;
  prompt: { version: number; useMemory: boolean } | undefined;
  allowed: Action[];
  memoryEnabled: boolean;
  setSelectedCandidate: (id: string) => void;
  setTab: (tab: "intake" | "copilot") => void;
  setPromptText: (value: string) => void;
  setAllowed: (next: Action[]) => void;
  setMemoryEnabled: (value: boolean) => void;
  setDecision: React.Dispatch<React.SetStateAction<Record<string, Action>>>;
  ownCandidate: (id: string) => Candidate | undefined;
  confirm: (evaluation: Evaluation) => void;
  savePrompt: (event: React.FormEvent<HTMLFormElement>) => void;
  reviewFeedback: (id: string, approved: boolean) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Новые анкеты", candidates.filter((x) => x.status === "new").length],
          ["Черновики AI", evaluations.filter((x) => x.state === "draft").length],
          ["Подтверждённые действия", state.mcpRuns.filter((x) => x.tenantId === tenantId).length],
        ].map(([title, value]) => (
          <div key={String(title)} className={card}>
            <div className="text-3xl font-bold text-brand-primary">{value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{title}</div>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[.8fr_1.35fr_1fr]">
        <Section title="01 · Пул на обработку" description="Поступление анкеты не меняет её статус.">
          <div className="mt-4 space-y-2">
            {candidates
              .filter((x) => ["new", "review"].includes(x.status))
              .map((x) => (
                <button
                  key={x.id}
                  onClick={() => setSelectedCandidate(x.id)}
                  className={`block w-full rounded-xl border p-3 text-left text-sm ${selectedCandidate === x.id ? "border-brand-primary bg-brand-primary/5" : "border-border"}`}
                >
                  <strong>{x.name}</strong>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {statusLabel[x.status]} · {x.resumeRef}
                  </span>
                </button>
              ))}
            <button onClick={() => setTab("intake")} className={`${secondary} w-full`}>
              + Добавить резюме
            </button>
          </div>
        </Section>

        <Section title="02 · Top‑3 от AI" description="Каждый вариант содержит причину и факт из резюме.">
          <div className="mt-4 max-h-205 space-y-4 overflow-y-auto pr-1">
            {evaluations.map((e) => {
              const candidate = ownCandidate(e.candidateId);
              return (
                <article key={e.id} className="rounded-xl border border-border p-4">
                  <div className="flex justify-between gap-2">
                    <strong>{candidate?.name}</strong>
                    <span className="text-xs text-muted-foreground">
                      {e.state === "draft" ? "Черновик" : "HR подтвердил"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{e.output.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {e.output.greenFlags.map((x) => (
                      <span key={x} className="rounded bg-success/15 px-2 py-1 text-xs text-success">
                        + {x}
                      </span>
                    ))}
                    {e.output.redFlags.map((x) => (
                      <span key={x} className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">
                        − {x}
                      </span>
                    ))}
                  </div>
                  <fieldset className="mt-4 space-y-2" disabled={e.state !== "draft"}>
                    {e.output.recommendations.map((r) => (
                      <label key={r.action} className="flex cursor-pointer gap-3 rounded-xl border border-border p-3 text-xs">
                        <input
                          type="radio"
                          name={`decision-${e.id}`}
                          checked={(setDecision as unknown as {():void}) ? undefined : undefined}
                          onChange={() =>
                            setDecision((prev) => ({
                              ...prev,
                              [e.id]: r.action,
                            }))
                          }
                        />
                        <span>
                          <strong>{r.title}</strong>
                          <span className="mt-1 block text-muted-foreground">
                            {r.reason}. {r.evidence}
                          </span>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                  <details className="mt-3 text-xs">
                    <summary className="cursor-pointer font-semibold">JSON input / output</summary>
                    <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap rounded-lg bg-background p-3">
                      {JSON.stringify({ input: e.input, output: e.output }, null, 2)}
                    </pre>
                  </details>
                  {e.state === "draft" && (
                    <button onClick={() => confirm(e)} className={`${primary} mt-4 w-full`}>
                      Выбрать и подтвердить → mock MCP
                    </button>
                  )}
                </article>
              );
            })}
            {!evaluations.length && (
              <p className="text-sm text-muted-foreground">
                Подайте резюме, чтобы запустить AI автоматически.
              </p>
            )}
          </div>
        </Section>

        <Section title="03 · Правила HR и MCP" description="Промпт влияет на последующие анкеты. Память подключается явно.">
          <form onSubmit={savePrompt} className="mt-4 space-y-3">
            <label className="block text-xs font-semibold">
              Инструкция AI
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                rows={7}
                className={`${inputClass} mt-2`}
              />
            </label>
            <div className="text-xs font-semibold">Разрешённые действия</div>
            <div className="flex flex-wrap gap-2">
              {(["interview", "review", "rejected"] as Action[]).map((a) => (
                <label key={a} className="rounded-lg border border-border p-2 text-xs">
                  <input
                    type="checkbox"
                    checked={allowed.includes(a)}
                    onChange={() =>
                      setAllowed(
                        allowed.includes(a)
                          ? allowed.filter((x) => x !== a)
                          : [...allowed, a],
                      )
                    }
                    className="mr-1"
                  />
                  {actionLabel[a]}
                </label>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={memoryEnabled}
                onChange={(e) => setMemoryEnabled(e.target.checked)}
              /> Использовать подтверждённую память Markdown
            </label>
            <button className={primary}>Сохранить правила · v{prompt?.version ?? 0}</button>
          </form>
          <div className="mt-6 border-t border-border pt-4">
            <h3 className="text-sm font-bold">Выполнено через mock MCP</h3>
            {state.mcpRuns
              .filter((x) => x.tenantId === tenantId)
              .slice(0, 5)
              .map((run) => (
                <div key={run.id} className="mt-2 rounded-lg bg-success/10 p-2 text-xs">
                  {run.tool} · {ownCandidate(run.candidateId)?.name} · {date(run.createdAt)}
                </div>
              ))}
            {!state.mcpRuns.some((x) => x.tenantId === tenantId) && (
              <p className="mt-2 text-xs text-muted-foreground">До подтверждения HR вызовов нет.</p>
            )}
          </div>
        </Section>
      </div>

      {state.feedback.filter((x) => x.tenantId === tenantId && x.state === "pending").length > 0 && (
        <Section title="Согласование с менеджером" description="До согласования письмо кандидату не отправляется.">
          <div className="mt-4 space-y-3">
            {state.feedback
              .filter((x) => x.tenantId === tenantId && x.state === "pending")
              .map((x) => (
                <div key={x.id} className="rounded-xl border border-border p-3 text-sm">
                  <strong>{ownCandidate(x.candidateId)?.name} · {x.intent}</strong>
                  <p className="mt-1">{x.note}</p>
                  <div className="mt-3 flex gap-2">
                    <button className={primary} onClick={() => reviewFeedback(x.id, true)}>
                      Согласовать
                    </button>
                    <button className={secondary} onClick={() => reviewFeedback(x.id, false)}>
                      Отклонить
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </Section>
      )}
    </div>
  );
}
