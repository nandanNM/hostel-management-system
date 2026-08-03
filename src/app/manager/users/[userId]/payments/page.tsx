import { LedgerSection } from "../../_components/user-section-tables"
import { getUserPayments } from "../../_lib/user-detail"

export default async function UserPaymentsPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const data = await getUserPayments(userId)
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Payments</h2>
      <LedgerSection data={data} />
    </section>
  )
}
