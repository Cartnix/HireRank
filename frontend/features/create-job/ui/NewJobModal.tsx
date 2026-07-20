"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Job, DEFAULT_STAGES, type JobExperienceLevel, type JobPriority, type JobWorkMode } from "@/entities/job";
import { Card } from "@/shared/ui/Card";
import { GhostButton } from "@/shared/ui/buttons/GhostButton";
import { MainButton } from "@/shared/ui/buttons/MainButton";

export function NewJobModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (job: Job) => void;
}) {
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("Полная занятость");
  const [description, setDescription] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [currency, setCurrency] = useState("KZT");
  const [workMode, setWorkMode] = useState<JobWorkMode>("Гибрид");
  const [experienceLevel, setExperienceLevel] = useState<JobExperienceLevel>("Middle");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [openingsCount, setOpeningsCount] = useState("");
  const [priority, setPriority] = useState<JobPriority>("Средний");
  const [recruiter, setRecruiter] = useState("");
  const [closingDate, setClosingDate] = useState("");

  const parseNumber = (value: string) => {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <Card className="w-full max-w-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[16px] font-semibold">Новая вакансия</div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название вакансии"
            className="w-full rounded-[10px] border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-brand-primary"
          />
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Отдел"
            className="w-full rounded-[10px] border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-brand-primary"
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Локация"
            className="w-full rounded-[10px] border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-brand-primary"
          />
          <input
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            placeholder="Тип занятости"
            className="w-full rounded-[10px] border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-brand-primary"
          />
          <input
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
            placeholder="Зарплата от"
            type="number"
            className="w-full rounded-[10px] border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-brand-primary"
          />
          <input
            value={salaryMax}
            onChange={(e) => setSalaryMax(e.target.value)}
            placeholder="Зарплата до"
            type="number"
            className="w-full rounded-[10px] border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-brand-primary"
          />
          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            placeholder="Валюта"
            className="w-full rounded-[10px] border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-brand-primary"
          />
          <select
            value={workMode}
            onChange={(e) => setWorkMode(e.target.value as JobWorkMode)}
            className="w-full rounded-[10px] border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-brand-primary"
          >
            <option value="Удалённо">Удалённо</option>
            <option value="Офис">Офис</option>
            <option value="Гибрид">Гибрид</option>
          </select>
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value as JobExperienceLevel)}
            className="w-full rounded-[10px] border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-brand-primary"
          >
            <option value="Junior">Junior</option>
            <option value="Middle">Middle</option>
            <option value="Senior">Senior</option>
            <option value="Lead">Lead</option>
            <option value="Неважно">Неважно</option>
          </select>
          <input
            value={openingsCount}
            onChange={(e) => setOpeningsCount(e.target.value)}
            placeholder="Количество позиций"
            type="number"
            className="w-full rounded-[10px] border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-brand-primary"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as JobPriority)}
            className="w-full rounded-[10px] border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-brand-primary"
          >
            <option value="Низкий">Низкий</option>
            <option value="Средний">Средний</option>
            <option value="Высокий">Высокий</option>
          </select>
          <input
            value={requiredSkills}
            onChange={(e) => setRequiredSkills(e.target.value)}
            placeholder="Навыки (через запятую)"
            className="w-full rounded-[10px] border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-brand-primary md:col-span-2"
          />
          <input
            value={recruiter}
            onChange={(e) => setRecruiter(e.target.value)}
            placeholder="Рекрутер"
            className="w-full rounded-[10px] border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-brand-primary"
          />
          <input
            value={closingDate}
            onChange={(e) => setClosingDate(e.target.value)}
            placeholder="Дата закрытия"
            type="date"
            className="w-full rounded-[10px] border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-brand-primary"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Краткое описание"
            rows={3}
            className="w-full rounded-[10px] border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-brand-primary md:col-span-2"
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <GhostButton onClick={onClose}>Отмена</GhostButton>
          <MainButton
            title="Создать"
            onClick={() => {
              if (title.trim() === "") return;
              onCreate({
                id: `j${Date.now()}`,
                title: title.trim(),
                department: department.trim() || "—",
                status: "Открыта",
                createdAt: new Date().toISOString().slice(0, 10),
                location: location.trim() || "—",
                employmentType: employmentType.trim() || "Полная занятость",
                description:
                  description.trim() || "Описание пока не добавлено.",
                stages: DEFAULT_STAGES,
                salaryMin: parseNumber(salaryMin),
                salaryMax: parseNumber(salaryMax),
                currency: currency.trim() || "KZT",
                workMode,
                experienceLevel,
                requiredSkills: requiredSkills
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
                openingsCount: parseNumber(openingsCount),
                priority,
                recruiter: recruiter.trim() || undefined,
                closingDate: closingDate || undefined,
              });
            }}
          />
        </div>
      </Card>
    </div>
  );
}
