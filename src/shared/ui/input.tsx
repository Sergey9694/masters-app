import * as React from "react"

import { cn } from "@/shared/lib/cn"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-2xl border border-white/10 bg-white/5 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all sm:text-base h-12 sm:h-14 shadow-inner-glass whitespace-nowrap",
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
