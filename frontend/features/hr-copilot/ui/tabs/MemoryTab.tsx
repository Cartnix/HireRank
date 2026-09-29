import type { Memory } from "../../model/types";
import { secondary } from "../constants";
import { Section } from "../Section";

export function MemoryTab({
  memory,
  tenantId,
  prompt,
  onDownload,
}: {
  memory: Memory[];
  tenantId: string;
  prompt: { useMemory: boolean } | undefined;
  onDownload: () => void;
}) {
  return (
    <Section title="Опциональная память решений" description="Только подтверждённые HR записи могут попасть в следующий AI input.">
      <div className="mt-4 text-xs">
        Использование в анализе: <strong>{prompt?.useMemory ? "включено" : "выключено"}</strong>
      </div>
      <pre className="mt-4 max-h-115 overflow-auto whitespace-pre-wrap rounded-xl bg-background p-4 text-xs">
        {memory
          .filter((x) => x.tenantId === tenantId)
          .map((x) => x.markdown)
          .join("\n\n---\n\n") || "# Память пуста"}
      </pre>
      <button onClick={onDownload} className={`${secondary} mt-3`}>
        Скачать memory.md
      </button>
    </Section>
  );
}
