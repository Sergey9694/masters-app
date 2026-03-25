import * as React from "react"

import { cn } from "@/shared/lib/cn"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium ring-offset-background placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all sm:text-lg leading-relaxed shadow-inner-glass",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
