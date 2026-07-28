import { APP_NAME, emailLayout, type EmailTemplate } from "./layout"

export function happyBirthdayEmail({
  name,
}: {
  name: string | null
}): EmailTemplate {
  const body = `
    <p style="font-size: 14px; line-height: 1.6;">Hi ${name ?? "there"},</p>
    <p style="font-size: 14px; line-height: 1.6;">
      Wishing you a very <strong style="color: #db2777;">Happy Birthday</strong>
      from everyone at ${APP_NAME}! 🎉
    </p>
    <p style="font-size: 14px; line-height: 1.6;">
      We hope your day is full of good food, great company and lots of joy.
      Have a wonderful year ahead! 🎂
    </p>`

  return {
    subject: "Happy Birthday! 🎂",
    html: emailLayout("Happy Birthday!", body),
  }
}
