import { APP_NAME, emailLayout, type EmailTemplate } from "./layout"

export function happyBirthdayEmail({
  name,
}: {
  name: string | null
}): EmailTemplate {
  const gif =
    "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDlkcDJzMDRoYWZubDF3eTdncjVvYWh6eTUybjdoNTZneXp3eXE2MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Xw3pnKSKhcH7ozPozR/giphy.gif"

  const body = `
    <div style="text-align: center; margin: 4px 0 20px;">
      <img src="${gif}" alt="Happy Birthday" width="480" style="width: 100%; max-width: 480px; border-radius: 12px; display: inline-block; border: 0;" />
    </div>
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
