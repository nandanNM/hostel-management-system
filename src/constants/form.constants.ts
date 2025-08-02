export const GENDER_OPTIONS = ["MALE", "FEMALE", "OTHER"] as const
export type NonVegType = (typeof NON_VEG_OPTIONS)[number]
export const RELIGION_OPTIONS = [
  "HINDU",
  "MUSLIM",
  "CHRISTIAN",
  "OTHER",
] as const
export const MEAL_TYPE_OPTIONS = ["VEG", "NON_VEG"] as const
export const MEAL_TIME_OPTIONS = ["LUNCH", "DINNER"] as const
export const NON_VEG_OPTIONS = [
  "CHICKEN",
  "FISH",
  "EGG",
  "MUTTON",
  "NONE",
] as const
export const MEAL_STATUS_OPTIONS = ["PENDING", "APPROVED", "REJECTED"] as const
export const DISLIKED_NON_VEG_TYPES = [
  "CHICKEN",
  "FISH",
  "EGG",
  "MUTTON",
] as const
