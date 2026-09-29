"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import {
  confirmDecision,
  freshState,
  intake,
  saveMemory,
} from "../model/engine";
import type {
  Action,
  CopilotState,
  Evaluation,
  Role,
} from "../model/types";
import { loadCopilotState, saveCopilotState } from "../model/storage";
import {
  actionLabel,
  allowedTabs,
  card,
  inputClass,
  primary,
  secondary,
  tabs,
  time,
  uid,
} from "./constants";
import { CopilotHeader } from "./CopilotHeader";
import { CopilotPanels } from "./CopilotPanels";
import { CopilotTabs } from "./CopilotTabs";
import { AuditTab } from "./tabs/AuditTab";
import { CopilotDashboardTab } from "./tabs/CopilotDashboardTab";
import { IntakeTab } from "./tabs/IntakeTab";
import { MemoryTab } from "./tabs/MemoryTab";

type Tab = (typeof tabs)[number]["id"];

export function CopilotWorkspace() {
  const [state, setState] = useState<CopilotState>(() => freshState());
  const [storageLoaded, setStorageLoaded] = useState(false);
  const initialTenantId = state.tenants[0]?.id ?? "";
  const initialPrompt = state.prompts.find((x) => x.tenantId === initialTenantId);
  const [role, setRole] = useState<Role>("hr");
  const [tenantId, setTenantId] = useState(initialTenantId);
  const [tab, setTab] = useState<Tab>("copilot");
  const [selectedCandidate, setSelectedCandidate] = useState("c-timur");
  const [message, setMessage] = useState("");
  const [memoryPrompt, setMemoryPrompt] = useState<string | null>(null);
  const [memoryReason, setMemoryReason] = useState("");
  const [memoryMode, setMemoryMode] = useState<"manual" | "draft">("manual");
  const [decision, setDecision] = useState<Record<string, Action>>({});
  const [promptText, setPromptText] = useState(initialPrompt?.text ?? "");
  const [memoryEnabled, setMemoryEnabled] = useState(initialPrompt?.useMemory ?? false);
  const [allowed, setAllowed] = useState<Action[]>(
    initialPrompt?.allowedActions ?? ["interview", "review", "rejected"],
  );
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = loadCopilotState();

      const savedTenantId = saved.tenants[0]?.id ?? "";
      const savedPrompt = saved.prompts.find(
        (x) => x.tenantId === savedTenantId,
      );
      setTenantId(savedTenantId);
      setPromptText(savedPrompt?.text ?? "");
      setMemoryEnabled(savedPrompt?.useMemory ?? false);
      setAllowed(savedPrompt?.allowedActions ?? ["interview", "review", "rejected"]);
      setState(saved);
      setStorageLoaded(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (storageLoaded) saveCopilotState(state);
  }, [state, storageLoaded]);

  const update = (fn: (next: CopilotState) => void) => {
    const next = structuredClone(state);
    try {
      fn(next);
      setState(next);
      setMessage("");
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка операции");
      return false;
    }
  };

  const candidates = state.candidates.filter((x) => x.tenantId === tenantId);
  const vacancies = state.vacancies.filter((x) => x.tenantId === tenantId);
  const evaluations = state.evaluations.filter((x) => x.tenantId === tenantId);
  const ownCandidate = (id: string) => candidates.find((x) => x.id === id);
  const prompt = state.prompts.find((x) => x.tenantId === tenantId);

  const chooseRole = (next: Role) => {
    setRole(next);
    setTab(allowedTabs[next][0]);
    setMessage("");
  };

  const chooseTenant = (next: string) => {
    const nextPrompt = state.prompts.find((x) => x.tenantId === next);
    setTenantId(next);
    setSelectedCandidate(
      state.candidates.find((x) => x.tenantId === next)?.id ?? "",
    );
    setPromptText(nextPrompt?.text ?? "");
    setMemoryEnabled(nextPrompt?.useMemory ?? false);
    setAllowed(nextPrompt?.allowedActions ?? ["interview", "review", "rejected"]);
    setMessage("");
  };

  const toast = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 5000);
  };

  function submitIntake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const file = form.querySelector<HTMLInputElement>('input[name="resumeFile"]')?.files?.[0];
    const resumeText = String(values.get("resumeText") ?? "").trim();
    const resumeRef =
      file?.name ||
      String(values.get("resumeUrl") ?? "").trim() ||
      (resumeText ? "Текст в HTML форме" : "");

    if (!resumeRef) return toast("Добавьте файл, ссылку или текст резюме");
    if (file && !/\.(pdf|docx?|html?|txt)$/i.test(file.name))
      return toast("Доступны PDF, DOC, DOCX, HTML и TXT");

    const email = String(values.get("email") ?? "").trim().toLowerCase();
    const ok = update((next) => {
      const created = intake(
        next,
        tenantId,
        role === "candidate"
          ? "candidate"
          : role === "recruiter"
            ? "recruiter"
            : "hr",
        {
          name: String(values.get("name") ?? "").trim(),
          email,
          phone: String(values.get("phone") ?? "").trim(),
          experience: String(values.get("experience") ?? "").trim(),
          skills: String(values.get("skills") ?? "").trim(),
          resumeRef,
          resumeText,
          requestedVacancyId: String(values.get("vacancyId") ?? "") || null,
        },
      );
      setSelectedCandidate(created.id);
    });

    if (ok) {
      form.reset();
      toast("Анкета в пуле. AI создал черновик для HR; статус пока «Новый».");
    }
  }

  function confirm(evaluation: Evaluation) {
    const action =
      decision[evaluation.id] ?? evaluation.output.recommendations[0]?.action;
    if (!action) return toast("Выберите действие");
    if (
      !window.confirm(
        `HR подтверждает «${actionLabel[action]}» для ${ownCandidate(evaluation.candidateId)?.name}? Только после этого mock MCP изменит ATS.`,
      )
    )
      return;

    if (
      update((next) => {
        confirmDecision(next, tenantId, role, evaluation.id, action);
      })
    ) {
      setMemoryPrompt(evaluation.id);
      setMemoryReason("");
      setMemoryMode("manual");
      toast("Mock MCP исполнил решение после подтверждения HR");
    }
  }

  function savePrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (role !== "hr" || !allowed.length || promptText.trim().length < 12)
      return toast("Нужна инструкция и хотя бы одно действие");

    update((next) => {
      const index = next.prompts.findIndex((x) => x.tenantId === tenantId);
      const nextPrompt = {
        tenantId,
        text: promptText.trim(),
        useMemory: memoryEnabled,
        allowedActions: allowed,
        version: (next.prompts[index]?.version ?? 0) + 1,
      };

      if (index < 0) next.prompts.push(nextPrompt);
      else next.prompts[index] = nextPrompt;

      next.audit.unshift({
        id: uid(),
        tenantId,
        candidateId: null,
        actor: "hr",
        action: "prompt.updated",
        detail: `v${nextPrompt.version}; memory=${memoryEnabled}`,
        createdAt: time(),
      });
    });

    toast("Правила HR сохранены для следующих резюме");
  }

  function reviewFeedback(id: string, approved: boolean) {
    if (role !== "hr") return;

    update((next) => {
      const feedback = next.feedback.find(
        (x) => x.id === id && x.tenantId === tenantId && x.state === "pending",
      );
      if (!feedback) throw Error("Запрос недоступен");
      feedback.state = approved ? "approved" : "declined";

      next.audit.unshift({
        id: uid(),
        tenantId,
        candidateId: feedback.candidateId,
        actor: "hr",
        action: "feedback.reviewed",
        detail: feedback.state,
        createdAt: time(),
      });
      next.notifications.unshift({
        id: uid(),
        tenantId,
        candidateId: feedback.candidateId,
        role: "manager",
        text: approved
          ? "HR согласовал предложение. Письмо пока черновик."
          : "HR отклонил предложение",
        read: false,
        createdAt: time(),
      });
    });
  }

  const renderTab = () => {
    switch (tab) {
      case "copilot":
        return role === "hr" ? (
          <CopilotDashboardTab
            state={state}
            tenantId={tenantId}
            candidates={candidates}
            evaluations={evaluations}
            selectedCandidate={selectedCandidate}
            promptText={promptText}
            prompt={prompt}
            allowed={allowed}
            memoryEnabled={memoryEnabled}
            setSelectedCandidate={setSelectedCandidate}
            setTab={setTab}
            setPromptText={setPromptText}
            setAllowed={setAllowed}
            setMemoryEnabled={setMemoryEnabled}
            setDecision={setDecision}
            ownCandidate={ownCandidate}
            confirm={confirm}
            savePrompt={savePrompt}
            reviewFeedback={reviewFeedback}
          />
        ) : null;
      case "intake":
        return <IntakeTab vacancies={vacancies} submitIntake={submitIntake} />;
      case "memory":
        return role === "hr" ? (
          <MemoryTab
            memory={state.memory}
            tenantId={tenantId}
            prompt={prompt}
            onDownload={() => {
              const text =
                state.memory
                  .filter((x) => x.tenantId === tenantId)
                  .map((x) => x.markdown)
                  .join("\n\n---\n\n") || "# Память пуста\n";
              const url = URL.createObjectURL(
                new Blob([text], { type: "text/markdown" }),
              );
              const link = document.createElement("a");
              link.href = url;
              link.download = "memory.md";
              link.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          />
        ) : null;
      case "audit":
        return role === "hr" || role === "administrator" ? (
          <AuditTab
            tenantId={tenantId}
            state={state}
            onResetDemo={() => {
              if (window.confirm("Сбросить локальное демо?")) {
                setState(freshState());
                setMessage("Демо сброшено");
              }
            }}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-12">
      <CopilotHeader
        state={state}
        tenantId={tenantId}
        role={role}
        onTenantChange={chooseTenant}
        onRoleChange={chooseRole}
      />
      <CopilotTabs
        role={role}
        tab={tab}
        onChange={setTab}
      />
      <CopilotPanels>
        {message && (
          <div
            role="status"
            className="rounded-xl border border-brand-primary/30 bg-brand-primary/10 p-3 text-sm"
          >
            {message}
          </div>
        )}
      </CopilotPanels>

      {renderTab()}

      {memoryPrompt && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Подтверждение памяти"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className={`${card} w-full max-w-xl`}>
            <div className="flex items-center gap-2 text-lg font-bold">
              <ShieldCheck size={20} className="text-brand-primary" /> Сохранить
              решение в память?
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Можно отказаться. Сгенерированный mock текст нельзя записать без
              вашей проверки.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setMemoryMode("manual");
                  setMemoryReason("");
                }}
                className={secondary}
              >
                Написать самому
              </button>
              <button
                onClick={() => {
                  const e = evaluations.find((x) => x.id === memoryPrompt);
                  setMemoryMode("draft");
                  setMemoryReason(
                    e
                      ? `HR выбрал ${actionLabel[e.chosenAction ?? "review"]}. Проверенные факты: ${e.output.greenFlags.join("; ")}. Причину выбора нужно сверить с резюме.`
                      : "",
                  );
                }}
                className={secondary}
              >
                Сгенерировать mock черновик
              </button>
            </div>
            <label className="mt-4 block text-xs font-semibold">
              Подтверждённая вами причина
              {memoryMode === "draft" ? " · проверьте AI черновик" : ""}
              <textarea
                value={memoryReason}
                onChange={(e) => setMemoryReason(e.target.value)}
                rows={4}
                className={`${inputClass} mt-2`}
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setMemoryPrompt(null)} className={secondary}>
                Не сохранять
              </button>
              <button
                onClick={() => {
                  if (
                    update((next) =>
                      saveMemory(
                        next,
                        tenantId,
                        role,
                        memoryPrompt,
                        memoryReason,
                      ),
                    )
                  ) {
                    setMemoryPrompt(null);
                    toast("Причина подтверждена HR и записана в Markdown");
                  }
                }}
                disabled={!memoryReason.trim()}
                className={primary}
              >
                Подтверждаю причину и запись
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
