"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuthSession } from "@/features/auth/AuthProvider";
import { freshState } from "@/features/hr-copilot/model/engine";
import { loadCopilotState, saveCopilotState, COPILOT_STATE_EVENT, COPILOT_STORAGE_KEY } from "@/features/hr-copilot/model/storage";
import type { CopilotState, Role } from "@/features/hr-copilot/model/types";
export { DEMO_TENANT, demoCan } from "./access";
type Demo = { enabled: boolean; setEnabled: (value: boolean) => void; role: Role; setRole: (value: Role) => void; state: CopilotState; update: (fn: (state: CopilotState) => void) => boolean; message: string };
const Context = createContext<Demo | null>(null);
export function DemoProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthSession();
  const [enabled, setEnabled] = useState(false);
  const [previewRole, setPreviewRole] = useState<Role | null>(null);
  const role = previewRole ?? (user?.role as Role | undefined) ?? "hr";
  const [state, setState] = useState(freshState);
  const [message, setMessage] = useState("");
  useEffect(() => { const frame = requestAnimationFrame(() => { setState(loadCopilotState()); setEnabled(localStorage.getItem("hirerank-demo-enabled") === "true"); const savedRole = localStorage.getItem("hirerank-demo-role"); if (localStorage.getItem("hirerank-demo-enabled") === "true" && ["hr", "administrator", "manager", "recruiter", "candidate"].includes(savedRole ?? "")) setPreviewRole(savedRole as Role); }); return () => cancelAnimationFrame(frame); }, []);
  useEffect(() => {
    const sync = () => setState(loadCopilotState());
    const storage = (event: StorageEvent) => { if (event.key === COPILOT_STORAGE_KEY || event.key === null) sync(); };
    window.addEventListener(COPILOT_STATE_EVENT, sync); window.addEventListener("storage", storage);
    return () => { window.removeEventListener(COPILOT_STATE_EVENT, sync); window.removeEventListener("storage", storage); };
  }, []);
  function setRole(value: Role) { localStorage.setItem("hirerank-demo-role", value); setPreviewRole(value); }
  function toggle(value: boolean) { localStorage.setItem("hirerank-demo-enabled", String(value)); setEnabled(value); setPreviewRole(null); localStorage.removeItem("hirerank-demo-role"); }
  function update(fn: (next: CopilotState) => void) {
    if (!enabled) return false;
    try { const next = structuredClone(state); fn(next); saveCopilotState(next); setState(next); setMessage(""); return true; }
    catch (error) { setMessage(error instanceof Error ? error.message : "Ошибка операции"); return false; }
  }
  return <Context.Provider value={{ enabled, setEnabled: toggle, role, setRole, state, update, message }}>{children}</Context.Provider>;
}
export function useDemo() { const value = useContext(Context); if (!value) throw Error("DemoProvider required"); return value; }
