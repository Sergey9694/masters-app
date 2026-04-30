import * as React from "react"

import { cn } from "@/shared/lib/cn"

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[120px] sm:min-h-[140px] w-full rounded-[var(--ui-radius-premium)] border border-white/10 bg-white/5 backdrop-blur-md px-4 sm:px-6 py-4 text-[var(--ui-input-text)] text-[14px] sm:text-[16px] font-semibold ring-offset-background placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-sans leading-relaxed shadow-inner-glass",
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
