import { unstable_noStore as noStore } from "next/cache"
import { GraduationCap } from "lucide-react"

import { canManage } from "@/lib/authz"
import prisma from "@/lib/prisma"
import { requireUser } from "@/lib/require-user"

import { AlumniTable } from "./_components/alumni-table"

export default async function AlumniPage() {
  noStore()
  const session = await requireUser()
  const isManager = canManage(session.user.role)

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
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alumni</h1>
          <p className="text-muted-foreground mt-1">
            Former boarders — {alumni.length} alumni on record.
          </p>
        </div>
      </div>

      <AlumniTable alumni={alumni} canManage={isManager} />
    </div>
  )
}
