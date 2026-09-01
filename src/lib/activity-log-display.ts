export type ActivityLogLevel = "info" | "warning" | "error"

/** Every `actionType` literal an ActivityLog is ever written with. */
export const ACTIVITY_LOG_ACTION_TYPES = [
  "ADVANCE_RECORDED",
  "ALUMNI_CREATED",
  "ALUMNI_DELETED",
  "ALUMNI_UPDATED",
  "BILLING_DRAFT_SAVED",
  "BILLING_EXCLUSIONS_UPDATED",
  "BROADCAST_NOTIFICATION_SENT",
  "CREATE",
  "DELETE",
  "DUE_ADDED",
  "FINE_ISSUED",
  "GUEST_MEAL_STATUS_CHANGE",
  "MEAL_COUNT_GENERATED",
  "MEAL_PREFERENCE_OVERRIDE",
  "MEAL_STATUS_CHANGE",
  "MEAL_STATUS_OVERRIDE",
  "MONTHLY_BILL_FINALIZED",
  "PAYMENT_RECORDED",
  "RESET",
  "ROLE_CHANGE",
  "SEED",
  "UPDATE",
  "USER_APPROVAL",
  "USER_DETAILS_UPDATE",
  "USER_REJECTION",
  "USER_TRANSFERRED_TO_ALUMNI",
] as const

const ACTION_LABELS: Record<string, string> = {
  MEAL_STATUS_CHANGE: "Meal Toggle",
  MEAL_COUNT_GENERATED: "Meal Count",
  CREATE: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted",
  FINE_ISSUED: "Fine Issued",
  PAYMENT: "Payment",
  PAYMENT_RECORDED: "Payment",
}

export function levelOfActivityLog(actionType: string): ActivityLogLevel {
  const a = actionType.toUpperCase()
  if (/DELETE|FINE|DUE|TERMINAT|SUSPEND|FAIL/.test(a)) return "error"
  if (/UPDATE|WARN|EXCLU/.test(a)) return "warning"
  return "info"
}

export function prettifyActivityLogAction(actionType: string): string {
  return (
    ACTION_LABELS[actionType] ??
    actionType
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

export function summarizeActivityLogData(data: unknown): string | null {
  if (data === null || data === undefined) return null
  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>)
    if (entries.length === 0) return null
    return entries.map(([k, v]) => `${k}: ${String(v)}`).join(", ")
  }
  return String(data)
}
