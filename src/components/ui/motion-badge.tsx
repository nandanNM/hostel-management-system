"use client"

import * as React from "react"
import { motion, type HTMLMotionProps } from "motion/react"

export function MotionBadge({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={className}
      {...(props as HTMLMotionProps<"span">)}
    />
  )
}
