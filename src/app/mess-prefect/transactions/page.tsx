import type { Metadata } from "next"
import { SearchParams } from "@/types"
import { Wallet } from "@phosphor-icons/react/ssr"
import { format } from "date-fns"

import { formatIST } from "@/lib/date"
import { BillEntryType } from "@/lib/generated/prisma"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LeaderboardCard } from "@/components/ui/leaderboard-card"
import { SegmentedBar } from "@/components/ui/segmented-bar"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageContainer, PageHeader } from "@/components/page-container"
import { Badge } from "@/components/reui/badge"

import { DailyFlowChart } from "./_components/daily-flow-chart"
import { KpiSparkCard } from "./_components/kpi-spark-card"
import { MonthlyBillChart } from "./_components/monthly-bill-chart"
import { NeedsAttention } from "./_components/needs-attention"
import { SpendBreakdownChart } from "./_components/spend-breakdown-chart"
import { RangeStat } from "./_components/stat-cards"
import { TransactionsRangeFilter } from "./_components/transactions-range-filter"
import { getTransactionsOverview } from "./_lib/actions"
import { searchParamsSchema } from "./_lib/validations"

export const metadata: Metadata = {
  title: "Transactions",
  description: "A financial overview of every boarder's charges and payments.",
}

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

function formatMoney(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
}

function formatMoneyShort(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
}

