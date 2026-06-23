"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
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

export const RegisterForm = () => {
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
        <div className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden bg-background">
            {/* Декоративные пятна: теперь используем классы bg-accent и bg-primary */}
            <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full blur-3xl opacity-40 bg-accent" />
            <div className="absolute bottom-0 right-0 w-md h-112 rounded-full blur-3xl opacity-30 bg-primary" />

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="glass relative z-10 w-full max-w-md rounded-3xl p-8 flex flex-col gap-5 shadow-lg"
            >
                <div className="mb-1">
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                        Регистрация
                    </h2>
                    <p className="text-sm text-foreground-muted mt-1">
                        Создайте аккаунт за пару секунд
                    </p>
                </div>

                <Field type="email" placeholder="Email" error={errors.email?.message} register={register("email")} />
                <Field type="password" placeholder="Пароль" error={errors.password?.message} register={register("password")} />
                <Field type="password" placeholder="Повторите пароль" error={errors.repeatPassword?.message} register={register("repeatPassword")} />

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-2 py-3 rounded-2xl font-medium text-white transition-all duration-200 
                               hover:scale-[1.015] active:scale-[0.985] disabled:opacity-50 bg-accent"
                >
                    {isSubmitting ? "Отправка..." : "Зарегистрироваться"}
                </button>

                <p className="text-center text-sm text-foreground-muted">
                    Уже есть аккаунт?{" "}
                    <a href="/login" className="font-medium hover:underline text-accent">
                        Войти
                    </a>
                </p>
            </form>
        </div>
    );
};

const Field = ({ type, placeholder, error, register }: { type: string, placeholder: string, error?: string, register: any }) => (
    <div className="flex flex-col gap-1.5">
        <input
            type={type}
            placeholder={placeholder}
            className="px-4 py-3 rounded-2xl border bg-transparent border-border text-foreground 
                       placeholder:text-foreground-muted outline-none transition-all duration-200
                       focus:ring-2 focus:ring-accent"
            {...register}
        />
        {error && <p className="text-xs text-red-500 pl-1">{error}</p>}
    </div>
);

export default RegisterForm;