export const roleType = ["user", "admin"] as const;

export type ApiResponse = {
  status: "success" | "error";
  message: string;
};
