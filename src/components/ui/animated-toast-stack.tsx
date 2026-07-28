"use client"

import { memo, useEffect, useState, type ReactNode } from "react"
import {
  Bell,
  Check,
  CircleNotch,
  Info,
  WarningCircle,
  X,
  type Icon,
} from "@phosphor-icons/react"
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "motion/react"
import { createPortal } from "react-dom"

import { EASE_OUT } from "@/lib/ease"
import { cn } from "@/lib/utils"

export type ToastStatus = "neutral" | "info" | "loading" | "success" | "error"
export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"

export type AnimatedToastAction = {
  label: ReactNode
  onClick: (toast: AnimatedToast) => void
}

export type AnimatedToast = {
  id: string
  title: ReactNode
  description?: ReactNode
  status?: ToastStatus
  icon?: ReactNode
  action?: AnimatedToastAction
  duration?: number
  dismissible?: boolean
  createdAt?: number
}

export interface AnimatedToastStackProps {
  toasts: AnimatedToast[]
  onDismiss?: (id: string) => void
  position?: ToastPosition
  placement?: "static" | "fixed" | "absolute"
  portal?: boolean
  portalRoot?: Element | null
  maxVisible?: number
  className?: string
}

const STACK_SPRING: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.75,
}

const STATUS_ICON: Record<ToastStatus, Icon> = {
  neutral: Bell,
  info: Info,
  loading: CircleNotch,
  success: Check,
  error: WarningCircle,
}

const STATUS_CLASS: Record<ToastStatus, string> = {
  neutral: "text-muted-foreground bg-primary/[0.05]",
  info: "text-primary bg-primary/10",
  loading: "text-primary bg-primary/10",
  success: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
  error: "text-destructive bg-destructive/10",
}

const POSITION_CLASS: Record<ToastPosition, string> = {
  "top-left": "left-4 top-4",
  "top-center": "left-1/2 top-4 -translate-x-1/2",
  "top-right": "right-4 top-4",
  "bottom-left": "bottom-6 left-4",
  "bottom-center": "bottom-6 left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-6 right-4",
}

export function AnimatedToastStack({
  toasts,
  onDismiss,
  position = "bottom-right",
  placement = "fixed",
  portal,
  portalRoot,
  maxVisible = 4,
  className,
}: AnimatedToastStackProps) {
  const [portalTarget, setPortalTarget] = useState<Element | null>(null)
  const visibleToasts = toasts.slice(-maxVisible)
  const isBottom = position.startsWith("bottom")
  const shouldPortal = portal ?? placement === "fixed"

  useEffect(() => {
    setPortalTarget(shouldPortal ? (portalRoot ?? document.body) : null)
  }, [portalRoot, shouldPortal])

  const stack = (
    <ol
      aria-live="polite"
      aria-atomic="false"
      className={cn(
        "pointer-events-none flex w-[calc(100vw-2rem)] max-w-sm gap-2",
        isBottom ? "flex-col-reverse" : "flex-col",
        placement === "fixed" && "fixed z-[90]",
        placement === "absolute" && "absolute z-20",
        placement !== "static" && POSITION_CLASS[position],
        className
      )}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {visibleToasts.map((toast, index) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            index={index}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>
    </ol>
  )

  if (shouldPortal && !portalTarget) {
    return null
  }

  if (shouldPortal && portalTarget) {
    return createPortal(stack, portalTarget)
  }

  return stack
}

const ToastItem = memo(function ToastItem({
  toast,
  index,
  onDismiss,
}: {
  toast: AnimatedToast
  index: number
  onDismiss?: (id: string) => void
}) {
  const reduce = useReducedMotion()
  const status = toast.status ?? "neutral"
  const StatusIcon = STATUS_ICON[status]
  const iconNode = toast.icon ?? <StatusIcon className="h-3.5 w-3.5" />
  const canDismiss = toast.dismissible !== false && Boolean(onDismiss)

  return (
    <motion.li
      layout
      initial={
        reduce
          ? { opacity: 0 }
          : { opacity: 0, y: 22, scale: 0.96, filter: "blur(10px)" }
      }
      animate={
        reduce
          ? { opacity: 1 }
          : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
      }
      exit={
        reduce
          ? { opacity: 0 }
          : {
              opacity: 0,
              x: 32,
              scale: 0.96,
              filter: "blur(8px)",
              transition: { duration: 0.18, ease: EASE_OUT },
            }
      }
      transition={STACK_SPRING}
      drag={canDismiss && !reduce ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.18}
      onDragEnd={(_, info) => {
        if (!canDismiss || !onDismiss) return
        if (Math.abs(info.offset.x) > 72 || Math.abs(info.velocity.x) > 520) {
          onDismiss(toast.id)
        }
      }}
      className="pointer-events-auto relative will-change-transform"
      style={{ zIndex: 20 - index }}
    >
      <div className="border-border bg-card/95 relative overflow-hidden rounded-2xl border p-3 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
              STATUS_CLASS[status]
            )}
          >
            {status === "loading" ? (
              <span className="inline-flex animate-spin">{iconNode}</span>
            ) : (
              iconNode
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm leading-5 font-medium">
              {toast.title}
            </p>
            {toast.description ? (
              <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-4">
                {toast.description}
              </p>
            ) : null}
            {toast.action ? (
              <button
                type="button"
                onClick={() => toast.action?.onClick(toast)}
                className="bg-primary/[0.06] text-foreground hover:bg-primary/[0.1] mt-2 inline-flex h-7 items-center rounded-full px-3 text-xs font-medium transition-colors"
              >
                {toast.action.label}
              </button>
            ) : null}
          </div>

          {canDismiss ? (
            <button
              type="button"
              onClick={() => onDismiss?.(toast.id)}
              aria-label="Dismiss toast"
              className="text-muted-foreground hover:bg-primary/[0.06] hover:text-foreground inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </motion.li>
  )
})
