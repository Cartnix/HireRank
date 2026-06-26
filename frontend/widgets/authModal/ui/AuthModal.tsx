import { InputField } from "@/shared/FieldInput"
import { SubmitHandler, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod";
import { MainButton } from "@/shared/buttons/MainButton";
import { FormValues } from "../model/FormSchema";

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

    const buttonText = isSubmitting ? "Отправка..." : "Создать аккаунт";


    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-lg rounded-3xl p-8 md:p-10 flex flex-col gap-6
                           bg-background-elevated border border-border-subtle/50 shadow-2xl transition-all duration-300 ease-out animate-modal-in"
        >

            <div className="mb-2 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                    Регистрация
                </h2>
                <p className="text-base text-foreground-secondary mt-2">
                    Создайте аккаунт в единой системе ToU за пару секунд
                </p>
            </div>

            <div className="flex flex-col gap-4">
                <InputField {...register("email")} type="text" placeholder="Enter an email" label="Username" />
                <InputField {...register("password")} type="password" placeholder="Enter a password" label="Password" />
                <InputField {...register("repeatPassword")} type="password" placeholder="Repeat the password" label="Repeat password" />
            </div>

            <MainButton
                type="submit"
                disabled={isSubmitting}
                title={buttonText}
                className="mt-4 py-3.5 rounded-2xl font-semibold text-base text-brand-primary-foreground bg-brand-primary 
               hover:bg-brand-primary-hover transition-all duration-200 
               hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 shadow-lg shadow-brand-primary/20 relative"
            />

            <p className="text-center text-sm text-foreground-secondary mt-1">
                Уже есть аккаунт?{" "}
                <a href="/login" className="font-semibold hover:underline text-brand-primary hover:text-brand-primary-hover">
                    Войти
                </a>
            </p>
        </form>
    )
}