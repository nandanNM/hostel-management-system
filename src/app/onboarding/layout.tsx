import { redirect } from "next/navigation"
import { auth } from "@/auth"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")
  if (session) {
    if (session.user.onboardingCompleted) redirect("/")
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 py-4">
      <div className="text-center">
        <h2 className="text-neutral-600">Onboarding</h2>
      </div>
      <div>{children}</div>
    </div>
  )
}
