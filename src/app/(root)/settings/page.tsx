import { Metadata } from "next"
import { notFound } from "next/navigation"
import { requireUser } from "@/lib/require-user"
import prisma from "@/lib/prisma"
import SettingsForm from "./_components/settings-form"

export const metadata: Metadata = {
  title: "User Settings | HMS",
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
    <div className="mx-auto flex w-full flex-col gap-6 py-6 lg:py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Manage your account settings and personal preferences.
        </p>
      </div>
      <hr className="my-2 border-muted-foreground/10" />
      <div className="flex w-full flex-col gap-10">
        <SettingsForm user={user} />
      </div>
    </div>
  )
}
