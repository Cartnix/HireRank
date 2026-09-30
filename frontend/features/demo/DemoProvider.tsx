"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuthSession } from "@/features/auth/AuthProvider";
import { apiFetch, setApiPreviewRole, setApiDevelopmentMode } from "@/shared/api/client";
import { freshState } from "@/features/hr-copilot/model/engine";

import { CopilotStateSchema, type CopilotState, type Role } from "@/features/hr-copilot/model/types";
export { DEMO_TENANT, demoCan } from "./access";
type Demo = { pending: boolean; ready: boolean; enabled: boolean; canDevelop: boolean; devAvailable: boolean; permissions: string[]; administration: boolean; canAdminister: boolean; setAdministration: (value: boolean) => void; canMutate: boolean; setEnabled: (value: boolean) => void; role: Role; setRole: (value: Role) => void; state: CopilotState; reload: () => Promise<void>; update: (fn: (state: CopilotState) => void) => boolean; message: string };
const Context = createContext<Demo | null>(null);
export function DemoProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthSession();
  const [authorizedUser, setAuthorizedUser] = useState<typeof user>(null);
  const [verifiedUser, setVerifiedUser] = useState<typeof user>(null);
  const [datasetUser, setDatasetUser] = useState<typeof user>(null);
  const [requested, setRequested] = useState(false);
  const [previewRole, setPreviewRole] = useState<Role | null>(null);
  const [adminSession, setAdminSession] = useState<{ identity: typeof user; role: Role; enabled: boolean } | null>(null);
  const canDevelop = !isLoading && user?.role === "superuser" && authorizedUser === user;
  const devAvailable = canDevelop && datasetUser === user;
  const enabled = devAvailable && requested;
  const ready = !isLoading && (user?.role !== "superuser" || verifiedUser === user);
  const role = (canDevelop ? previewRole : null) ?? (user?.role as Role | undefined) ?? "candidate";
  const canAdminister = !isLoading && !!user && ["superuser", "administrator"].includes(role);
  const administration = canAdminister && adminSession?.identity === user && adminSession?.role === role && adminSession?.enabled === enabled;
  const canMutate = !["superuser", "administrator"].includes(role) || administration;
  const saving = useRef(false);
  const [pending, setPending] = useState(false);
  const revision = useRef(0);
  const [matrix, setMatrix] = useState<Record<string, string[]>>({});
  const [state, setState] = useState(freshState);
  const [message, setMessage] = useState("");
  useEffect(() => {
    localStorage.removeItem("hirerank-copilot-demo-v1");
    localStorage.removeItem("hirerank-demo-enabled");
    localStorage.removeItem("hirerank-demo-role");
  }, []);
  useEffect(() => {
    if (!isLoading && user) return;
    const frame = requestAnimationFrame(() => { setApiPreviewRole(null); setApiDevelopmentMode(false); setDatasetUser(null); setAdminSession(null); setAuthorizedUser(null); setVerifiedUser(null); setRequested(false); setPreviewRole(null); setState(freshState()); });
    return () => cancelAnimationFrame(frame);
  }, [isLoading, user]);
  useEffect(() => {
    if (isLoading || user?.role !== "superuser") return;
    let cancelled = false;
    void apiFetch<{ permissions: Record<string, string[]> }>("/developer/access", { cache: "no-store" }).then(async access => {
      if (cancelled) return;
      setMatrix(access.permissions);
      setAuthorizedUser(user);
      setVerifiedUser(user);
      setApiPreviewRole(null);
      setRequested(false);
      setPreviewRole(null);
      try {
        const raw = await apiFetch<{ revision: number }>("/developer/dataset", { cache: "no-store" });
        const loaded = CopilotStateSchema.parse(raw);
        revision.current = raw.revision;
        if (!cancelled) { setState(loaded); setDatasetUser(user); setMessage(""); }
      } catch { if (!cancelled) setMessage("Тестовые данные недоступны. Проверьте dev БД и миграции."); }
    }).catch(() => { if (!cancelled) { setAuthorizedUser(null); setVerifiedUser(user); } });
    return () => { cancelled = true; };
  }, [user, isLoading]);
  function setRole(value: Role) { if (!canDevelop) return; setApiPreviewRole(!enabled && value !== "superuser" ? value : null); setPreviewRole(value); setAdminSession(null); }
  function toggle(value: boolean) { if (!canDevelop) return; setApiDevelopmentMode(value && devAvailable); setApiPreviewRole(!value && role !== "superuser" ? role : null); setRequested(value); setAdminSession(null); }
  function setAdministration(value: boolean) { setAdminSession(value && canAdminister ? { identity: user, role, enabled } : null); }
  async function reload() { const raw = await apiFetch<{ revision: number }>("/developer/dataset", { cache: "no-store" });
        const loaded = CopilotStateSchema.parse(raw);
        revision.current = raw.revision; setState(loaded); setDatasetUser(user); }
  useEffect(() => { setApiDevelopmentMode(enabled); return () => setApiDevelopmentMode(false); }, [enabled]);
  useEffect(() => () => setApiPreviewRole(null), []);
  function update(fn: (next: CopilotState) => void) {
    if (!enabled || !canMutate) return false;
    if (saving.current) { setMessage("Дождитесь сохранения предыдущего изменения."); return false; }
    try { const next = structuredClone(state); fn(next); setState(next); setMessage("");
      saving.current = true; setPending(true);
      void apiFetch("/developer/dataset", { method: "PUT", json: { users: next.users, vacancies: next.vacancies, candidates: next.candidates, prompts: next.prompts, evaluations: next.evaluations, feedback: next.feedback, notifications: next.notifications, audit: next.audit, memory: next.memory, mcpRuns: next.mcpRuns, revision: revision.current } }).then(() => { revision.current++; }).catch(async error => {
        setMessage(error instanceof Error ? error.message : "Не удалось сохранить dev данные");
        try { await reload(); } catch { setState(state); }
      }).finally(() => { saving.current = false; setPending(false); });
      return true; }
    catch (error) { setMessage(error instanceof Error ? error.message : "Ошибка операции"); return false; }
  }
  return <Context.Provider value={{ pending, ready, enabled, canDevelop, devAvailable, permissions: canDevelop ? matrix[role] ?? [] : user?.permissions ?? [], administration, canAdminister, setAdministration, canMutate, setEnabled: toggle, role, setRole, reload, state: canDevelop ? state : freshState(), update, message }}>{children}</Context.Provider>;
}
export function useDemo() { const value = useContext(Context); if (!value) throw Error("DemoProvider required"); return value; }

export function useOptionalDemo() { return useContext(Context); }
