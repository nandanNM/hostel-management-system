import { clsx, type ClassValue } from "clsx"
import { formatDistanceToNowStrict, getHours } from "date-fns"
import { twMerge } from "tailwind-merge"

import { formatIST, IST, istWallClock } from "@/lib/date"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrentMealSlot(
  date: Date = new Date()
): "LUNCH" | "DINNER" {
  const amPm = formatIST(date, "a")
  return amPm === "AM" ? "LUNCH" : "DINNER"
}

export function formatRelativeDate(from: Date) {
  const currentDate = new Date()
  if (currentDate.getTime() - from.getTime() < 24 * 60 * 60 * 1000) {
    return formatDistanceToNowStrict(from, { addSuffix: true })
  } else {
    if (formatIST(currentDate, "yyyy") === formatIST(from, "yyyy")) {
      return formatIST(from, "MMM d")
    } else {
      return formatIST(from, "MMM d, yyyy")
    }
  }
}

export function formatNumber(n: number): string {
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n)
}

export function formatDate(
  date: Date | string | number,
  opts: Intl.DateTimeFormatOptions = {}
) {
  return new Intl.DateTimeFormat("en-US", {
    month: opts.month ?? "long",
    day: opts.day ?? "numeric",
    year: opts.year ?? "numeric",
    // Pin to India time: without this the server (UTC on Vercel) renders the
    // previous day for anything stored near midnight IST.
    timeZone: opts.timeZone ?? IST,
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
  const hour = getHours(istWallClock(date))

  const isMorningInactive = hour >= 6 && hour < 12
  const isEveningInactive = hour >= 18 && hour < 24

  return !(isMorningInactive || isEveningInactive)
}
