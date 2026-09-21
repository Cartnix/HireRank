import { MainButton } from "@/shared/ui/buttons/MainButton";

export function NoteComposer({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Добавить заметку об интервью..."
        className="w-full rounded-[10px] border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-brand-primary"
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
      />
      <MainButton title="Добавить" onClick={onSubmit} />
    </div>
  );
}
