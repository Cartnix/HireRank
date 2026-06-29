import {
    Field,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

interface InputProps {
    type: "text" | "email" | "password",
    placeholder: string,
    label: string,
    error?: string
}

export function InputField({ type, placeholder, label, error }: InputProps) {
    return (
        <Field>
            <FieldLabel htmlFor="input-field-username">{label}</FieldLabel>
            <Input
                type={type}
                placeholder={placeholder}
            />
            {error && <span className="text-red-500 text-xs mt-1">{error}</span>}
        </Field>
    )
}
