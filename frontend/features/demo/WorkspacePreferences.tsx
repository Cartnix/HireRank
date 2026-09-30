"use client";
import { useState } from "react";
import Link from "next/link";
import { useDemo } from "./DemoProvider";
import { card, primary } from "@/features/hr-copilot/ui/constants";
import { ThemeToggle } from "@/shared/ui/components/ThemeToogle";

export function WorkspacePreferences() {
  const demo = useDemo();
  const [digest, setDigest] = useState(true);
  const [saved, setSaved] = useState(false);
  return <div className="mx-auto max-w-3xl space-y-5"><header><h1 className="text-2xl">Настройки рабочего пространства</h1><p className="mt-2 text-sm text-muted-foreground">Dev mode · прототип персональных настроек HR. Настройки уведомлений действуют до перезагрузки страницы.</p></header><section className={`${card} space-y-4`}><h2 className="m-0 text-base">Оформление</h2><ThemeToggle /></section><section className={`${card} space-y-4`}><h2 className="m-0 text-base">Уведомления</h2><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={digest} onChange={e => { setDigest(e.target.checked); setSaved(false); }} /> Сводка новых кандидатов и решений, ожидающих HR</label><button className={primary} onClick={() => setSaved(true)}>Сохранить</button>{saved && <p role="status" className="text-sm">Настройка сохранена для текущего просмотра.</p>}</section><section className={card}><h2 className="m-0 text-base">HR Copilot</h2><p className="mt-3 text-sm text-muted-foreground">Инструкции анализа, разрешённые рекомендации и подтверждённая память команды.</p><Link className="text-brand-primary underline" href="/dashboard/copilot">{["hr", "administrator", "superuser"].includes(demo.role) ? "Настроить Copilot" : "Посмотреть возможности Copilot"}</Link></section></div>;
}
export function WorkspaceSupport() {
  return <div className="mx-auto max-w-3xl space-y-5"><h1 className="text-2xl">Поддержка и руководство</h1><p className="text-sm text-muted-foreground">Dev mode · знакомство с AI HR Copilot</p>{[
    ["Как начать подбор?", "Создайте вакансию с описанием и требованиями, затем добавьте резюме в разделе «Кандидаты» и назначьте его на вакансию."],
    ["Как работает HR Copilot?", "В карточке кандидата откройте HR Copilot. Сравните рекомендацию с резюме и вакансией в соседних панелях. Решение подтверждает HR; демо использует детерминированный анализ, а не реальную модель AI."],
    ["Как управлять панелями?", "Перетаскивайте левую границу панели, чтобы изменить ширину. Также доступны стрелки клавиатуры при фокусе на границе. Каждая панель прокручивается отдельно; на небольшом экране панели расположены друг под другом."],
    ["Почему недоступно действие?", "Возможности зависят от роли и режима администрирования. Пункты меню видны всем, но данные кандидатов и изменения доступны только согласно правам."],
  ].map(([title, text]) => <details key={title} className={card}><summary className="cursor-pointer text-sm font-semibold">{title}</summary><p className="mt-3 text-sm text-muted-foreground">{text}</p></details>)}<section className={card}><h2 className="m-0 text-base">Обратная связь</h2><p className="mt-3 text-sm text-muted-foreground">Для сообщения о проблеме подготовьте название раздела, выбранную роль и шаги воспроизведения. Отправка обращений пока не подключена.</p></section></div>;
}
