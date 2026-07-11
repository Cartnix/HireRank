"use client";

import React, { useId, useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  LeftIcon?: React.ReactNode;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      type,
      placeholder,
      label,
      error,
      onFocus,
      onBlur,
      LeftIcon,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const id = useId();
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    const hasValue =
      (props.value !== undefined && props.value !== "") ||
      (props.defaultValue !== undefined && props.defaultValue !== "");
    const floated = focused || hasValue;

    return (
      <div className="w-full">
        <motion.div
          animate={error ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative rounded-xl"
        >
          <div
            className={cn(
              "relative flex h-11 items-center rounded-xl border bg-background-elevated transition-colors duration-200",
              error
                ? "border-danger"
                : focused
                  ? "border-brand-primary"
                  : "border-border hover:border-border-subtle",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            {LeftIcon && (
              <div className="flex h-4 w-4 shrink-0 items-center justify-center text-foreground-tertiary pl-3">
                {LeftIcon}
              </div>
            )}

            <div className="relative flex-1 h-full">
              <motion.label
                htmlFor={id}
                initial={false}
                animate={
                  floated
                    ? { top: "4px", fontSize: "10px" }
                    : { top: "50%", fontSize: "14px" }
                }
                transition={{ duration: 0.15, ease: "easeOut" }}
                className={cn(
                  "absolute pointer-events-none font-medium origin-left -translate-y-1/2",
                  LeftIcon ? "left-2.5" : "left-3.5",
                  error
                    ? "text-danger"
                    : focused
                      ? "text-brand-primary"
                      : "text-foreground-secondary",
                )}
              >
                {label}
              </motion.label>

              <input
                {...props}
                ref={ref}
                id={id}
                type={inputType}
                disabled={disabled}
                placeholder={floated ? placeholder : ""}
                onFocus={(e) => {
                  setFocused(true);
                  onFocus?.(e);
                }}
                onBlur={(e) => {
                  setFocused(false);
                  onBlur?.(e);
                }}
                className={cn(
                  "w-full h-full bg-transparent outline-none text-[14px] disabled:cursor-not-allowed",
                  floated ? "pt-3.5 pb-0.5" : "pt-0 pb-0",
                  LeftIcon ? "pl-2.5" : "pl-3.5",
                  "pr-3.5",
                  isPassword && "pr-9",
                  className,
                )}
              />
            </div>

            {isPassword && (
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="flex h-4 w-4 shrink-0 items-center justify-center text-foreground-tertiary hover:text-foreground-secondary transition-colors pr-3"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-1.5 px-1 mt-1.5 overflow-hidden"
            >
              <AlertCircle className="w-3.5 h-3.5 text-danger shrink-0" />
              <span className="text-xs text-danger">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

InputField.displayName = "InputField";