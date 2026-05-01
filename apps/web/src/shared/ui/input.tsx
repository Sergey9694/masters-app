import * as React from "react"

import { cn } from "@/shared/lib/cn"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-[var(--ui-radius-premium)] border border-white/10 bg-white/5 backdrop-blur-md px-4 sm:px-6 py-2 text-[var(--ui-input-text)] text-[14px] sm:text-[16px] font-semibold ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all h-[48px] sm:h-[56px] shadow-inner-glass whitespace-nowrap font-sans",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
