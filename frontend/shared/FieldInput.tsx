import { useId, useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string,
    error?: string
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
    ({ type, placeholder, label, error, onFocus, onBlur, className, ...props }, ref) => {
        const id = useId();
        const [focused, setFocused] = useState(false);
        const [showPassword, setShowPassword] = useState(false);

        const isPassword = type === "password"
        const inputType = isPassword && showPassword ? "text" : type;

        const hasValue = props.value !== undefined && props.value !== "";
        const floated = focused || hasValue;

        return (
            <div className="w-full">
                <motion.div
                    animate={error ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="relative rounded-2xl"
                >
                    <div className={cn(
                        "relative rounded-2xl border bg-background-elevated transition-colors duration-200",
                        error ? "border-danger" : focused ? "border-brand-primary" : "border-border hover:border-border-subtle"
                    )}>
                        <motion.label
                            htmlFor={id}
                            animate={floated ? { top: "8px", fontSize: "11px" } : { top: "50%", fontSize: "15px" }}
                            className={cn("absolute left-4 pointer-events-none font-medium origin-left", 
                                error ? "text-danger" : focused ? "text-brand-primary" : "text-foreground-secondary"
                            )}
                        >
                            {label}
                        </motion.label>

                        <input
                            {...props}
                            ref={ref}
                            id={id}
                            type={inputType}
                            placeholder={floated ? placeholder : ""}
                            onFocus={(e) => {
                                setFocused(true);
                                onFocus?.(e);
                            }}
                            onBlur={(e) => {
                                setFocused(false);
                                onBlur?.(e);
                            }}
                            className={cn("w-full bg-transparent outline-none pt-6 pb-2 pl-4 text-[15px]", className)}
                        />

                        {isPassword && (
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground-tertiary"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        )}
                    </div>
                </motion.div>

                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-1.5 px-1 mt-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-danger" />
                            <span className="text-xs text-danger">{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
});