"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex w-fit shrink-0 items-center gap-1 overflow-hidden rounded-lg bg-linear-to-r px-2 py-0.5 text-[9px] font-medium tracking-wide whitespace-nowrap shadow-[0_0_10px_-3px_rgba(16,185,129,0.15)] transition-[color,box-shadow] focus-visible:ring-[3px] dark:shadow-[0_0_10px_-3px_rgba(16,185,129,0.2)] [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "from-emerald-400/5 via-emerald-500/5 to-teal-500/5 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-400/20",
        secondary:
          "bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text font-semibold text-transparent ring-1 ring-orange-500/20 dark:ring-orange-400/20",
        destructive:
          "from-purple-400/5 via-purple-500/5 to-purple-500/5 text-purple-600 ring-1 ring-purple-500/20 dark:text-purple-400 dark:ring-purple-400/20",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground from-emerald-400/5 via-emerald-500/5 to-teal-500/5 ring-1 ring-emerald-500/20 dark:ring-emerald-400/20",
        ghost:
          "text-foreground hover:bg-muted/20 border-transparent bg-transparent",
        purple:
          "border-transparent bg-purple-500 text-white hover:bg-purple-600",
        orange:
          "border-transparent bg-orange-500 text-white hover:bg-orange-600",
      },
      size: {
        sm: "px-2 py-0.25 text-xs",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean
}

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: BadgeProps) {
  const Comp = asChild ? React.Fragment : "span"
  return (
    <Comp
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
