import { getUserSummary } from "../_lib/user-detail"
import { UserDetailHeader } from "../_components/user-detail-header"

export default async function UserDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const data = await getUserSummary(userId)
  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      <UserDetailHeader data={data} />
      <div>{children}</div>
    </div>
  )
}
