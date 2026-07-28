"use client"

import { type ReactNode } from "react"
import { create } from "zustand"

import {
  AnimatedToastStack,
  type AnimatedToast,
  type ToastPosition,
  type ToastStatus,
} from "@/components/ui/animated-toast-stack"

type ToastOptions = {
  description?: ReactNode
  duration?: number
  id?: string
}

type PromiseMessages<T> = {
  loading: ReactNode
  success: ReactNode | ((data: T) => ReactNode)
  error: ReactNode | ((error: unknown) => ReactNode)
}

type ToastStore = {
  toasts: AnimatedToast[]
  add: (toast: AnimatedToast) => void
  update: (id: string, patch: Partial<AnimatedToast>) => void
  dismiss: (id: string) => void
  clear: () => void
}

const DEFAULT_DURATION = 4200

const useToastStore = create<ToastStore>()((set) => ({
  toasts: [],
  add: (toast) => set((state) => ({ toasts: [...state.toasts, toast] })),
  update: (id, patch) =>
    set((state) => ({
      toasts: state.toasts.map((toast) =>
        toast.id === id ? { ...toast, ...patch } : toast
      ),
    })),
  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
  clear: () => set({ toasts: [] }),
}))

let seed = 0
function nextId() {
  seed += 1
  return `toast-${Date.now()}-${seed}`
}

function scheduleDismiss(id: string, duration: number) {
  if (duration <= 0 || typeof window === "undefined") return
  window.setTimeout(() => useToastStore.getState().dismiss(id), duration)
}

function push(
  status: ToastStatus,
  message: ReactNode,
  options?: ToastOptions
): string {
  const id = options?.id ?? nextId()
  const duration = options?.duration ?? DEFAULT_DURATION
  const existing = useToastStore.getState().toasts.some((t) => t.id === id)
  const payload: AnimatedToast = {
    id,
    title: message,
    description: options?.description,
    status,
    duration,
    dismissible: true,
    createdAt: Date.now(),
  }
  if (existing) {
    useToastStore.getState().update(id, payload)
  } else {
    useToastStore.getState().add(payload)
  }
  scheduleDismiss(id, duration)
  return id
}

function resolveMessage<T>(
  value: ReactNode | ((arg: T) => ReactNode),
  arg: T
): ReactNode {
  return typeof value === "function"
    ? (value as (arg: T) => ReactNode)(arg)
    : value
}

export const toast = Object.assign(
  (message: ReactNode, options?: ToastOptions) =>
    push("neutral", message, options),
  {
    success: (message: ReactNode, options?: ToastOptions) =>
      push("success", message, options),
    error: (message: ReactNode, options?: ToastOptions) =>
      push("error", message, options),
    info: (message: ReactNode, options?: ToastOptions) =>
      push("info", message, options),
    warning: (message: ReactNode, options?: ToastOptions) =>
      push("error", message, options),
    message: (message: ReactNode, options?: ToastOptions) =>
      push("neutral", message, options),
    loading: (message: ReactNode, options?: ToastOptions) =>
      push("loading", message, {
        ...options,
        duration: options?.duration ?? 0,
      }),
    dismiss: (id?: string) => {
      if (id) useToastStore.getState().dismiss(id)
      else useToastStore.getState().clear()
    },
    promise: <T,>(
      promise: Promise<T>,
      messages: PromiseMessages<T>
    ): Promise<T> => {
      const id = push("loading", messages.loading, { duration: 0 })
      promise
        .then((data) => {
          push("success", resolveMessage(messages.success, data), {
            id,
            duration: DEFAULT_DURATION,
          })
        })
        .catch((error: unknown) => {
          push("error", resolveMessage(messages.error, error), {
            id,
            duration: DEFAULT_DURATION,
          })
        })
      return promise
    },
  }
)

export function Toaster({
  position = "bottom-right",
}: {
  position?: ToastPosition
}) {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)
  return (
    <AnimatedToastStack
      toasts={toasts}
      onDismiss={dismiss}
      position={position}
      placement="fixed"
    />
  )
}
