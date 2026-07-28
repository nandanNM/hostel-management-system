import { emailLayout, type EmailTemplate } from "./layout"

export function dueAddedEmail({
  name,
  amount,
  newBalance,
  description,
}: {
  name: string | null
  amount: number
  newBalance: number
  description?: string | null
}): EmailTemplate {
  const body = `
    <p style="font-size: 14px; line-height: 1.6;">Hi ${name ?? "there"},</p>
    <p style="font-size: 14px; line-height: 1.6;">
      The mess prefect has added a new due to your account.
    </p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Amount</td>
        <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #dc2626;">₹${amount.toFixed(
          2
        )}</td>
      </tr>
      ${
        description
          ? `<tr>
        <td style="padding: 8px 0; color: #6b7280;">Details</td>
        <td style="padding: 8px 0; text-align: right;">${description}</td>
      </tr>`
          : ""
      }
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Outstanding due</td>
        <td style="padding: 8px 0; text-align: right; font-weight: bold;">₹${newBalance.toFixed(
          2
        )}</td>
      </tr>
    </table>
    <p style="font-size: 14px; line-height: 1.6;">
      This amount has been added to your outstanding dues. Please clear it at the
      earliest.
    </p>`

  return {
    subject: `A due of ₹${amount.toFixed(2)} was added to your account`,
    html: emailLayout("Due added", body),
  }
}
