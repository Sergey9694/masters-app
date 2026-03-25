import * as React from "react"

import { cn } from "@/shared/lib/cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[120px] w-full rounded-[24px] border border-white/10 dark:border-white/20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl px-4 py-3 text-base shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
