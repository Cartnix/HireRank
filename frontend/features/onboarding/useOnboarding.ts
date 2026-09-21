import { updateMe, type UpdateMePayload } from "@/shared/api/auth";
import { useState } from "react";

export const useOnboarding = () => {
  const [isLoading, setLoading] = useState(false);

  const onBoardingSubmit = async (payload: UpdateMePayload) => {
    setLoading(true);
    try {
      const data = await updateMe(payload);
      return { data, error: null } as const;
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Onboarding failed"),
      } as const;
    } finally {
      setLoading(false);
    }
  };

  return { onBoardingSubmit, isLoading };
};