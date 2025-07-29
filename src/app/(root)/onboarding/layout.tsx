import { redirect } from "next/navigation"

import { requireUser } from "@/lib/require-user"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await requireUser()
  if (user.onboardingCompleted) return redirect("/")

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="text-center">
        <h2 className="text-neutral-600">Onboarding</h2>
      </div>
      <div>{children}</div>
    </div>
  )
}
