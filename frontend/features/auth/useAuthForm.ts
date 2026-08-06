import { useAuth } from "./useAuth";
import { UseFormSetError } from "react-hook-form";
import { RegisterFormValuesType } from "./model/FormSchema";

type useAuthFormParams = {
  view: "login" | "register";
  setError: UseFormSetError<RegisterFormValuesType>;
  onSuccess?: () => void;
};

export const useAuthForm = ({ view, setError, onSuccess }: useAuthFormParams) => {
  const { signIn, signUp, isLoading } = useAuth();

  const onSubmit = async (data: RegisterFormValuesType) => {
    const result =
      view === "register"
        ? await signUp({
            email: data.email,
            password: data.password,
            role: data.role,
            first_name: data.first_name,
            last_name: data.last_name,
          })
        : await signIn(data.email, data.password);

    if (result.error) {
      setError("email", { message: result.error.message });
      return;
    }

    onSuccess?.();
  };

  return { onSubmit, isLoading };
};
