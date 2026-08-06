import { createHmac, timingSafeEqual } from "node:crypto"

/**
 * Self-contained invitation tokens.
 *
 * The token carries its own payload and is signed with AUTH_SECRET, so an
 * invite needs no database row - which is what lets this ship without a
 * migration. The trade-off is real and worth knowing: there is nothing to
 * revoke against, so a token stays usable until it expires. Keep the lifetime
 * short, and always check the signed email against the account that signed in.
 */
export type InvitePayload = {
  /** The Gmail address the invite was issued to, lowercased. */
  email: string
  /** Marks the account as a temporary boarder rather than a regular one. */
  temporary: boolean
  /** End of the stay, as an ISO date (yyyy-MM-dd) or null. */
  stayUntil: string | null
  /** Expiry, seconds since the epoch. */
  exp: number
}

export const DEFAULT_INVITE_TTL_DAYS = 7

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

function fromBase64url(input: string): Buffer {
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64")
}

function sign(body: string, secret: string): string {
  return base64url(createHmac("sha256", secret).update(body).digest())
}

/** Normalise so "A@Gmail.com " and "a@gmail.com" cannot diverge. */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function createInviteToken(
  input: {
    email: string
    temporary?: boolean
    stayUntil?: string | null
    ttlDays?: number
  },
  secret: string,
  now: Date = new Date()
): string {
  if (!secret) throw new Error("Cannot sign an invite without a secret")

  const ttlDays = input.ttlDays ?? DEFAULT_INVITE_TTL_DAYS
  const payload: InvitePayload = {
    email: normaliseEmail(input.email),
    temporary: input.temporary ?? true,
    stayUntil: input.stayUntil ?? null,
    exp: Math.floor(now.getTime() / 1000) + ttlDays * 24 * 60 * 60,
  }

  const body = base64url(JSON.stringify(payload))
  return `${body}.${sign(body, secret)}`
}

export type InviteVerdict =
  | { valid: true; payload: InvitePayload }
  | { valid: false; reason: "malformed" | "bad-signature" | "expired" }

export function verifyInviteToken(
  token: string,
  secret: string,
  now: Date = new Date()
): InviteVerdict {
  const parts = token?.split(".")
  if (!parts || parts.length !== 2 || !parts[0] || !parts[1]) {
    return { valid: false, reason: "malformed" }
  }

  const [body, signature] = parts as [string, string]
  const expected = sign(body, secret)

  // Constant-time compare, so a wrong signature cannot be probed byte by byte.
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { valid: false, reason: "bad-signature" }
  }

  let payload: InvitePayload
  try {
    payload = JSON.parse(fromBase64url(body).toString("utf8"))
  } catch {
    return { valid: false, reason: "malformed" }
  }

  if (
    typeof payload?.email !== "string" ||
    typeof payload?.exp !== "number" ||
    typeof payload?.temporary !== "boolean"
  ) {
    return { valid: false, reason: "malformed" }
  }

  if (payload.exp * 1000 <= now.getTime()) {
    return { valid: false, reason: "expired" }
  }

  return { valid: true, payload }
}

/**
 * Whether the account that signed in is the one the invite was issued to.
 *
 * Without this an invite link forwarded to anyone would hand out a boarder
 * account, so every consumer must call it.
 */
export function inviteMatchesAccount(
  payload: InvitePayload,
  signedInEmail: string | null | undefined
): boolean {
  if (!signedInEmail) return false
  return normaliseEmail(signedInEmail) === normaliseEmail(payload.email)
}

export function inviteUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/$/, "")}/invite/${token}`
}

/**
 * Where invite links should point.
 *
 * NEXT_PUBLIC_APP_URL wins, so each environment states its own address rather
 * than inferring it from NODE_ENV - that inference is what sent a production
 * invite to a localhost link. VERCEL_PROJECT_PRODUCTION_URL is the fallback on
 * Vercel, and localhost is the last resort for a plain `next dev`.
 */
export function resolveAppBaseUrl(
  env: Record<string, string | undefined> = process.env
): string {
  const explicit = env.NEXT_PUBLIC_APP_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, "")

  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (vercel)
    return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/$/, "")}`

  return "http://localhost:3000"
}
