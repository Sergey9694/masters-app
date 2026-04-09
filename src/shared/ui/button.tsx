"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[var(--ui-radius-premium)] border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 font-sans cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:brightness-110",
        destructive: "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        outline: "border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        premium: "bg-gradient-to-tr from-cyan-600 via-cyan-400 to-indigo-600 text-white font-black uppercase tracking-[0.05em] sm:tracking-[0.12em] shadow-xl shadow-cyan-500/30 active:scale-95 hover:shadow-cyan-400/50 transition-all border-none relative overflow-hidden rounded-full ring-2 ring-white/10",
        emerald: "bg-gradient-to-tr from-emerald-600 via-emerald-400 to-teal-600 text-white font-black uppercase tracking-[0.05em] sm:tracking-[0.1em] shadow-xl shadow-emerald-500/30 active:scale-95 transition-all border-none rounded-full ring-2 ring-white/10",
      },
      size: {
        default: "h-[var(--ui-input-h-mobile)] sm:h-[var(--ui-input-h-desktop)] px-8 py-2 text-[14px] sm:text-[16px]",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 sm:h-14 rounded-2xl px-10 text-[14px] sm:text-[16px]",
        xl: "h-14 sm:h-18 rounded-full px-6 sm:px-16 text-[12px] sm:text-[16px]", 
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
