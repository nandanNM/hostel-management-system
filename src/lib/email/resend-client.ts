import "server-only"

import { Resend } from "resend"

/**
 * Shared Resend client. Instantiated lazily and only when a key is configured
 * so the app runs fine in local/dev without email credentials — sends simply
 * become no-ops (see `sendEmail`).
 */
export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL || "Hostel Mess <onboarding@resend.dev>"
