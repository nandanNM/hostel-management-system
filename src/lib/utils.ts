import { clsx, type ClassValue } from "clsx"
import {
  format,
  formatDate as formatDateFn,
  formatDistanceToNowStrict,
  getHours,
} from "date-fns"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrentMealSlot(
  date: Date = new Date()
): "LUNCH" | "DINNER" {
  const amPm = format(date, "a")
  return amPm === "AM" ? "LUNCH" : "DINNER"
}

export function formatRelativeDate(from: Date) {
  const currentDate = new Date()
  if (currentDate.getTime() - from.getTime() < 24 * 60 * 60 * 1000) {
    return formatDistanceToNowStrict(from, { addSuffix: true })
  } else {
    if (currentDate.getFullYear() === from.getFullYear()) {
      return formatDateFn(from, "MMM d")
    } else {
      return formatDateFn(from, "MMM d, yyy")
    }
  }
}

export function formatNumber(n: number): string {
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n)
}

export async function getErrorMessage(error: unknown): Promise<string> {
  const defaultMessage = "Something went wrong. Please try again."

  if (error instanceof Error) {
    if (error.name === "TimeoutError") {
      return "Request timed out. Please check your internet connection."
    }

    const httpError = error as Error & { response?: Response }
    if (httpError.response) {
      try {
        const data = await httpError.response.json()
        return (
          data?.message ||
          data?.error ||
          httpError.response.statusText ||
          defaultMessage
        )
      } catch {
        return httpError.response.statusText || defaultMessage
      }
    }

    return error.message || defaultMessage
  }

  return defaultMessage
}
export function formatDate(
  date: Date | string | number,
  opts: Intl.DateTimeFormatOptions = {}
) {
  return new Intl.DateTimeFormat("en-US", {
    month: opts.month ?? "long",
    day: opts.day ?? "numeric",
    year: opts.year ?? "numeric",
    ...opts,
  }).format(new Date(date))
}
export function parseEnumList<T extends string>(
  value: string | undefined,
  enumObject: Record<string, T>
): T[] {
  if (!value) return []
  return value
    .split(".")
    .map((v) => v.trim())
    .filter((v): v is T => Object.values(enumObject).includes(v as T))
}

export function isActiveTime(date: Date = new Date()): boolean {
  const hour = getHours(date)

  const isMorningInactive = hour >= 6 && hour < 12
  const isEveningInactive = hour >= 18 && hour < 24

  return !(isMorningInactive || isEveningInactive)
}
