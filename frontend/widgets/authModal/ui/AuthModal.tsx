"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputField } from "@/shared/FieldInput";
import { MainButton } from "@/shared/ui/buttons/MainButton";
import {
    LoginFormValues,
    RegisterFormValues,
    RegisterFormValuesType,
} from "@/features/auth/model/FormSchema";
import { useAuthForm } from "@/features/auth/useAuthForm";

export const AuthModal = () => {
    const [view, setView] = useState<"login" | "register">("login");
    const isRegister = view === "register";

    const {
        register,
        handleSubmit,
        setError,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormValuesType>({
        resolver: zodResolver(isRegister ? RegisterFormValues : LoginFormValues),
        mode: "onChange",
    });

    const { onSubmit, isLoading } = useAuthForm({
        view,
        setError,
        onSuccess: () => {
        },
    });

    const isPending = isSubmitting || isLoading;

    const toggleView = () => {
        setView(isRegister ? "login" : "register");
        reset();
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-3xl p-8 md:p-10 flex flex-col gap-6 
                       bg-background-elevated border border-border-subtle/50 shadow-2xl transition-all duration-300"
        >
            <div className="mb-2 text-center">
                <h2 className="text-foreground">
                    {isRegister ? "Регистрация" : "Вход в систему"}
                </h2>
                <p className="text-foreground-secondary mt-2">
                    {isRegister
                        ? "Создайте аккаунт в системе ToU за пару секунд"
                        : "Добро пожаловать обратно, используйте свои данные"}
                </p>
            </div>

            <div className="flex flex-col gap-4">
                <InputField
                    {...register("email")}
                    placeholder="name@university.kz"
                    label="Email"
                    error={errors.email?.message}
                />
                <InputField
                    {...register("password")}
                    placeholder="••••••••"
                    label="Password"
                    error={errors.password?.message}
                />
                {isRegister && (
                    <InputField
                        {...register("repeatPassword")}
                        placeholder="••••••••"
                        label="Repeat password"
                        error={errors.repeatPassword?.message}
                    />
                )}
            </div>

            <MainButton
                type="submit"
                disabled={isPending}
                title={isPending ? "Обработка..." : isRegister ? "Создать аккаунт" : "Войти"}
                className="mt-4 py-3.5 rounded-2xl font-semibold text-base"
            />

            <button
                type="button"
                onClick={toggleView}
                className="text-center text-sm text-foreground-secondary hover:text-brand-primary transition-colors mt-1 underline underline-offset-4"
            >
                {isRegister ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}
            </button>
        </form>
    );
};