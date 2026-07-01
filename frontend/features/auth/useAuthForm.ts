import { useAuth } from "./useAuth"
import { UseFormSetError } from "react-hook-form"
import { RegisterFormValuesType } from "./model/FormSchema"

type useAuthFormParams = {
    view: 'login' | 'register';
    setError: UseFormSetError<RegisterFormValuesType>;
    onSuccess?: () => void
}

export const useAuthForm = ({view, setError, onSuccess}: useAuthFormParams) => {
    const { signIn, signUp, isLoading } = useAuth()

    const onSubmit = async(data: RegisterFormValuesType) => {
        const {error} = 
        view === 'register'
        ? await signUp(data.email, data.password)
        : await signIn(data.email, data.password)

        if (error) {
            setError("email", {message: error.message})
            return
        }

        onSuccess?.();

    }

    return { onSubmit, isLoading }
}