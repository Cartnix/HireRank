"use server";

import { createClient } from "@/shared/utils/supabase/server";
import { OnboardingFormValues } from "./model/schema";

export async function OnboardingComplete(data: OnboardingFormValues) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return { error: "Пользователь не авторизован" };
  }

  const { error } = await supabase.from("Profiles").insert({
    id: user.id,
    first_name: data.firstName,
    last_name: data.lastName,
    company_name: data.companyName,
    role: data.role,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}