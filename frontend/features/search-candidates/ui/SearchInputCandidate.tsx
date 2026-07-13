import { InputField } from "@/shared/FieldInput";
import { Search } from "lucide-react";

export function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <InputField
      LeftIcon={<Search className="w-4 h-4" />}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Поиск по имени..."
      className="rounded-full"
    />
  );
}
