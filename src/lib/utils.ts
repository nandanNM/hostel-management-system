import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getTimeOfDay(date: Date = new Date()): "day" | "night" {
  const amPm = format(date, "a");

  return amPm === "AM" ? "day" : "night";
}
