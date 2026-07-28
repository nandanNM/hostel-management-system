"use client"

import { useMemo, useState } from "react"
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import { Search, UserMinus, UserPlus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/data-table/data-table"
import UserAvatar from "@/components/UserAvatar"

import { useSetBillingExclusions } from "../_lib/mutations"

export type BillingBoarder = {
  id: string
  name: string | null
  email: string
  image: string | null
  roomNo: string | null
}

export function BillingExclusionTable({
  year,
  month,
  boarders,
  excludedUserIds,
  disabled,
}: {
  year: number
  month: number
  boarders: BillingBoarder[]
  excludedUserIds: string[]
  disabled: boolean
}) {
  const { mutate, isPending } = useSetBillingExclusions()
  const [excluded, setExcluded] = useState<Set<string>>(
    () => new Set(excludedUserIds)
  )
  const [globalFilter, setGlobalFilter] = useState("")
  const [rowSelection, setRowSelection] = useState({})

  function commit(next: Set<string>) {
    const prev = excluded
    setExcluded(next)
    mutate(
      { year, month, excludedUserIds: [...next] },
      { onError: () => setExcluded(prev) }
    )
  }

  function toggleOne(id: string) {
    const next = new Set(excluded)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    commit(next)
  }

  const columns = useMemo<ColumnDef<BillingBoarder>[]>(() => {
    return [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
            disabled={disabled}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            disabled={disabled}
          />
        ),
        enableSorting: false,
      },
      {
        id: "user",
        header: "Boarder",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <UserAvatar size={28} avatarUrl={row.original.image} />
            <div className="min-w-0">
              <div className="truncate font-medium">
                {row.original.name ?? "Unnamed"}
              </div>
              <div className="text-muted-foreground truncate text-xs">
                {row.original.email}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "room",
        header: "Room",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.roomNo ?? "—"}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const isExcluded = excluded.has(row.original.id)
          return (
            <Badge variant={isExcluded ? "outline" : "default"}>
              {isExcluded ? "Excluded" : "Billed"}
            </Badge>
          )
        },
      },
      {
        id: "action",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => {
          const isExcluded = excluded.has(row.original.id)
          return (
            <div className="text-right">
              <Button
                variant={isExcluded ? "outline" : "ghost"}
                size="sm"
                disabled={disabled || isPending}
                onClick={() => toggleOne(row.original.id)}
              >
                {isExcluded ? (
                  <>
                    <UserPlus className="mr-1 h-4 w-4" /> Restore
                  </>
                ) : (
                  <>
                    <UserMinus className="mr-1 h-4 w-4" /> Exclude
                  </>
                )}
              </Button>
            </div>
          )
        },
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excluded, disabled, isPending])

  const table = useReactTable({
    data: boarders,
    columns,
    state: { globalFilter, rowSelection },
    getRowId: (row) => row.id,
    enableRowSelection: !disabled,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: (row, _columnId, value) => {
      const q = String(value).toLowerCase()
      const b = row.original as BillingBoarder
      return (
        (b.name ?? "").toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        (b.roomNo ?? "").toLowerCase().includes(q)
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  const selectedIds = table
    .getFilteredSelectedRowModel()
    .rows.map((r) => r.original.id)

  function bulkExclude() {
    const next = new Set(excluded)
    selectedIds.forEach((id) => next.add(id))
    commit(next)
    table.resetRowSelection()
  }

  function bulkRestore() {
    const next = new Set(excluded)
    selectedIds.forEach((id) => next.delete(id))
    commit(next)
    table.resetRowSelection()
  }

  const billedCount = boarders.length - excluded.size

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exclude boarders from this cycle</CardTitle>
        <CardDescription>
          Search and remove boarders who ate no meals this month. Excluded
          boarders receive no mess charge and are dropped from the per-head
          split. {billedCount} billed · {excluded.size} excluded.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          table={table}
          totalRows={boarders.length}
          floatingBar={
            !disabled ? (
              <div className="flex flex-wrap items-center gap-2 rounded-md border p-2">
                <span className="text-muted-foreground text-sm">
                  {selectedIds.length} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={bulkExclude}
                >
                  <UserMinus className="mr-1 h-4 w-4" /> Exclude selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={bulkRestore}
                >
                  <UserPlus className="mr-1 h-4 w-4" /> Restore selected
                </Button>
              </div>
            ) : null
          }
        >
          <div className="relative w-full max-w-sm">
            <Search className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
            <Input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search by name, email or room…"
              className="pl-8"
            />
          </div>
        </DataTable>
      </CardContent>
    </Card>
  )
}
