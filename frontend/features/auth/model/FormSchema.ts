import { z } from "zod";

const emailSchema = z.string().email("Неверный email");

const passwordSchema = z
  .string()
  .min(8, "Пароль должен состоять минимум из 8 символов");

const REQUIRED_CONSENT_MSG =
  "Согласие на сбор и обработку персональных данных обязательно";

/** RK §1.4 — separated consents, empty by default (no pre-ticks). */
export const ConsentSchema = z
  .object({
    account_processing: z.literal(true, {
      errorMap: () => ({ message: REQUIRED_CONSENT_MSG }),
    }),
    talent_pool: z.boolean(),
    cross_border: z.boolean(),
    cross_border_countries: z.array(z.string()).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.cross_border && data.cross_border_countries.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Укажите страны для трансграничной передачи",
        path: ["cross_border_countries"],
      });
    }
  });

const registerConsentFields = {
  // boolean (not z.literal(true)) so RHF defaultValues may start unchecked
  consent_account_processing: z.boolean().refine((v) => v === true, {
    message: REQUIRED_CONSENT_MSG,
  }),
  consent_talent_pool: z.boolean(),
  consent_cross_border: z.boolean(),
  consent_cross_border_countries: z.string().optional(),
};

/** Login: no checkboxes — acceptance is implicit via CTA + policy links. */
export const LoginFormValues = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const RegisterFormValues = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    repeatPassword: passwordSchema,
    role: z.enum(["candidate", "hr", "manager", "recruiter"]),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    ...registerConsentFields,
  })
  .refine((data) => data.password === data.repeatPassword, {
    message: "Пароли не совпадают",
    path: ["repeatPassword"],
  })
  .superRefine((data, ctx) => {
    if (data.consent_cross_border) {
      const countries = parseCountries(data.consent_cross_border_countries);
      if (countries.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Укажите страны (например: KZ, RU)",
          path: ["consent_cross_border_countries"],
        });
      }
    }
  });

export type LoginFormValuesType = z.infer<typeof LoginFormValues>;
export type RegisterFormValuesType = z.infer<typeof RegisterFormValues>;

export type ConsentPayload = z.infer<typeof ConsentSchema>;

export type ConsentFlags = {
  consent_account_processing: boolean;
  consent_talent_pool: boolean;
  consent_cross_border: boolean;
  consent_cross_border_countries?: string;
};

export function parseCountries(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\s]+/)
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
}

/** Gate for register UI + submit — request must not fire without explicit tick. */
export function hasRequiredConsent(flags: ConsentFlags): boolean {
  return flags.consent_account_processing === true;
}

/**
 * Implicit account-processing grant for returning login / OAuth on login view
 * (clicking «Войти» / OAuth = acceptance of linked Terms & PD policy).
 */
export function implicitLoginConsentPayload(): ConsentPayload {
  return {
    account_processing: true,
    talent_pool: false,
    cross_border: false,
    cross_border_countries: [],
  };
}

export function toConsentPayload(data: ConsentFlags): ConsentPayload {
  if (!hasRequiredConsent(data)) {
    throw new Error(REQUIRED_CONSENT_MSG);
  }
  const crossBorder = data.consent_cross_border === true;
  const countries = crossBorder
    ? parseCountries(data.consent_cross_border_countries)
    : [];
  return {
    account_processing: true,
    talent_pool: data.consent_talent_pool === true,
    cross_border: crossBorder,
    cross_border_countries: countries,
  };
}

export { REQUIRED_CONSENT_MSG };
