import * as React from "react"
import { cn } from "@/shared/lib/cn"

interface SectionHeaderProps {
  title: string
  count?: number
  countLabel?: string
  accentColor?: "emerald" | "indigo" | "blue" | "slate"
  className?: string
}

export function SectionHeader({
  title,
  count,
  countLabel,
  accentColor = "slate",
  className
}: SectionHeaderProps) {
  const accentClasses = {
    emerald: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
    indigo: "bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]",
    blue: "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]",
    slate: "bg-slate-500/50"
  }

  return (
    <div className={cn("flex items-center gap-3 px-1", className)}>
      <h2 className="text-[16px] font-black uppercase tracking-[0.2em] text-white">
        {title}
      </h2>

      {accentColor && !count && !countLabel && (
        <span className={cn("w-1.5 h-1.5 rounded-full", accentClasses[accentColor])} />
      )}

      {(count !== undefined || countLabel) && (
        <>
          <div className="h-px flex-1 bg-white/5" />
          <span className="text-[11px] font-black text-slate-500 bg-white/5 py-0.5 px-3 rounded-full whitespace-nowrap">
            {countLabel || count}
          </span>
        </>
      )}
    </div>
  )
}
