import { emailLayout, type EmailTemplate } from "./layout"

export function terminationEmail({
  name,
  reason,
}: {
  name: string | null
  reason?: string | null
}): EmailTemplate {
  const body = `
    <p style="font-size: 14px; line-height: 1.6;">Hi ${name ?? "there"},</p>
    <p style="font-size: 14px; line-height: 1.6;">
      We are writing to let you know that your mess membership has been
      <strong style="color: #dc2626;">terminated</strong>${
        reason ? ` for the following reason:` : "."
      }
    </p>
    ${
      reason
        ? `<p style="font-size: 14px; line-height: 1.6; padding: 12px 16px; background: #fef2f2; border-radius: 6px;">${reason}</p>`
        : ""
    }
    <p style="font-size: 14px; line-height: 1.6;">
      Any outstanding dues on your account remain payable. If you believe this
      is a mistake or have any questions, please contact the mess prefect.
    </p>`

  return {
    subject: "Your mess membership has been terminated",
    html: emailLayout("Membership terminated", body),
  }
}
