"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowsClockwise, SignOut } from "@phosphor-icons/react"

import { signOutAction } from "@/lib/auth-actions"
import { Button } from "@/components/ui/button"

/**
 * The two ways out of a restricted screen.
 *
 * "Check again" re-reads the session from the server, so a boarder whose
 * account was just approved does not have to guess when to reload. "Use a
 * different account" clears the session, which is the only escape when someone
 * signed in with the wrong Google account.
 */
export function RestrictedAccessActions({
  retryHref = "/",
}: {
  retryHref?: string
}) {
  const router = useRouter()
  const [isRetrying, startRetry] = useTransition()
  const [isSigningOut, startSignOut] = useTransition()

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={isRetrying}
        onClick={() =>
          startRetry(() => {
            // refresh() alone would re-render this same screen; push takes the
            // user forward once the status actually changed.
            router.refresh()
            router.push(retryHref)
          })
        }
      >
        <ArrowsClockwise className="mr-2 h-4 w-4" />
        {isRetrying ? "Checking..." : "Check again"}
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        disabled={isSigningOut}
        onClick={() => startSignOut(() => void signOutAction())}
      >
        <SignOut className="mr-2 h-4 w-4" />
        Use a different account
      </Button>
    </div>
  )
}
