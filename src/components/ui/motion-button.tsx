"use client"

import * as React from "react"
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react"

export function MotionButton({
  className,
  ...props
}: React.ComponentProps<"button">) {
  const reduce = useReducedMotion()

  return (
    <motion.button
      whileTap={reduce ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={className}
      {...(props as HTMLMotionProps<"button">)}
    />
  )
}
