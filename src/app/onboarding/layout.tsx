import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { PageContainer } from "@/components/page-container"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.onboardingCompleted) redirect("/")

  return (
    // Same container every other page uses. The old layout had py-4 but no
    // horizontal padding, so the forms ran into the edge of a phone screen.
    <PageContainer className="mx-auto max-w-3xl p-4 sm:p-6">
      <div className="text-center">
        <h2 className="text-muted-foreground">Onboarding</h2>
      </div>
      {children}
    </PageContainer>
  )
}
