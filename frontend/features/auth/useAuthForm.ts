import { UseFormSetError } from "react-hook-form";
import { useAuthStore } from "./model/auth-store"
import { RegisterFormValues } from "./model/FormSchema";

interface AuthFormProps {
    view: 'register' | 'login',
    setError: UseFormSetError<RegisterFormValues>,
    onSuccess?: () => void,
}

export const useAuthForm = ({ view, setError, onSuccess }: AuthFormProps) => {
    const login = useAuthStore((s) => s.login);
    const register = useAuthStore((s) => s.register);
    const isLoading = useAuthStore((s) => s.isLoading);

    const onSubmit = async (data: RegisterFormValues) => {
        try {
            if (view === "register") {
                await register({
                    email: data.email,
                    password: data.password,
                    role: data.role,
                    first_name: data.first_name,
                    last_name: data.last_name,
                });
            } else {
                await login(data.email, data.password);
            }

            onSuccess?.();
        } catch (e) {
            setError("email", {
                message: e instanceof Error ? e.message : "Ошибка авторизации",
            });
        }
    };

    return { onSubmit, isLoading }
}