import { unstable_noStore as noStore } from "next/cache"
import { GraduationCap } from "@phosphor-icons/react/ssr"

import { UserRoleType } from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"
import { requireUser } from "@/lib/require-user"
import { PageContainer, PageHeader } from "@/components/page-container"

import { AlumniTable } from "./_components/alumni-table"

export default async function AlumniPage() {
  noStore()
  const session = await requireUser()
  // Only the mess prefect manages alumni; everyone else sees a read-only view.
  const isMessPrefect = session.user.role === UserRoleType.MESS_PREFECT

  const alumni = await prisma.alumni.findMany({
    orderBy: [{ year: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      department: true,
      mobileNumber: true,
      email: true,
      year: true,
    },
  })

  return (
    <PageContainer>
      <PageHeader
        icon={GraduationCap}
        title="Alumni"
        description={`Former boarders — ${alumni.length} alumni on record.`}
      />
      <AlumniTable alumni={alumni} canManage={isMessPrefect} />
    </PageContainer>
  )
}
