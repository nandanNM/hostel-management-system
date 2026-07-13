import { getUserBillingDetail } from "../_lib/user-detail"
import { UserDetailView } from "../_components/user-detail-view"

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const data = await getUserBillingDetail(userId)
  return (
    <div className="p-4 sm:p-6">
      <UserDetailView data={data} backHref="/manager/users" />
    </div>
  )
}
