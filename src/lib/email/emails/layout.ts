export const APP_NAME = "D.L Bhawan (PG1)"

export type EmailTemplate = { subject: string; html: string }

export function emailLayout(heading: string, bodyHtml: string): string {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
    <div style="padding: 24px 0; border-bottom: 2px solid #e5e7eb;">
      <h1 style="font-size: 18px; margin: 0; color: #111827;">${APP_NAME}</h1>
    </div>
    <div style="padding: 24px 0;">
      <h2 style="font-size: 20px; margin: 0 0 16px;">${heading}</h2>
      ${bodyHtml}
    </div>
    <div style="padding: 16px 0; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
      This is an automated message from ${APP_NAME}. Please do not reply to this email.
    </div>
  </div>`
}
