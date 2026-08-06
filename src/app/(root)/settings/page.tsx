import { Metadata } from "next"
import { notFound } from "next/navigation"

import prisma from "@/lib/prisma"
import { requireUser } from "@/lib/require-user"
import { PageContainer } from "@/components/page-container"

import PushNotificationsCard from "./_components/push-notifications-card"
import SettingsForm from "./_components/settings-form"

export const metadata: Metadata = {
  title: "User Settings | D.L Bhawan (PG1)",
  description: "Update your personal account information.",
}

export default async function SettingsPage() {
  const session = await requireUser()
  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      selfPhNo: true,
      dob: true,
      address: true,
    },
  })

  if (!user) {
    notFound()
  }

  return (
    <PageContainer>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Manage your account settings and personal preferences.
        </p>
      </div>
      <hr className="border-muted-foreground/10" />
      <div className="flex w-full flex-col gap-10">
        <SettingsForm user={user} />
        <PushNotificationsCard />
      </div>
    </PageContainer>
  )
}
