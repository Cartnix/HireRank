"use client";

import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputField } from "@/shared/FieldInput";
import { MainButton } from "@/shared/buttons/MainButton";
import { FormValues } from "../model/FormSchema";

type FormValuesType = z.infer<typeof FormValues>;

export const AuthModal = () => {
    const [view, setView] = useState<'login' | 'register'>('login');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormValuesType>({
        resolver: zodResolver(FormValues),
        mode: "onChange" 
    });

    const onSubmit: SubmitHandler<FormValuesType> = (data) => {
        console.log("Отправка данных:", data);
    };

    const isRegister = view === 'register';

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
                disabled={isSubmitting}
                title={isSubmitting ? "Обработка..." : (isRegister ? "Создать аккаунт" : "Войти")}
                className="mt-4 py-3.5 rounded-2xl font-semibold text-base"
            />

            <button 
                type="button" 
                onClick={() => setView(isRegister ? 'login' : 'register')}
                className="text-center text-sm text-foreground-secondary hover:text-brand-primary transition-colors mt-1 underline underline-offset-4"
            >
                {isRegister ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}
            </button>
        </form>
    );
};