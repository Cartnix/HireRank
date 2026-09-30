"use client";
import { useState } from "react";
import { useDemo } from "./DemoProvider";
import { apiFetch } from "@/shared/api/client";
import { card, inputClass, primary, secondary } from "@/features/hr-copilot/ui/constants";

export function DeveloperSettings() {
  const demo = useDemo();
  const [candidates, setCandidates] = useState(20);
  const [vacancies, setVacancies] = useState(20);
  const [clear, setClear] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  if (!demo.canDevelop) return <p role="alert">Инструменты доступны только суперюзеру.</p>;
  async function generate() {
    if (busy) return;
    if (clear && !window.confirm("Удалить существующих кандидатов, вакансии и связанные интервью только в dev БД и создать новые?")) return;
    setBusy(true); setError(""); setResult("");
    try {
      await apiFetch("/developer/generate", { method: "POST", json: { candidates, vacancies, clear_existing: clear } });
      await demo.reload();
      setResult(`В dev БД созданы ${candidates} кандидатов и ${vacancies} вакансий.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка генерации"); }
    finally { setBusy(false); }
  }
  async function importData() {
    if (busy || confirmation !== "IMPORT TO REAL DATABASE") return;
    setBusy(true); setError(""); setResult("");
    try {
      const data = await apiFetch<{ candidate: number; vacancy: number; batch: string }>("/developer/import", { method: "POST", json: { confirmation } });
      setResult(`В реальную БД импортированы ${data.candidate} кандидатов и ${data.vacancy} вакансий. Пакет: ${data.batch}.`);
      setConfirmOpen(false); setConfirmation("");
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка импорта"); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-3xl space-y-5">
    <h1 className="text-2xl font-semibold">DEV settings · Суперюзер</h1>
    <p className="text-sm text-muted-foreground">Генерация сохраняет данные в отдельной dev БД. Импорт читает её непосредственно на сервере и создаёт копии в реальной БД.</p>
    {error && <p role="alert" className="text-destructive">{error}</p>}{result && <p role="status">{result}</p>}
    <section className={`${card} space-y-4`}><h2>Генерация тестовых данных</h2>
      <label className="block text-sm">Кандидаты<input className={inputClass} type="number" min={1} max={500} value={candidates} onChange={e => setCandidates(Number(e.target.value))} /></label>
      <label className="block text-sm">Вакансии<input className={inputClass} type="number" min={1} max={100} value={vacancies} onChange={e => setVacancies(Number(e.target.value))} /></label>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={clear} onChange={e => setClear(e.target.checked)} />Удалить существующие данные в dev БД</label>
      <button className={primary} disabled={busy || candidates < 1 || candidates > 500 || vacancies < 1 || vacancies > 100} onClick={generate}>{busy ? "Выполняется…" : "Сгенерировать в dev БД"}</button>
    </section>
    <section className={`${card} space-y-4`}><h2>Импорт в реальную БД</h2><p className="text-sm">Кандидаты, вакансии, этапы, назначения, интервью и оценки будут скопированы с новыми ID. Существующие реальные записи сохраняются. Вакансии получат метку TEST; учётные записи dev-пользователей не переносятся.</p>
      <button className={secondary} disabled={busy} onClick={() => { setConfirmOpen(true); setConfirmation(""); }}>Импортировать из dev в реальную БД</button>
      {confirmOpen && <div role="dialog" aria-modal="false" aria-label="Подтверждение импорта" className="space-y-3 rounded-lg border border-destructive p-4"><p className="text-sm font-semibold">Вы изменяете РЕАЛЬНУЮ БД. Для подтверждения введите IMPORT TO REAL DATABASE</p><input aria-label="Подтверждение импорта" className={inputClass} value={confirmation} onChange={e => setConfirmation(e.target.value)} /><div className="flex gap-3"><button className={primary} disabled={busy || confirmation !== "IMPORT TO REAL DATABASE"} onClick={importData}>Подтвердить импорт</button><button className={secondary} disabled={busy} onClick={() => setConfirmOpen(false)}>Отмена</button></div></div>}
    </section>
  </div>;
}
