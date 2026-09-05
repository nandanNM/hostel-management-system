import { APP_NAME, emailLayout, type EmailTemplate } from "./layout"

export type AlumniFarewellStats = {
  name: string | null
  department: string
  /** Passing year, as the prefect entered it on the transfer form. */
  year: string
  roomNo: string | null
  /** Nights between joining and leaving, or null when the join date is unknown. */
  daysStayed: number | null
  /** Meals actually eaten here, from the attendance record. */
  mealsShared: number
  /** Guests this boarder signed in over the years. */
  guestsHosted: number
}

/** "2 years, 3 months" — a day count nobody wants to read as "847". */
function humaniseStay(days: number): string {
  const years = Math.floor(days / 365)
  const months = Math.floor((days % 365) / 30)

  const parts: string[] = []
  if (years > 0) parts.push(`${years} year${years > 1 ? "s" : ""}`)
  if (months > 0) parts.push(`${months} month${months > 1 ? "s" : ""}`)
  if (parts.length === 0) return `${days} day${days === 1 ? "" : "s"}`

  return parts.join(", ")
}

function statRow(label: string, value: string): string {
  return `
      <tr>
        <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">${label}</td>
        <td style="padding: 10px 0; text-align: right; font-weight: bold; font-size: 14px; color: #111827;">${value}</td>
      </tr>`
}

/**
 * The send-off a boarder gets when the prefect moves them to alumni.
 *
 * Every figure is drawn from what the hostel actually recorded, so it reads as
 * a memento of their own time here rather than a form letter. Any stat that
 * cannot be established is left out entirely - an invented "0 meals" would be
 * worse than saying nothing.
 */
export function alumniFarewellEmail(stats: AlumniFarewellStats): EmailTemplate {
  const {
    name,
    department,
    year,
    roomNo,
    daysStayed,
    mealsShared,
    guestsHosted,
  } = stats

  const firstName = name?.trim().split(/\s+/)[0] || "there"

  const rows = [
    daysStayed !== null && daysStayed > 0
      ? statRow(
          "Time with us",
          `${humaniseStay(daysStayed)} (${daysStayed.toLocaleString("en-IN")} days)`
        )
      : "",
    roomNo ? statRow("Your room", roomNo) : "",
    mealsShared > 0
      ? statRow("Meals shared", mealsShared.toLocaleString("en-IN"))
      : "",
    guestsHosted > 0
      ? statRow("Guests you brought", guestsHosted.toLocaleString("en-IN"))
      : "",
    statRow("Department", department),
    statRow("Batch of", year),
  ]
    .filter(Boolean)
    .join("")

  const body = `
    <p style="font-size: 14px; line-height: 1.6;">Dear ${firstName},</p>
    <p style="font-size: 14px; line-height: 1.6;">
      Congratulations — and welcome to the alumni of ${APP_NAME}. Your
      time as a boarder has formally come to an end, and your place here is now
      a permanent one.
    </p>
    <p style="font-size: 14px; line-height: 1.6;">
      Here is what our records remember of your stay:
    </p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #fffbeb; border-radius: 8px; padding: 8px 16px;">
      ${rows}
    </table>
    <p style="font-size: 14px; line-height: 1.6;">
      Thank you for every shared table, every late dinner, and for looking after
      this place while it was yours. The dining hall will be quieter without you.
    </p>
    <p style="font-size: 14px; line-height: 1.6;">
      Your account is now closed to meal bookings, but your name stays on the
      alumni register. Do come back and eat with us sometime — you will always
      have a seat.
    </p>
    <p style="font-size: 14px; line-height: 1.6; margin-top: 24px;">
      With warm regards,<br />
      <strong>The mess committee</strong>
    </p>`

  return {
    subject: `Thank you, ${firstName} — you're now an alumnus of ${APP_NAME}`,
    html: emailLayout("Farewell, and congratulations 🎓", body),
  }
}
