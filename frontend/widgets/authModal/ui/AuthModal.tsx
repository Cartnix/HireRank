import { InputField } from "@/shared/FieldInput"
import { SubmitHandler, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod";

const FormValues = z.object({
    email: z.string().email('Неверный email').refine((v) => v.endsWith('@tou.edu.kz'), {
        message: 'Email должен заканчиваться на @tou.edu.kz',
    }),
    password: z.string().min(8, 'Пароль должен состоять минимум из 8 символов'),
    repeatPassword: z.string()
}).refine((data) => data.password === data.repeatPassword, {
    message: "Пароли не совпадают",
    path: ["repeatPassword"],
});

type FormValuesType = z.infer<typeof FormValues>;

export const AuthModal = () => {

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormValuesType>({
        resolver: zodResolver(FormValues)
    });

    const onSubmit: SubmitHandler<FormValuesType> = (data) => {
        console.log(data);
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-lg rounded-3xl p-8 md:p-10 flex flex-col gap-6
                           bg-background-elevated border border-border-subtle/50 shadow-2xl transition-all duration-300 ease-out animate-modal-in"
        >
            <button
                type="button"
                onClick={(e) => {
                    close();
                }}
                className="absolute top-6 right-6 p-1.5 rounded-full text-foreground-muted hover:text-foreground hover:bg-foreground/5 transition-colors"
            >
                X
            </button>

            {/* Заголовок */}
            <div className="mb-2">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                    Регистрация
                </h2>
                <p className="text-base text-foreground-secondary mt-2">
                    Создайте аккаунт в единой системе ToU за пару секунд
                </p>
            </div>

            <div className="flex flex-col gap-4">
                <InputField  type="text" placeholder="Enter an email" label="Username"/>
                <InputField  type="text" placeholder="Enter an email" label="Password"/>
                <InputField  type="text" placeholder="Enter an email" label="Repeat password"/>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 py-3.5 rounded-2xl font-semibold text-base text-brand-primary-foreground bg-brand-primary
                               hover:bg-brand-primary-hover transition-all duration-200
                               hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 shadow-lg shadow-brand-primary/20 relative"
            >
                {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                        Отправка...
                    </span>
                ) : "Создать аккаунт"}
            </button>

            <p className="text-center text-sm text-foreground-secondary mt-1">
                Уже есть аккаунт?{" "}
                <a href="/login" className="font-semibold hover:underline text-brand-primary hover:text-brand-primary-hover">
                    Войти
                </a>
            </p>
        </form>
    )
}