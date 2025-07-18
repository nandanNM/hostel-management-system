export type ApiResponse = {
  status: "success" | "error";
  message: string;
};

export interface MealPreference {
  type: "VEG" | "NON_VEG";
  nonVegType: "CHICKEN" | "FISH" | "EGG" | "NONE";
  message?: string;
}
