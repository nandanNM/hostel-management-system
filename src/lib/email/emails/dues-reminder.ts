import { emailLayout, type EmailTemplate } from "./layout"

export function duesReminderEmail({
  name,
  outstanding,
  overdueCount,
  oldestDueLabel,
}: {
  name: string | null
  outstanding: number
  /** Unpaid bills already past their due date, if any. */
  overdueCount?: number
  /** Human-readable date of the oldest unpaid bill, e.g. "12 Aug 2026". */
  oldestDueLabel?: string | null
}): EmailTemplate {
  const body = `
    <p style="font-size: 14px; line-height: 1.6;">Hi ${name ?? "there"},</p>
    <p style="font-size: 14px; line-height: 1.6;">
      This is a reminder from the mess prefect about your outstanding mess dues.
    </p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Outstanding due</td>
        <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #dc2626;">₹${outstanding.toFixed(
          2
        )}</td>
      </tr>
      ${
        overdueCount
          ? `<tr>
        <td style="padding: 8px 0; color: #6b7280;">Bills past due date</td>
        <td style="padding: 8px 0; text-align: right; font-weight: bold;">${overdueCount}</td>
      </tr>`
          : ""
      }
      ${
        oldestDueLabel
          ? `<tr>
        <td style="padding: 8px 0; color: #6b7280;">Oldest unpaid since</td>
        <td style="padding: 8px 0; text-align: right;">${oldestDueLabel}</td>
      </tr>`
          : ""
      }
    </table>
    <p style="font-size: 14px; line-height: 1.6;">
      Please clear this amount at the earliest. If you have already paid, you can
      ignore this message.
    </p>`

  return {
    subject: `Reminder: ₹${outstanding.toFixed(2)} mess dues pending`,
    html: emailLayout("Dues reminder", body),
  }
}
