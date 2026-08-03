import { Metadata } from "next"
import { Gear } from "@phosphor-icons/react/ssr"

import { PageContainer, PageHeader } from "@/components/page-container"

import { MessConfigForm } from "./_components/mess-config-form"
import { getMessConfigForEditing } from "./_lib/actions"

export const metadata: Metadata = {
  title: "Mess Settings",
  description: "Guest meal rules, priority order and rates.",
}

export default async function MessConfigPage() {
  const { config, rates } = await getMessConfigForEditing()

  return (
    <PageContainer className="flex-1 p-4 sm:p-6">
      <PageHeader
        icon={Gear}
        title="Mess Settings"
        description="Change how guest meals are booked and priced without a deploy."
      />
      <MessConfigForm config={config} rates={rates} />
    </PageContainer>
  )
}
