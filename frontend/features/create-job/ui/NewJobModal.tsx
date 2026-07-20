"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Job, DEFAULT_STAGES } from "@/entities/job";
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
  const [description, setDescription] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[16px] font-semibold">Новая вакансия</div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3">
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
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Краткое описание"
            rows={3}
            className="w-full rounded-[10px] border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-brand-primary"
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
                employmentType: "Полная занятость",
                description:
                  description.trim() || "Описание пока не добавлено.",
                stages: DEFAULT_STAGES,
              });
            }}
          />
        </div>
      </Card>
    </div>
  );
}
