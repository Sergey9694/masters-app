"use client";

import * as React from "react";
import { IMaskInput } from "react-imask";
import { cn } from "@/shared/lib/cn";

export interface PhoneInputProps {
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  placeholder?: string;
  autoComplete?: string;
  hasError?: boolean;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value, onChange, onBlur, disabled, hasError, placeholder = "+7 (000) 000-00-00", ...props }, ref) => {
    return (
      <IMaskInput
        mask="+{7} (000) 000-00-00"
        definitions={{
          '#': /[1-9]/,
        }}
        value={value || ""}
        unmask={false} // Мы хотим передавать форматированное значение в react-hook-form, а нормализовать на сервере/перед отправкой
        onAccept={(value: string) => {
          onChange?.(value);
        }}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "h-11 w-full rounded-xl border bg-background px-3 text-sm transition-all",
          "focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10",
          hasError ? "border-destructive" : "border-border",
          "placeholder:text-muted-foreground/50",
          className
        )}
        inputRef={(el) => {
          if (typeof ref === "function") {
            ref(el);
          } else if (ref) {
            ref.current = el;
          }
        }}
        {...props}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
