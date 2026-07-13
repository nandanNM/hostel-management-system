import { getUserBills } from "../_lib/user-detail"
import { LedgerSection } from "../_components/user-section-tables"

export default async function UserOverviewPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const data = await getUserBills(userId)
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Account ledger</h2>
      <LedgerSection data={data} />
    </section>
  )
}
