"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { Activity, ChevronDown, ChevronUp, Loader2 } from "lucide-react"

import { GetActivityLogWithUser } from "@/types/prisma.type"
import kyInstance from "@/lib/ky"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { P } from "@/components/custom/p"

const ACTION_TYPE_LABELS: Record<string, string> = {
  MEAL_STATUS_CHANGE: "Meal Toggle",
  CREATE: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted",
  FINE_ISSUED: "Fine Issued",
  PAYMENT: "Payment",
}

const ACTION_TYPE_COLORS: Record<string, string> = {
  MEAL_STATUS_CHANGE: "bg-blue-100 text-blue-700",
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-yellow-100 text-yellow-700",
  DELETE: "bg-red-100 text-red-600",
  FINE_ISSUED: "bg-orange-100 text-orange-700",
  PAYMENT: "bg-purple-100 text-purple-700",
}

const DAY_OPTIONS = [
  { label: "Today", value: "1" },
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
]

function DataDiff({ oldData, newData }: { oldData: unknown; newData: unknown }) {
  const [open, setOpen] = useState(false)
  if (!oldData && !newData) return null
  return (
    <div className="mt-2">
      <button
        className="text-muted-foreground flex items-center gap-1 text-xs hover:underline"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {open ? "Hide" : "Show"} data diff
      </button>
      {open && (
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {oldData !== undefined && (
            <div>
              <p className="mb-1 text-xs font-semibold text-red-500">Before</p>
              <pre className="bg-muted rounded p-2 text-[10px] overflow-auto max-h-24">
                {JSON.stringify(oldData, null, 2)}
              </pre>
            </div>
          )}
          {newData !== undefined && (
            <div>
              <p className="mb-1 text-xs font-semibold text-green-600">After</p>
              <pre className="bg-muted rounded p-2 text-[10px] overflow-auto max-h-24">
                {JSON.stringify(newData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ActivityLogsList() {
  const [days, setDays] = useState("7")
  const [actionTypeFilter, setActionTypeFilter] = useState("ALL")

  const { data: logs, isLoading, isError, error } = useQuery({
    queryKey: ["manager", "activity-logs", days],
    queryFn: () =>
      kyInstance
        .get(`/api/manager/logs/activity?days=${days}`)
        .json<GetActivityLogWithUser[]>(),
    refetchOnWindowFocus: false,
  })

  const filtered =
    actionTypeFilter === "ALL"
      ? (logs ?? [])
      : (logs ?? []).filter((l) => l.actionType === actionTypeFilter)

  const uniqueActionTypes = Array.from(
    new Set((logs ?? []).map((l) => l.actionType))
  )

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Logs
        </CardTitle>
        <CardDescription>
          All boarder and system activity records.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              {DAY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Action type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All actions</SelectItem>
              {uniqueActionTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {ACTION_TYPE_LABELS[t] ?? t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}

        {isError && (
          <P variant="error">{error?.message ?? "Failed to load logs."}</P>
        )}

        {!isLoading && !isError && (
          <>
            <p className="text-muted-foreground text-xs">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""} found
            </p>
            <ScrollArea className={filtered.length > 0 ? "h-[520px]" : "h-auto"}>
              <div className="space-y-3 pr-3">
                {filtered.length > 0 ? (
                  filtered.map((log, i) => (
                    <div key={log.id}>
                      <div className="rounded-lg border p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold",
                              ACTION_TYPE_COLORS[log.actionType] ??
                                "bg-gray-100 text-gray-600"
                            )}
                          >
                            {ACTION_TYPE_LABELS[log.actionType] ?? log.actionType}
                          </span>
                          <p className="text-foreground text-sm font-medium">
                            {log.user.name ?? "Unknown"}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {log.user.email}
                          </p>
                          <span className="text-muted-foreground ml-auto text-xs">
                            {format(new Date(log.timestamp), "dd MMM yyyy, hh:mm a")}
                          </span>
                        </div>
                        {log.entityType && (
                          <p className="text-muted-foreground mt-1 text-xs">
                            Entity: {log.entityType}
                            {log.entityId ? ` · ${log.entityId}` : ""}
                          </p>
                        )}
                        {log.details && (
                          <p className="mt-1 text-sm">{log.details}</p>
                        )}
                        <DataDiff
                          oldData={log.oldData}
                          newData={log.newData}
                        />
                      </div>
                      {i < filtered.length - 1 && (
                        <Separator className="mt-3" />
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground py-6 text-center text-sm">
                    No activity logs found for this period.
                  </p>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  )
}
