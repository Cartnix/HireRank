import { InputField } from "@/shared/ui/FieldInput";

interface EmailPasswordFormProps {
  isRegister: boolean;
  register: any;
  errors: any;
  emailHint: string | null;
  onEmailBlur: () => Promise<void>;
}

export function EmailPasswordForm({
  isRegister,
  register,
  errors,
  emailHint,
  onEmailBlur,
}: EmailPasswordFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <InputField
        {...register("email", {
          onBlur: () => {
            void onEmailBlur();
          },
        })}
        type="email"
        placeholder="name@company.kz"
        label="Email"
        error={errors.email?.message}
      />
      {emailHint && (
        <p className="text-xs text-foreground-secondary -mt-2">{emailHint}</p>
      )}
      <InputField
        {...register("password")}
        type="password"
        placeholder="••••••••"
        label="Password"
        error={errors.password?.message}
      />
      {isRegister && (
        <>
          <InputField
            {...register("repeatPassword")}
            type="password"
            placeholder="••••••••"
            label="Repeat password"
            error={errors.repeatPassword?.message}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-foreground-secondary">Роль</label>
            <select
              {...register("role")}
              className="rounded-2xl border border-border bg-background-elevated px-4 py-3 text-foreground"
            >
              <option value="candidate">Кандидат</option>
              <option value="hr">HR</option>
              <option value="manager">Менеджер</option>
              <option value="recruiter">Рекрутер</option>
            </select>
            {errors.role?.message && (
              <p className="text-sm text-danger">{errors.role.message}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
