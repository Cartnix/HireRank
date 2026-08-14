"use server";

import { onboardingFormSchema, OnboardingFormValues } from "./model/schema";
// import { db } from "@/shared/lib/db"; // ваш инстанс prisma / дб
// import { auth } from "@/shared/lib/auth"; // ваша сессия / авторизация

export async function OnboardingComplete(data: OnboardingFormValues) {
  try {
    // 1. Валидация данных на бэкенде (никогда не доверяем клиенту)
    const validationResult = onboardingFormSchema.safeParse(data);
    
    if (!validationResult.success) {
      return { error: "Неверные данные формы" };
    }

    const { firstName, lastName, role } = validationResult.success ? validationResult.data : data;

    // 2. Получение текущего пользователя (пример через вашу систему сессий)
    // const session = await auth();
    // if (!session?.user?.id) {
    //   return { error: "Неавторизованный запрос" };
    // }

    // 3. Сохранение в базу данных
    // await db.user.update({
    //   where: { id: session.user.id },
    //   data: {
    //     firstName,
    //     lastName,
    //     role,
    //     isOnboarded: true,
    //   },
    // });

    console.log("Onboarding data saved:", { firstName, lastName, role });

    return { success: true };
  } catch (error) {
    console.error("Onboarding error:", error);
    return { error: "Что-то пошло не так. Попробуйте позже." };
  }
}