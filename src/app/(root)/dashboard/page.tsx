import { Suspense } from "react"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { InfoIcon, Loader2, TriangleAlert } from "lucide-react"

import { requireUser } from "@/lib/require-user"
import { Separator } from "@/components/ui/separator"

import { MealMessageDialog } from "./_components/meal-message-dialog"
import MealTogleButton from "./_components/meal-togle-button"
import UserActivity from "./_components/user-activity"
import UserDetails from "./_components/user-details.tsx"

export const metadata: Metadata = {
  title: "Dashboard",
}

export default async function Page() {
  const { user } = await requireUser()
  if (!user?.id) return notFound()

  return (
    <div className="w-full md:mx-8 lg:mx-auto">
      <h2 className="text-foreground mb-4 font-bold">User Dashboard</h2>
      {user.role === "ADMIN" && (
        <div className="mb-4 rounded-md border border-blue-500/50 bg-blue-50 px-4 py-3 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
          <p className="flex items-center text-sm font-medium">
            <InfoIcon className="mr-3 size-5" />
            Admin Dashboard is currently under maintenance. Please wait for full
            implementation.
          </p>
        </div>
      )}
      <div className="rounded-md border px-4 py-3">
        <p className="text-sm">
          <TriangleAlert
            className="me-3 -mt-0.5 inline-flex text-amber-500"
            size={16}
            aria-hidden="true"
          />
          You&apos;ve toggled your meal status multiple times in a short period.
          Continued misuse may result in temporary suspension.
        </p>
      </div>
      <div className="flex w-full items-center gap-6 py-4 md:gap-12">
        <MealTogleButton />
        <MealMessageDialog />
      </div>

      <Separator />
      <div className="mx-auto max-w-7xl px-2 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-foreground text-2xl font-bold">
            Welcome back, {user.name}! 👋
          </h2>
          <p className="text-muted-foreground">
            Here&apos;s your mess account overview
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <UserDetails userId={user.id} />
          <Suspense fallback={<Loader2 className="mx-auto animate-spin" />}>
            <UserActivity userId={user.id} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
