export const GENDER_OPTIONS = ["MALE", "FEMALE", "OTHER"] as const;
export type NonVegType = (typeof NON_VEG_OPTIONS)[number];
export const RELIGION_OPTIONS = [
  "HINDU",
  "MUSLIM",
  "CHRISTIAN",
  "OTHER",
] as const;
export const HOSTAL_TAG = ["PG1"] as const;
export const HOSTAL_ID = ["PG1", "PG2"] as const;
export const MEAL_TYPE_OPTIONS = ["VEG", "NON_VEG"] as const;
export const MEAL_TIME_OPTIONS = ["DAY", "NIGHT"] as const;
export const NON_VEG_OPTIONS = ["CHICKEN", "FISH", "EGG", "NONE"] as const;
export const MEAL_STATUS_OPTIONS = ["PENDING", "APPROVED", "REJECTED"] as const;
