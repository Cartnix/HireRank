import { useController, FieldValues, Control } from "react-hook-form";
import { InputField } from "@/shared/ui/FieldInput";

interface ConsentFieldsetProps<T extends FieldValues> {
  control: Control<T>;
  register: any;
  errors: any;
  crossBorder: boolean;
}

export function ConsentFieldset<T extends FieldValues>({
  control,
  register,
  errors,
  crossBorder,
}: ConsentFieldsetProps<T>) {
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
      <label className="flex items-start gap-3 text-sm text-foreground">
        <input
          type="checkbox"
          className="mt-1"
          {...register("consent_talent_pool")}
        />
        <span>Talent pool / кадровый резерв (опционально)</span>
      </label>
      <label className="flex items-start gap-3 text-sm text-foreground">
        <input
          type="checkbox"
          className="mt-1"
          {...register("consent_cross_border")}
        />
        <span>Трансграничная передача ПД (опционально)</span>
      </label>
      {crossBorder && (
        <InputField
          {...register("consent_cross_border_countries")}
          type="text"
          placeholder="KZ, RU"
          label="Страны передачи"
          error={errors.consent_cross_border_countries?.message}
        />
      )}
    </fieldset>
  );
}
