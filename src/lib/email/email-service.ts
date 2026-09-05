import "server-only"

import { format } from "date-fns"

import { MealStatusType } from "@/lib/generated/prisma"

import {
  alumniFarewellEmail,
  type AlumniFarewellStats,
} from "./emails/alumni-farewell"
import { dueAddedEmail } from "./emails/due-added"
import { duesReminderEmail } from "./emails/dues-reminder"
import { happyBirthdayEmail } from "./emails/happy-birthday"
import { emailLayout } from "./emails/layout"
import { terminationEmail } from "./emails/termination"
import { EMAIL_FROM, resend } from "./resend-client"

type SendEmailArgs = {
  to: string
  subject: string
  html: string
  idempotencyKey?: string
}

/**
 * Low-level send. Never throws — email is a side-effect of manager actions and
 * must not fail the underlying operation. Returns whether the mail was sent.
 * Follows the Resend SDK contract: it returns `{ data, error }` rather than
 * throwing, so we inspect `error` explicitly.
 */
export async function sendEmail({
  to,
  subject,
  html,
  idempotencyKey,
}: SendEmailArgs): Promise<boolean> {
  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY not set — skipping "${subject}" to ${to}`
    )
    return false
  }

  try {
    const { data, error } = await resend.emails.send(
      { from: EMAIL_FROM, to: [to], subject, html },
      idempotencyKey ? { idempotencyKey } : undefined
    )
    if (error) {
      console.error(`[email] Failed to send "${subject}" to ${to}:`, error)
      return false
    }
    console.log(`[email] Sent "${subject}" to ${to} (id: ${data?.id})`)
    return true
  } catch (err) {
    // Network / unexpected errors — swallow so the caller's flow is unaffected.
    console.error(`[email] Unexpected error sending to ${to}:`, err)
    return false
  }
}

const MEAL_STATUS_COPY: Record<
  MealStatusType,
  { label: string; color: string; detail: string }
> = {
  ACTIVE: {
    label: "turned ON",
    color: "#16a34a",
    detail: "You will be counted for meals going forward.",
  },
  INACTIVE: {
    label: "turned OFF",
    color: "#dc2626",
    detail: "You will not be counted for meals until it is turned back on.",
  },
  SUSPENDED: {
    label: "suspended",
    color: "#dc2626",
    detail:
      "Your meals are suspended. Please contact the mess manager for details.",
  },
  MAINTENANCE: {
    label: "set to maintenance",
    color: "#d97706",
    detail: "Your meal account is temporarily under maintenance.",
  },
}

export async function sendMealStatusEmail({
  to,
  name,
  status,
}: {
  to: string
  name: string | null
  status: MealStatusType
}): Promise<boolean> {
  const { label, color, detail } = MEAL_STATUS_COPY[status]

  const body = `
    <p style="font-size: 14px; line-height: 1.6;">Hi ${name ?? "there"},</p>
    <p style="font-size: 14px; line-height: 1.6;">
      Your mess meal subscription has been
      <strong style="color: ${color};">${label}</strong> by the mess manager.
    </p>
    <p style="font-size: 14px; line-height: 1.6;">
      ${detail} If this doesn't look right, please contact the mess manager.
    </p>`

  return sendEmail({
    to,
    subject: `Your meals were ${label}`,
    html: emailLayout("Meal status updated", body),
  })
}

export async function sendPaymentReceivedEmail({
  to,
  name,
  amount,
  newBalance,
  method,
  billId,
  kind = "payment",
}: {
  to: string
  name: string | null
  amount: number
  newBalance: number
  method?: string | null
  billId?: string
  kind?: "payment" | "advance"
}): Promise<boolean> {
  const isAdvance = kind === "advance"
  const noun = isAdvance ? "advance" : "payment"
  const heading = isAdvance ? "Advance received" : "Payment received"

  const body = `
    <p style="font-size: 14px; line-height: 1.6;">Hi ${name ?? "there"},</p>
    <p style="font-size: 14px; line-height: 1.6;">
      The mess prefect has recorded ${
        isAdvance ? "an advance" : "a payment"
      } received against your account.
    </p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Amount received</td>
        <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #16a34a;">₹${amount.toFixed(
          2
        )}</td>
      </tr>
      ${
        method
          ? `<tr>
        <td style="padding: 8px 0; color: #6b7280;">Method</td>
        <td style="padding: 8px 0; text-align: right;">${method}</td>
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
      You can review this in your dashboard under recent transactions. If this
      doesn't look right, please contact the mess prefect.
    </p>`

  return sendEmail({
    to,
    subject: `${
      isAdvance ? "Advance" : "Payment"
    } of ₹${amount.toFixed(2)} received`,
    html: emailLayout(heading, body),
    idempotencyKey: billId ? `${noun}-received/${billId}` : undefined,
  })
}

