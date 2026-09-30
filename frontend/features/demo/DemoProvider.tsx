"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuthSession } from "@/features/auth/AuthProvider";
import { apiFetch } from "@/shared/api/client";
import { freshState } from "@/features/hr-copilot/model/engine";

import { CopilotStateSchema, type CopilotState, type Role } from "@/features/hr-copilot/model/types";
export { DEMO_TENANT, demoCan } from "./access";
type Demo = { ready: boolean; enabled: boolean; canDevelop: boolean; administration: boolean; canAdminister: boolean; setAdministration: (value: boolean) => void; canMutate: boolean; setEnabled: (value: boolean) => void; role: Role; setRole: (value: Role) => void; state: CopilotState; update: (fn: (state: CopilotState) => void) => boolean; message: string };
const Context = createContext<Demo | null>(null);
export function DemoProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthSession();
  const [authorizedUser, setAuthorizedUser] = useState<typeof user>(null);
  const [verifiedUser, setVerifiedUser] = useState<typeof user>(null);
  const [requested, setRequested] = useState(false);
  const [previewRole, setPreviewRole] = useState<Role | null>(null);
  const [adminSession, setAdminSession] = useState<{ identity: typeof user; role: Role; enabled: boolean } | null>(null);
  const canDevelop = !isLoading && user?.role === "superuser" && authorizedUser === user;
  const enabled = canDevelop && requested;
  const ready = !isLoading && (user?.role !== "superuser" || verifiedUser === user);
  const role = (enabled ? previewRole : null) ?? (user?.role as Role | undefined) ?? "candidate";
  const canAdminister = !isLoading && !!user && ["superuser", "administrator"].includes(role);
  const administration = canAdminister && adminSession?.identity === user && adminSession?.role === role && adminSession?.enabled === enabled;
  const canMutate = !["superuser", "administrator"].includes(role) || administration;
  const [state, setState] = useState(freshState);
  const [message, setMessage] = useState("");
  useEffect(() => {
    localStorage.removeItem("hirerank-copilot-demo-v1");
    localStorage.removeItem("hirerank-demo-enabled");
    localStorage.removeItem("hirerank-demo-role");
  }, []);
  useEffect(() => {
    if (!isLoading && user) return;
    const frame = requestAnimationFrame(() => { setAdminSession(null); setAuthorizedUser(null); setVerifiedUser(null); setRequested(false); setPreviewRole(null); setState(freshState()); });
    return () => cancelAnimationFrame(frame);
  }, [isLoading, user]);
  useEffect(() => {
    if (isLoading || user?.role !== "superuser") return;
    let cancelled = false;
    void apiFetch("/developer/dataset", { cache: "no-store" }).then(data => {
      const loaded = CopilotStateSchema.parse(data);
      if (cancelled) return;
      setAuthorizedUser(user);
      setVerifiedUser(user);
      setState(loaded);
      setRequested(false);
      setPreviewRole(null);
    }).catch(() => { if (!cancelled) { setAuthorizedUser(null); setVerifiedUser(user); setMessage("Тестовые данные недоступны. Проверьте dev БД и миграции."); } });
    return () => { cancelled = true; };
  }, [user, isLoading]);
  function setRole(value: Role) { if (!canDevelop || !enabled) return; setPreviewRole(value); setAdminSession(null); }
  function toggle(value: boolean) { if (!canDevelop) return; setRequested(value); setPreviewRole(null); setAdminSession(null); }
  function setAdministration(value: boolean) { setAdminSession(value && canAdminister ? { identity: user, role, enabled } : null); }
  function update(fn: (next: CopilotState) => void) {
    if (!enabled || !canMutate) return false;
    try { const next = structuredClone(state); fn(next); setState(next); setMessage(""); return true; }
    catch (error) { setMessage(error instanceof Error ? error.message : "Ошибка операции"); return false; }
  }
  return <Context.Provider value={{ ready, enabled, canDevelop, administration, canAdminister, setAdministration, canMutate, setEnabled: toggle, role, setRole, state: canDevelop ? state : freshState(), update, message }}>{children}</Context.Provider>;
}
export function useDemo() { const value = useContext(Context); if (!value) throw Error("DemoProvider required"); return value; }

export function useOptionalDemo() { return useContext(Context); }
