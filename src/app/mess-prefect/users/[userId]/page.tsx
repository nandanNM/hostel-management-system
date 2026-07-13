import { getUserBillingDetail } from "@/app/manager/users/_lib/user-detail"
import { UserDetailView } from "@/app/manager/users/_components/user-detail-view"

export default async function MessPrefectUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const data = await getUserBillingDetail(userId)
  return (
    <div className="p-4 sm:p-6">
      <UserDetailView data={data} backHref="/mess-prefect/users" />
    </div>
  )
}
