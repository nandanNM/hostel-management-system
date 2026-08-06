import { Metadata } from "next"
import { cookies } from "next/headers"
import { signIn } from "@/auth"
import { RiGoogleFill } from "@remixicon/react"

import { verifyInviteToken } from "@/lib/invitations"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Mess invitation",
}

/** Read by the sign-in flow so it knows this account arrived via an invite. */
export const INVITE_COOKIE = "mess_invite"

const INVALID_COPY: Record<string, string> = {
  expired: "This invitation has expired. Ask the mess prefect for a new one.",
  "bad-signature": "This invitation link is not valid.",
  malformed: "This invitation link is not valid.",
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const secret = process.env.AUTH_SECRET ?? ""
  const verdict = verifyInviteToken(token, secret)

  if (!verdict.valid) {
    return (
      <main className="flex min-h-svh items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Invitation unavailable</CardTitle>
            <CardDescription>
              {INVALID_COPY[verdict.reason] ?? "This link is not valid."}
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    )
  }

  const { email, stayUntil } = verdict.payload

  // Short-lived, so the token cannot linger in the browser after sign-up.
  const jar = await cookies()
  jar.set(INVITE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 60,
    path: "/",
  })

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>You are invited to the mess</CardTitle>
          <CardDescription>
            Sign in with <strong>{email}</strong> to continue
            {stayUntil ? `. Your stay is set until ${stayUntil}.` : "."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server"
              await signIn("google", { callbackUrl: "/onboarding/identity" })
            }}
          >
            <Button className="w-full bg-[#DB4437] text-white after:flex-1 hover:bg-[#DB4437]/90">
              <span className="pointer-events-none me-2 flex-1">
                <RiGoogleFill
                  className="opacity-60"
                  size={16}
                  aria-hidden="true"
                />
              </span>
              Continue with Google
            </Button>
          </form>
          <p className="text-muted-foreground mt-3 text-xs">
            The invitation only works for {email}. Signing in with a different
            account will create a normal account instead.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
