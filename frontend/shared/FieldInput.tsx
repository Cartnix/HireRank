import {
    Field,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

interface InputProps {
    type: "text" | "email" | "password",
    placeholder: string,
    label: string
}

export function InputField({ type, placeholder, label }: InputProps) {
    return (
        <Field>
            <FieldLabel htmlFor="input-field-username">{label}</FieldLabel>
            <Input
                type={type}
                placeholder={placeholder}
            />
        </Field>
    )
}
