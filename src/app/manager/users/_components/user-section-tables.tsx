"use client"

import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import { format } from "date-fns"

import { formatIST } from "@/lib/date"
import { BillEntryType } from "@/lib/generated/prisma"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { AlumniGuestBadge } from "@/components/AlumniGuestBadge"
import { DataTable } from "@/components/data-table/data-table"

import type {
  FineRow,
  GuestMealRow,
  LedgerRow,
  MealHistoryRow,
} from "../_lib/user-detail"

const TYPE_LABELS: Record<BillEntryType, string> = {
  SECURITY_DEPOSIT: "Security deposit",
  REFUND: "Refund",
  MEAL_CHARGE: "Mess charge",
  FINE_CHARGE: "Fine",
  GUEST_MEAL_CHARGE: "Guest meal",
  PAYMENT: "Payment",
  ADJUSTMENT_CREDIT: "Adjustment credit",
  ADJUSTMENT_DEBIT: "Adjustment debit",
}

function inr(n: number) {
  return `₹${n.toFixed(2)}`
}

function SectionTable<TData>({
  columns,
  data,
}: {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })
  return <DataTable table={table} totalRows={data.length} />
}

const ledgerColumns: ColumnDef<LedgerRow, unknown>[] = [
  {
    id: "type",
    header: "Type",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{TYPE_LABELS[row.original.type]}</div>
        {row.original.description && (
          <div className="text-muted-foreground max-w-64 truncate text-xs">
            {row.original.description}
          </div>
        )}
      </div>
    ),
  },
  {
    id: "date",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">
        {format(new Date(row.original.createdAt), "dd MMM yyyy")}
      </span>
    ),
  },
  {
    id: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => (
      <div
        className={cn(
          "text-right font-medium",
          row.original.amount < 0 ? "text-green-600" : "text-foreground"
        )}
      >
        {row.original.amount < 0 ? "−" : ""}
        {inr(Math.abs(row.original.amount))}
      </div>
    ),
  },
  {
    id: "balance",
    header: () => <div className="text-right">Balance</div>,
    cell: ({ row }) => (
      <div className="text-right">{inr(row.original.balanceRemaining)}</div>
    ),
  },
]

export function LedgerSection({ data }: { data: LedgerRow[] }) {
  return <SectionTable columns={ledgerColumns} data={data} />
}

const guestMealColumns: ColumnDef<GuestMealRow, unknown>[] = [
  {
    id: "name",
    header: "Guest",
    cell: ({ row }) => (
      <span className="flex items-center gap-2 font-medium">
        {row.original.name}
        {row.original.alumniId && <AlumniGuestBadge showLabel={false} />}
      </span>
    ),
  },
  {
    id: "date",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">
        {formatIST(row.original.date, "dd MMM yyyy")}
      </span>
    ),
  },
  {
    id: "qty",
    header: () => <div className="text-center">Qty</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.original.numberOfMeals}</div>
    ),
  },
  {
    id: "charge",
    header: () => <div className="text-right">Charge</div>,
    cell: ({ row }) => (
      <div className="text-right">{inr(row.original.mealCharge)}</div>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.original.status.toLowerCase()}
      </Badge>
    ),
  },
]

export function GuestMealsSection({ data }: { data: GuestMealRow[] }) {
  return <SectionTable columns={guestMealColumns} data={data} />
}

const fineColumns: ColumnDef<FineRow, unknown>[] = [
  {
    id: "reason",
    header: "Reason",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.reason}</span>
    ),
  },
  {
    id: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => (
      <div className="text-right">{inr(row.original.amount)}</div>
    ),
  },
  {
    id: "due",
    header: "Due",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">
        {row.original.dueDate
          ? format(new Date(row.original.dueDate), "dd MMM yyyy")
          : "—"}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.original.status.toLowerCase()}
      </Badge>
    ),
  },
]

export function FinesSection({ data }: { data: FineRow[] }) {
  return <SectionTable columns={fineColumns} data={data} />
}

const mealColumns: ColumnDef<MealHistoryRow, unknown>[] = [
  {
    id: "change",
    header: "Change",
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.details ?? "Meal status changed"}
      </span>
    ),
  },
  {
    id: "when",
    header: () => <div className="text-right">When</div>,
    cell: ({ row }) => (
      <div className="text-muted-foreground text-right text-xs">
        {format(new Date(row.original.timestamp), "dd MMM yyyy, p")}
      </div>
    ),
  },
]

export function MealsSection({ data }: { data: MealHistoryRow[] }) {
  return <SectionTable columns={mealColumns} data={data} />
}
