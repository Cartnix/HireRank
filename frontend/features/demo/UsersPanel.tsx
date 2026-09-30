"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useAuthSession } from "@/features/auth/AuthProvider";
import { apiFetch } from "@/shared/api/client";
import type { components } from "@/shared/api/schema";
import { useDemo, DEMO_TENANT } from "./DemoProvider";
import { label, card, inputClass, primary, secondary } from "@/features/hr-copilot/ui/constants";
import { RoleSchema, type Role } from "@/features/hr-copilot/model/types";
type UserRow = Pick<components["schemas"]["UserPublic"], "id" | "email" | "role" | "tenant_id" | "first_name" | "last_name" | "is_active">;
export function UsersPanel() {
  const demo = useDemo();
  const { user } = useAuthSession();
  const [live, setLive] = useState<UserRow[]>([]);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<UserRow | "new" | null>(null);
  const [busy, setBusy] = useState(false);
  const role = demo.enabled ? demo.role : user?.role;
  const allowed = !!user && ["administrator", "superuser"].includes(role ?? "");
  const owner = role === "superuser";
  useEffect(() => {
    if (demo.enabled || !allowed) return;
    let cancelled = false;
    void (async () => {
      const rows: UserRow[] = [];
      for (let skip = 0; ; skip += 100) {
        const page = await apiFetch<components["schemas"]["UsersPublic"]>(`/users/?skip=${skip}&limit=100`);
        rows.push(...page.data);
        if (rows.length >= page.count || !page.data.length) break;
      }
      if (!cancelled) setLive(rows);
    })().catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : "Не удалось загрузить пользователей"); });
    return () => { cancelled = true; };
  }, [demo.enabled, allowed, user?.id, version]);
  if (!allowed) return <p role="alert">Недостаточно прав для просмотра пользователей.</p>;
  const rows = demo.enabled ? demo.state.users : live;
  const canManage = (row?: UserRow) => demo.administration && (owner || row?.role !== "superuser");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || !canManage(editing === "new" ? undefined : editing)) return;
    const form = new FormData(event.currentTarget);
    const chosenRole = RoleSchema.parse(form.get("role"));
    if (chosenRole === "superuser" && !owner) return;
    const payload = { email: String(form.get("email")), first_name: String(form.get("first_name")), last_name: String(form.get("last_name")), role: chosenRole, is_active: form.get("is_active") === "on" };
    setBusy(true); setError("");
    try {
      if (demo.enabled) {
        if (!demo.update(next => {
          if (next.users.some(row => row.email.toLowerCase() === payload.email.toLowerCase() && row.id !== (editing === "new" ? null : editing.id))) throw Error("Email уже используется");
          if (editing === "new") next.users.unshift({ ...payload, id: crypto.randomUUID(), tenant_id: DEMO_TENANT });
          else Object.assign(next.users.find(row => row.id === editing.id)!, payload);
          next.audit.unshift({ id: crypto.randomUUID(), tenantId: DEMO_TENANT, candidateId: null, actor: role as Role, action: editing === "new" ? "user.created" : "user.updated", detail: payload.email, createdAt: new Date().toISOString() });
        })) return;
      } else {
        await apiFetch(editing === "new" ? "/users/" : `/users/${editing.id}`, { method: editing === "new" ? "POST" : "PATCH", json: editing === "new" ? { ...payload, password: String(form.get("password")) } : payload });
        setVersion(v => v + 1);
      }
      setEditing(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка сохранения"); }
    finally { setBusy(false); }
  }
  async function remove(row: UserRow) {
    if (!canManage(row) || row.id === user?.id || !confirm(`Удалить пользователя ${row.email}?`)) return;
    setBusy(true); setError("");
    try {
      if (demo.enabled) demo.update(next => {
        next.users = next.users.filter(item => item.id !== row.id);
        next.audit.unshift({ id: crypto.randomUUID(), tenantId: DEMO_TENANT, candidateId: null, actor: role as Role, action: "user.deleted", detail: row.email, createdAt: new Date().toISOString() });
      });
      else { await apiFetch(`/users/${row.id}`, { method: "DELETE" }); setVersion(v => v + 1); }
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка удаления"); }
    finally { setBusy(false); }
  }
  return <div className="space-y-5">
    <header className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Пользователи</h1>{demo.administration && <button className={primary} onClick={() => setEditing("new")}>Создать пользователя</button>}</header>
    {(error || demo.message) && <p role="alert">{error || demo.message}</p>}
    {editing && canManage(editing === "new" ? undefined : editing) && <form key={editing === "new" ? "new" : editing.id} onSubmit={save} className={`${card} grid gap-4 md:grid-cols-2`}>
      {(["email", "first_name", "last_name"] as const).map((field, i) => <label key={field}>{["Email", "Имя", "Фамилия"][i]}<input className={inputClass} name={field} type={field === "email" ? "email" : "text"} required={field === "email"} defaultValue={editing === "new" ? "" : editing[field] ?? ""} /></label>)}
      <label>Роль<select name="role" className={inputClass} defaultValue={editing === "new" ? "candidate" : editing.role}>{Object.entries(label).filter(([r]) => owner || r !== "superuser").map(([r, text]) => <option key={r} value={r}>{text}</option>)}</select></label>
      <label><input type="checkbox" name="is_active" defaultChecked={editing === "new" || editing.is_active} /> Активен</label>
      {editing === "new" && !demo.enabled && <label>Пароль<input type="password" name="password" minLength={8} required className={inputClass} autoComplete="new-password" /></label>}
      <div className="flex gap-2"><button disabled={busy} className={primary}>Сохранить</button><button type="button" className={secondary} onClick={() => setEditing(null)}>Отмена</button></div>
    </form>}
    <div className="grid gap-3">{rows.map(row => <article key={row.id} className={`${card} flex flex-wrap items-center justify-between gap-3`}>
      <div><p className="font-semibold">{[row.first_name, row.last_name].filter(Boolean).join(" ") || row.email}</p><p className="text-sm text-muted-foreground">{row.email} · {label[row.role as Role] ?? row.role} · {row.is_active ? "Активен" : "Отключён"}</p></div>
      {canManage(row) && <div className="flex gap-2"><button disabled={busy} className={secondary} onClick={() => setEditing(row)}>Редактировать</button>{row.id !== user?.id && <button disabled={busy} className={`${secondary} text-destructive`} onClick={() => void remove(row)}>Удалить</button>}</div>}
    </article>)}</div>
  </div>;
}