export async function sendDueAddedEmail({
  to,
  name,
  amount,
  newBalance,
  description,
  billId,
}: {
  to: string
  name: string | null
  amount: number
  newBalance: number
  description?: string | null
  billId?: string
}): Promise<boolean> {
  const { subject, html } = dueAddedEmail({
    name,
    amount,
    newBalance,
    description,
  })
  return sendEmail({
    to,
    subject,
    html,
    idempotencyKey: billId ? `due-added/${billId}` : undefined,
  })
}

export async function sendDuesReminderEmail({
  to,
  name,
  outstanding,
  overdueCount,
  oldestDueLabel,
}: {
  to: string
  name: string | null
  outstanding: number
  overdueCount?: number
  oldestDueLabel?: string | null
}): Promise<boolean> {
  const { subject, html } = duesReminderEmail({
    name,
    outstanding,
    overdueCount,
    oldestDueLabel,
  })
  return sendEmail({ to, subject, html })
}

export async function sendHappyBirthdayEmail({
  to,
  name,
  idempotencyKey,
}: {
  to: string
  name: string | null
  idempotencyKey?: string
}): Promise<boolean> {
  const { subject, html } = happyBirthdayEmail({ name })
  return sendEmail({ to, subject, html, idempotencyKey })
}

export async function sendTerminationEmail({
  to,
  name,
  reason,
}: {
  to: string
  name: string | null
  reason?: string | null
}): Promise<boolean> {
  const { subject, html } = terminationEmail({ name, reason })
  return sendEmail({ to, subject, html })
}

export async function sendFineIssuedEmail({
  to,
  name,
  amount,
  reason,
  dueDate,
  fineId,
}: {
  to: string
  name: string | null
  amount: number
  reason: string
  dueDate?: Date | null
  fineId?: string
}): Promise<boolean> {
  const body = `
    <p style="font-size: 14px; line-height: 1.6;">Hi ${name ?? "there"},</p>
    <p style="font-size: 14px; line-height: 1.6;">
      A fine has been issued to your account by the mess manager.
    </p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Amount</td>
        <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #dc2626;">₹${amount.toFixed(
          2
        )}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Reason</td>
        <td style="padding: 8px 0; text-align: right;">${reason}</td>
      </tr>
      ${
        dueDate
          ? `<tr>
        <td style="padding: 8px 0; color: #6b7280;">Due date</td>
        <td style="padding: 8px 0; text-align: right;">${format(
          dueDate,
          "dd MMM yyyy"
        )}</td>
      </tr>`
          : ""
      }
    </table>
    <p style="font-size: 14px; line-height: 1.6;">
      This amount has been added to your outstanding dues. Please clear it before the due date.
    </p>`

  return sendEmail({
    to,
    subject: `A fine of ₹${amount.toFixed(2)} was added to your account`,
    html: emailLayout("Fine issued", body),
    idempotencyKey: fineId ? `fine-issued/${fineId}` : undefined,
  })
}

export async function sendBoarderInviteEmail({
  to,
  inviteUrl,
  invitedBy,
  stayUntil,
  expiresInDays,
}: {
  to: string
  inviteUrl: string
  invitedBy: string | null
  stayUntil: string | null
  expiresInDays: number
}): Promise<boolean> {
  const body = `
    <p style="font-size: 14px; line-height: 1.6;">Hi there,</p>
    <p style="font-size: 14px; line-height: 1.6;">
      ${invitedBy ? `${invitedBy} has` : "The mess prefect has"} invited you to
      join the mess as a temporary boarder${stayUntil ? ` until <strong>${stayUntil}</strong>` : ""}.
    </p>
    <p style="font-size: 14px; line-height: 1.6;">
      Use the button below and sign in with <strong>this same email address</strong>
      - the invitation only works for ${to}.
    </p>
    <p style="margin: 24px 0;">
      <a href="${inviteUrl}" style="background:#d97706;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">
        Accept invitation
      </a>
    </p>
    <p style="font-size: 12px; line-height: 1.6; color: #6b7280;">
      This link expires in ${expiresInDays} day(s). If you were not expecting it,
      you can ignore this email.
    </p>`

  return sendEmail({
    to,
    subject: "You have been invited to the mess",
    html: emailLayout("Mess invitation", body),
  })
}

export async function sendAlumniFarewellEmail({
  to,
  alumniId,
  ...stats
}: AlumniFarewellStats & {
  to: string
  /** Keyed on the alumni row so a repeated transfer cannot mail twice. */
  alumniId?: string
}): Promise<boolean> {
  const { subject, html } = alumniFarewellEmail(stats)
  return sendEmail({
    to,
    subject,
    html,
    idempotencyKey: alumniId ? `alumni-farewell/${alumniId}` : undefined,
  })
}
