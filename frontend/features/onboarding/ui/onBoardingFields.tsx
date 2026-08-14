import { InputField } from "@/shared/FieldInput";
import { useFormContext } from "react-hook-form";
import { OnboardingFormValues } from "../model/schema";

export const OnBoardingInputs = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<OnboardingFormValues>();

  return (
    <div className="flex flex-col gap-4">
      <InputField
        {...register("firstName")}
        placeholder="Иван"
        label="Имя"
        error={errors.firstName?.message}
      />
      <InputField
        {...register("lastName")}
        placeholder="Иванов"
        label="Фамилия"
        error={errors.lastName?.message}
      />
    </div>
  );
};
