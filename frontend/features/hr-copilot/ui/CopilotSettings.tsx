"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useDemo, DEMO_TENANT } from "@/features/demo/DemoProvider";
import { apiFetch } from "@/shared/api/client";
import { PromptSchema, type Action } from "../model/types";
import { actionLabel, card, inputClass, primary, secondary } from "./constants";

type Settings = Omit<ReturnType<typeof PromptSchema.parse>, "tenantId">;
export function CopilotSettings() {
  const demo = useDemo();
  const [live, setLive] = useState<Settings | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [fileError, setFileError] = useState("");
  const allowed = ["hr", "administrator", "superuser"].includes(demo.role);
  useEffect(() => {
    if (demo.enabled || !allowed) return;
    let active = true;
    void apiFetch<Settings>("/copilot/settings", { cache: "no-store" }).then(value => { if (active) setLive(value); }).catch(error => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, [demo.enabled, allowed]);
  const prompt = demo.enabled ? demo.state.prompts.find(p => p.tenantId === DEMO_TENANT) : live;
  if (!allowed) return <p role="alert">Настройки Copilot доступны HR и администратору.</p>;
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prompt || busy) return;
    const data = new FormData(event.currentTarget);
    try {
      const lines = (key: string) => String(data.get(key) ?? "").split("\n").map(line => line.trim()).filter(Boolean);
      const parsed = PromptSchema.parse({ ...prompt, tenantId: DEMO_TENANT, text: String(data.get("prompt") ?? "").trim(), greenFlags: lines("greenFlags"), redFlags: lines("redFlags"), allowedActions: data.getAll("action"), useMemory: data.get("memory") === "on", memoryMarkdown: String(data.get("memoryMarkdown") ?? "") });
      if (demo.enabled) {
        if (demo.update(next => { const index = next.prompts.findIndex(p => p.tenantId === DEMO_TENANT); next.prompts[index] = { ...parsed, version: parsed.version + 1 }; next.audit.unshift({ id: crypto.randomUUID(), tenantId: DEMO_TENANT, candidateId: null, actor: demo.role, action: "prompt.updated", detail: `v${parsed.version + 1}`, createdAt: new Date().toISOString() }); })) setMessage("Настройки отправлены в тестовую БД.");
      } else {
        setBusy(true);
        const body: Settings & { tenantId?: string } = { ...parsed };
        delete body.tenantId;
        setLive(await apiFetch<Settings>("/copilot/settings", { method: "PUT", json: body }));
        setMessage("Настройки сохранены в рабочей БД.");
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось сохранить настройки"); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-3xl space-y-5"><h1 className="text-2xl font-semibold">{demo.enabled ? "Dev mode · " : ""}Настройки HR Copilot</h1><p className="text-sm text-muted-foreground">Промпт, критерии и выбранная память применяются к следующим анализам. Рекомендации требуют подтверждения HR.</p>{!demo.enabled && <p className="text-sm text-muted-foreground">Автоматический AI-анализ в рабочей среде ещё не подключён. Настройки сохраняются для его подключения.</p>}{(message || demo.message) && <p role="status">{demo.message || message}</p>}{!prompt ? <p>Загрузка настроек…</p> : <form key={`${demo.enabled}:${prompt.version}`} onSubmit={save} className={`${card} space-y-5`}><fieldset disabled={busy || demo.pending || !demo.canMutate} className="space-y-5"><label className="block text-sm font-semibold">Инструкция Copilot<textarea required minLength={12} maxLength={20000} name="prompt" rows={7} defaultValue={prompt.text} className={`${inputClass} mt-2`} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm">Green flags · по одному критерию на строку<textarea name="greenFlags" rows={4} defaultValue={prompt.greenFlags.join("\n")} className={`${inputClass} mt-2`} /></label><label className="block text-sm">Red flags · по одному критерию на строку<textarea name="redFlags" rows={4} defaultValue={prompt.redFlags.join("\n")} className={`${inputClass} mt-2`} /></label></div><fieldset><legend className="mb-3 text-sm font-semibold">Разрешённые рекомендации</legend><div className="flex flex-wrap gap-2">{Object.entries(actionLabel).map(([action, name]) => <label key={action} className={secondary}><input type="checkbox" name="action" value={action} defaultChecked={prompt.allowedActions.includes(action as Action)} /> {name}</label>)}</div></fieldset><label className="flex gap-2 text-sm"><input type="checkbox" name="memory" defaultChecked={prompt.useMemory} /> Использовать память HR и memory.md</label><label className="block text-sm">Опциональный memory.md<input type="file" accept=".md,text/markdown,text/plain" className={`${inputClass} mt-2`} onChange={async event => { const file = event.currentTarget.files?.[0]; const form = event.currentTarget.form; if (!file || !form) return; if (file.size > 100000) { setFileError("Размер memory.md должен быть не больше 100 КБ"); return; } const content = await file.text(); const area = form.elements.namedItem("memoryMarkdown"); if (area instanceof HTMLTextAreaElement) area.value = content; setFileError(""); }} /></label>{fileError && <p role="alert">{fileError}</p>}<label className="block text-sm">Содержимое memory.md<textarea name="memoryMarkdown" rows={5} maxLength={100000} defaultValue={prompt.memoryMarkdown} className={`${inputClass} mt-2`} /></label><p className="text-xs text-muted-foreground">Конфигурация хранится на сервере в текущей среде. Очистка браузера не удаляет сохранённые настройки.</p><button className={primary}>{busy ? "Сохраняем…" : `Сохранить настройки · v${prompt.version}`}</button></fieldset></form>}</div>;
}
