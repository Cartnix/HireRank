import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { RegisterFormValuesType } from "@/features/auth/model/FormSchema";

interface ConsentFieldsetProps {
  register: UseFormRegister<RegisterFormValuesType>;
  errors: FieldErrors<RegisterFormValuesType>;
}

export function ConsentFieldset({
  register,
  errors,
}: ConsentFieldsetProps) {
  return (
    <fieldset className="flex flex-col gap-3 rounded-2xl border border-border-subtle p-4">
      <legend className="px-1 text-sm text-foreground-secondary">
        Согласия при регистрации
      </legend>
      <label className="flex items-start gap-3 text-sm text-foreground">
        <input
          type="checkbox"
          className="mt-1"
          {...register("consent_account_processing")}
        />
        <span>
          Я даю согласие на сбор и обработку моих персональных данных в
          соответствии с условиями использования и политикой конфиденциальности
          (обязательно).
        </span>
      </label>
      {errors.consent_account_processing?.message && (
        <p className="text-sm text-danger">
          {errors.consent_account_processing.message}
        </p>
      )}
    </fieldset>
  );
}
