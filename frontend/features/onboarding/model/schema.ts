import { z } from "zod";

export const onboardingFormSchema = z.object({
    firstName: z.string().min(1, "Обязательное поле"),
    lastName: z.string().min(1, "Обязательное поле"),
    companyName: z.string().min(1, "Обязательное поле"),
    role: z.string().min(1, "Обязательное поле"),
});

export type OnboardingFormValues = z.infer<typeof onboardingFormSchema>;