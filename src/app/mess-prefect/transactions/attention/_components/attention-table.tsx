"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import type { DataTableFilterField } from "@/types"
import { PaperPlaneTilt } from "@phosphor-icons/react"
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs"

import { toast } from "@/lib/toast"
import { useDataTable } from "@/hooks/use-data-table"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"

import { getAttentionRows, sendDuesReminders } from "../_lib/actions"
import {
  AGEING_OPTIONS,
  type AttentionRow,
  type AttentionType,
} from "../_lib/validations"
import { getColumns } from "./attention-columns"

interface AttentionTableProps {
  rowsPromise: ReturnType<typeof getAttentionRows>
  type: AttentionType
}

export function AttentionTable({ rowsPromise, type }: AttentionTableProps) {
  const { data, pageCount, totalRows } = React.use(rowsPromise)
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  const columns = React.useMemo(() => getColumns(type), [type])

  // The ageing filter drives a server query, so this update must reach the
  // server: shallow false, unlike the table's own client-side state.
  const [{ days }, setAgeing] = useQueryStates(
    { days: parseAsString, page: parseAsInteger },
    { shallow: false, history: "push" }
  )

  const filterFields: DataTableFilterField<AttentionRow>[] = [
    {
      label: "Boarder",
      value: "name",
      placeholder: "Search name or email...",
    },
  ]

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    filterFields,
    // Selection is keyed by boarder, so ticking someone on page 1 still means
    // that boarder after the server swaps in page 2.
    getRowId: (row) => row.userId,
    state: { sorting: [{ id: "amount", desc: true }] },
  })

  const selectedIds = Object.keys(table.getState().rowSelection).filter(
    (id) => table.getState().rowSelection[id]
  )

  function handleSend() {
    startTransition(async () => {
      const res = await sendDuesReminders({ userIds: selectedIds, type })

      if (res.status === "success") {
        toast.success(res.message)
        table.resetRowSelection()
        router.refresh()
      } else {
        toast.error(res.message)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select
          value={String(days ?? "0")}
          onValueChange={(value) => {
            // Back to page 1: page 3 of "any age" is rarely page 3 of "30+".
            void setAgeing({ days: value === "0" ? null : value, page: 1 })
          }}
        >
          <SelectTrigger size="sm" className="h-9 w-47.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AGEING_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          size="sm"
          disabled={selectedIds.length === 0 || isPending}
          onClick={handleSend}
        >
          <PaperPlaneTilt className="size-4" />
          {isPending
            ? "Sending…"
            : selectedIds.length > 0
              ? `Remind ${selectedIds.length} selected`
              : "Remind selected"}
        </Button>
      </div>

      <DataTable table={table} totalRows={totalRows}>
        <DataTableToolbar table={table} filterFields={filterFields} />
      </DataTable>
    </div>
  )
}