function initials(name: string | null) {
  if (!name) return "B"
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

const TYPE_VARIANT: Partial<Record<BillEntryType, BadgeVariant>> = {
  PAYMENT: "success-light",
  REFUND: "success-light",
  ADJUSTMENT_CREDIT: "success-light",
  MEAL_CHARGE: "primary-light",
  GUEST_MEAL_CHARGE: "info-light",
  FINE_CHARGE: "destructive-light",
  SECURITY_DEPOSIT: "warning-light",
  ADJUSTMENT_DEBIT: "warning-light",
}

/** Keeps the mix bar in step with the breakdown pie. */
const MIX_COLORS: Record<string, string> = {
  meal: "bg-amber-500",
  guest: "bg-blue-500",
  fine: "bg-red-500",
  other: "bg-gray-500",
}

type Kpi = {
  title: string
  metric: string
  baseValue: string
  baseLabel: string
  targetValue: string
  targetLabel: string
  data: { value: number }[]
  color: string
}

interface TransactionsPageProps {
  searchParams: Promise<SearchParams>
}

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const resolved = await searchParams
  const search = searchParamsSchema.parse(resolved)
  const data = await getTransactionsOverview(search)

  const {
    totalCharges,
    totalCollected,
    totalOutstanding,
    totalFines,
    breakdown,
    monthly,
    period,
    range,
    series,
    granularity,
    sparklines,
    leaderboard,
    duesSpan,
    rangeMix,
    boarders,
    attention,
    guestMeals,
    fineSummary,
    recent,
  } = data

  const collectedPct =
    totalCharges > 0
      ? Math.min(100, Math.round((totalCollected / totalCharges) * 100))
      : 0

  // Drop the year on the left only when both ends share it, otherwise a
  // 12-month window reads as "06 Sep – 05 Sep 2026" and looks inverted.
  const sameYear =
    formatIST(period.from, "yyyy") === formatIST(period.to, "yyyy")
  const periodLabel = `${formatIST(
    period.from,
    sameYear ? "dd MMM" : "dd MMM yyyy"
  )} – ${formatIST(period.to, "dd MMM yyyy")}`
  const shortPeriod = period.label.replace(/^Last /, "")

  const kpis: Kpi[] = [
    {
      title: "Total Costing",
      metric: "All charges to date",
      baseValue: formatMoneyShort(totalCharges),
      baseLabel: "Total",
      targetValue: formatMoneyShort(range.billed),
      targetLabel: shortPeriod,
      data: sparklines.charges,
      color: "var(--color-amber-500)",
    },
    {
      title: "Total Collected",
      metric: "Payments received",
      baseValue: formatMoneyShort(totalCollected),
      baseLabel: "Total",
      targetValue: formatMoneyShort(range.collected),
      targetLabel: shortPeriod,
      data: sparklines.collected,
      color: "var(--color-emerald-500)",
    },
    {
      title: "Pending Dues",
      metric: "Outstanding balance",
      baseValue: formatMoneyShort(totalOutstanding),
      baseLabel: "Now",
      targetValue: formatMoneyShort(range.billed - range.collected),
      targetLabel: `Net ${shortPeriod}`,
      data: sparklines.dues,
      color: "var(--color-red-500)",
    },
    {
      title: "Total Fines",
      // Not "x collected": that read `isPaid`, which nothing in the app ever
      // sets, so it was permanently ₹0 no matter how much had been settled.
      metric: "Penalties charged",
      baseValue: formatMoneyShort(totalFines),
      baseLabel: "Total",
      targetValue: formatMoneyShort(range.fines),
      targetLabel: shortPeriod,
      data: sparklines.fines,
      color: "var(--color-blue-500)",
    },
  ]

  const settledBoarders = Math.max(0, boarders.active - boarders.withDues)

  return (
    <PageContainer className="flex-1 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          icon={Wallet}
          title="Transactions"
          description="A financial overview of every boarder's charges and payments."
        />
        <TransactionsRangeFilter
          preset={period.preset}
          from={search.from}
          to={search.to}
          rangeLabel={periodLabel}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiSparkCard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="min-w-0 gap-0 overflow-hidden py-0 lg:col-span-2">
          <div className="divide-border grid grid-cols-2 divide-x border-b sm:grid-cols-3">
            <RangeStat
              label="Collected"
              value={formatMoneyShort(range.collected)}
              delta={range.deltas.collected}
            />
            <RangeStat
              label="Collection rate"
              value={`${range.collectionRate.toFixed(1)}%`}
              delta={range.deltas.collectionRate}
            />
            <RangeStat
              label="Transactions"
              value={range.transactions.toLocaleString("en-IN")}
              delta={range.deltas.transactions}
              className="col-span-2 border-t sm:col-span-1 sm:border-t-0"
            />
          </div>
          <CardContent className="min-w-0 overflow-hidden p-4">
            <DailyFlowChart
              data={series}
              total={range.billed}
              delta={range.deltas.billed}
              periodLabel={period.label}
              granularity={granularity}
            />
          </CardContent>
        </Card>

        {/* self-start: grid items stretch by default, and the daily-flow card
            beside this one is ~3x taller. With one name per metric instead of
            a five-row list there is nothing left to fill that height, so the
            card was drawing its border around 300px of nothing. Hug the
            content and let the row height stay the chart's business. */}
        <Card className="min-w-0 gap-3 lg:self-start">
          <CardHeader>
            <CardTitle className="text-base">Guest meals &amp; fines</CardTitle>
            <p className="text-muted-foreground text-sm">
              All time &middot; {guestMeals.pending} awaiting review
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* The two charge types the prefect actually levies, side by side.
                No paid/unpaid bar: nothing sets `isPaid`, so it only ever
                relabelled the whole total as unpaid. */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  key: "guest",
                  label: "Guest meals",
                  caption: "Most requested by",
                  total: guestMeals.revenue,
                  count: guestMeals.count,
                  top: guestMeals.top,
                  empty: "No guest meals charged yet.",
                },
                {
                  key: "fine",
                  label: "Fines",
                  caption: "Most fined",
                  total: fineSummary.total,
                  count: fineSummary.count,
                  top: fineSummary.top,
                  empty: "No fines issued yet.",
                },
              ].map((col) => (
                <div key={col.key} className="min-w-0 space-y-3">
                  {/* Label and volume on separate lines: the columns are a
                      third of a card wide, and "Guest meals · 313 charges" on
                      one line truncated to "313 char…". */}
                  <div className="min-w-0">
                    <p className="truncate text-2xl font-bold tracking-tight tabular-nums">
                      {formatMoney(col.total)}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {col.label}
                    </p>
                    <p className="text-muted-foreground truncate text-xs tabular-nums">
                      {col.count} charge{col.count === 1 ? "" : "s"}
                    </p>
                  </div>

                  <Separator />

                  <div className="min-w-0">
                    <p className="text-muted-foreground mb-2 truncate text-xs font-medium">
                      {col.caption}
                    </p>
                    {col.top ? (
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar size="sm">
                          <AvatarImage
                            src={col.top.image ?? undefined}
                            alt={col.top.name}
                          />
                          <AvatarFallback>
                            {initials(col.top.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {col.top.name}
                          </p>
                          <p className="text-muted-foreground truncate text-xs tabular-nums">
                            {formatMoneyShort(col.top.amount)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-xs">
                        {col.empty}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bar, pie and the short action list share one row (≈58/25/17) and
          stretch to a common height. */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="min-w-0 gap-0 overflow-hidden py-0 lg:col-span-7">
          <CardContent className="min-w-0 flex-1 overflow-hidden p-0">
            <MonthlyBillChart data={monthly} />
          </CardContent>
        </Card>

        <Card className="min-w-0 gap-3 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Charges breakdown</CardTitle>
            <p className="text-muted-foreground text-sm">All time</p>
          </CardHeader>
          <CardContent className="flex min-w-0 flex-1 items-center overflow-hidden">
            <SpendBreakdownChart data={breakdown} />
          </CardContent>
        </Card>

        <Card className="min-w-0 gap-3 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Needs attention</CardTitle>
          </CardHeader>
          <CardContent>
            <NeedsAttention {...attention} />
          </CardContent>
        </Card>
      </div>

      {/* The three short cards share one row, so no column is left
          padding itself out beside a taller neighbour. */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="min-w-0 gap-3">
          <CardHeader>
            <CardTitle className="text-base">Charge mix</CardTitle>
            <p className="text-muted-foreground text-sm">
              {formatMoneyShort(range.billed)} billed &middot; {periodLabel}
            </p>
          </CardHeader>
          <CardContent>
            <SegmentedBar
              segments={rangeMix.map((slice) => ({
                key: slice.category,
                label: slice.label,
                value: slice.amount,
                className: MIX_COLORS[slice.category],
              }))}
              formatValue={formatMoneyShort}
              emptyLabel="No charges raised in this period."
            />
          </CardContent>
        </Card>

        <Card className="min-w-0 gap-3">
          <CardHeader>
            <CardTitle className="text-base">Collection progress</CardTitle>
            <p className="text-muted-foreground text-sm">All time</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-muted-foreground text-sm">
                  Collected of total
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {collectedPct}%
                </span>
              </div>
              <div className="bg-muted h-2.5 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${collectedPct}%` }}
                />
              </div>
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Total costing</dt>
                <dd className="font-medium tabular-nums">
                  {formatMoney(totalCharges)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Total collected</dt>
                <dd className="font-medium text-green-600 tabular-nums dark:text-green-400">
                  {formatMoney(totalCollected)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <dt className="font-medium">Pending dues</dt>
                <dd
                  className={cn(
                    "font-bold tabular-nums",
                    totalOutstanding > 0 ? "text-red-600 dark:text-red-400" : ""
                  )}
                >
                  {formatMoney(totalOutstanding)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="min-w-0 gap-3">
          <CardHeader>
            <CardTitle className="text-base">Active boarders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl font-bold tracking-tight tabular-nums">
              {boarders.active.toLocaleString("en-IN")}
            </p>
            <SegmentedBar
              showTicks={false}
              segments={[
                {
                  key: "dues",
                  label: "With dues",
                  value: boarders.withDues,
                  className: "bg-red-500",
                },
                {
                  key: "settled",
                  label: "Settled",
                  value: settledBoarders,
                  className: "bg-green-600",
                },
              ]}
              formatValue={(value) => value.toLocaleString("en-IN")}
              emptyLabel="No active boarders yet."
            />
          </CardContent>
        </Card>
      </div>

      {/* Default stretch (no items-start) keeps both cards the same height. */}
      <div className="grid gap-6 lg:grid-cols-3">
        <LeaderboardCard
          className="min-w-0"
          title="Highest outstanding dues"
          fromDate={duesSpan.from}
          toDate={duesSpan.to}
          podiumRankings={leaderboard.slice(0, 3)}
          rankings={leaderboard}
        />

        <Card className="min-w-0 gap-3 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent transactions</CardTitle>
            <p className="text-muted-foreground text-sm">{periodLabel}</p>
          </CardHeader>
          <CardContent className="min-w-0">
            {recent.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No transactions in this period.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Boarder</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recent.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar size="sm">
                              <AvatarImage
                                src={tx.userImage ?? undefined}
                                alt={tx.userName ?? "Boarder"}
                              />
                              <AvatarFallback>
                                {initials(tx.userName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {tx.userName ?? "Boarder"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={TYPE_VARIANT[tx.type] ?? "secondary"}
                            size="sm"
                          >
                            {tx.type.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                          {format(new Date(tx.issueDate), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-mono font-semibold tabular-nums",
                            tx.amount > 0
                              ? "text-destructive"
                              : "text-green-600 dark:text-green-400"
                          )}
                        >
                          {tx.amount > 0 ? "+" : "−"}
                          {formatMoney(Math.abs(tx.amount))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
