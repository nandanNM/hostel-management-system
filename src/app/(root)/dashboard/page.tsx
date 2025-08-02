import { Suspense } from "react"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { Loader2 } from "lucide-react"

import { requireUser } from "@/lib/require-user"
import { Separator } from "@/components/ui/separator"
import { P } from "@/components/custom/p"

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
  if (user.status === "INACTIVE")
    return (
      <div className="w-full md:mx-8 lg:mx-auto">
        <P className="text-destructive text-center text-balance">
          You are not a boarder member and cannot access this page. Please
          contact the admin or a boarder member.
        </P>
      </div>
    )

  if (user.status === "BANNED")
    return (
      <div className="w-full md:mx-8 lg:mx-auto">
        <P className="text-destructive text-center text-balance">
          You are banned and cannot access this page. Please contact the admin.
        </P>
      </div>
    )

  return (
    <div className="w-full md:mx-8 lg:mx-auto">
      <h2 className="text-foreground mb-4 font-bold">User Dashboard</h2>
      <div className="flex w-full items-center gap-6 pb-4 md:gap-12">
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
