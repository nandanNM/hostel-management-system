import { Metadata } from "next"
import requireMessPrefect from "@/data/mess-prefect/require-mess-prefect"
import { EnvelopeSimple } from "@phosphor-icons/react/ssr"

import { PageContainer, PageHeader } from "@/components/page-container"

import { InviteForm } from "./_components/invite-form"

export const metadata: Metadata = {
  title: "Invitations",
  description: "Invite a guest to join the mess as a temporary boarder.",
}

export default async function InvitationsPage() {
  await requireMessPrefect()

  return (
    <PageContainer className="flex-1 p-4 sm:p-6">
      <PageHeader
        icon={EnvelopeSimple}
        title="Invitations"
        description="Invite a guest staying for a short period to join the mess."
      />
      <InviteForm />
    </PageContainer>
  )
}
