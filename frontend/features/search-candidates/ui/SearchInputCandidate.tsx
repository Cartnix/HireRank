// features/search/SearchInput.tsx
import { InputField } from "@/shared/FieldInput";
import { Search } from "lucide-react";

export function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <InputField
      LeftIcon={Search}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Поиск по имени или навыку..."
      className="rounded-full"
    />
  );
}