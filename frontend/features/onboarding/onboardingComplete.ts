"use server";

import { OnboardingFormValues } from "./model/schema";

export async function OnboardingComplete(data: OnboardingFormValues) {
  // TODO: Implement your own onboarding logic here
  // Receive data from client: firstName, lastName, companyName, role
  console.log("Onboarding data:", data);

  return { success: true };
}