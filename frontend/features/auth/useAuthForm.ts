import { useAuth } from "./useAuth";
import { UseFormSetError } from "react-hook-form";
import {
  REQUIRED_CONSENT_MSG,
  RegisterFormValuesType,
  hasRequiredConsent,
  toConsentPayload,
} from "./model/FormSchema";

type useAuthFormParams = {
  view: "login" | "register";
  setError: UseFormSetError<RegisterFormValuesType>;
  onSuccess?: () => void;
};

export const useAuthForm = ({ view, setError, onSuccess }: useAuthFormParams) => {
  const { signIn, signUp, isLoading } = useAuth();

  const onSubmit = async (data: RegisterFormValuesType) => {
    if (view === "register") {
      if (
        !hasRequiredConsent({
          consent_account_processing: data.consent_account_processing,
          consent_talent_pool: Boolean(data.consent_talent_pool),
          consent_cross_border: Boolean(data.consent_cross_border),
        })
      ) {
        setError("consent_account_processing", {
          message: REQUIRED_CONSENT_MSG,
        });
        return;
      }

      const result = await signUp({
        email: data.email,
        password: data.password,
        role: data.role,
        first_name: data.first_name,
        last_name: data.last_name,
        consent: toConsentPayload(data),
      });

      if (result.error) {
        setError("email", { message: result.error.message });
        return;
      }
      onSuccess?.();
      return;
    }

    // Login: no checkbox gate — Terms/Privacy accepted by clicking «Войти».
    const result = await signIn(data.email, data.password);
    if (result.error) {
      setError("email", { message: result.error.message });
      return;
    }
    onSuccess?.();
  };

  return { onSubmit, isLoading };
};
