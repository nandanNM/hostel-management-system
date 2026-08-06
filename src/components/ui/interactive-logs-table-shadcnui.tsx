"use client"

import { useMemo, useState } from "react"
import {
  CaretDown,
  Check,
  Funnel,
  MagnifyingGlass,
} from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { AnimatePresence, motion } from "motion/react"

import type { GetActivityLogWithUser } from "@/types/prisma.type"
import kyInstance from "@/lib/ky"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader } from "@/components/ui/loader"

type Level = "info" | "warning" | "error"

type Filters = {
  level: string[]
  action: string[]
}

const ACTION_LABELS: Record<string, string> = {
  MEAL_STATUS_CHANGE: "Meal Toggle",
  MEAL_COUNT_GENERATED: "Meal Count",
  CREATE: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted",
  FINE_ISSUED: "Fine Issued",
  PAYMENT: "Payment",
  PAYMENT_RECORDED: "Payment",
}

const DAY_OPTIONS = [
  { label: "Today", value: "1" },
  { label: "7 days", value: "7" },
  { label: "30 days", value: "30" },
  { label: "90 days", value: "90" },
]

const LEVEL_STYLES: Record<Level, string> = {
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  warning: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  error: "bg-red-500/10 text-red-600 dark:text-red-400",
}

function levelOf(actionType: string): Level {
  const a = actionType.toUpperCase()
  if (/DELETE|FINE|DUE|TERMINAT|SUSPEND|FAIL/.test(a)) return "error"
  if (/UPDATE|WARN|EXCLU/.test(a)) return "warning"
  return "info"
}

function prettyAction(actionType: string): string {
  return (
    ACTION_LABELS[actionType] ??
    actionType
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

function summarize(data: unknown): string | null {
  if (data === null || data === undefined) return null
  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>)
    if (entries.length === 0) return null
    return entries.map(([k, v]) => `${k}: ${String(v)}`).join(", ")
  }
  return String(data)
}

function LogRow({
  log,
  expanded,
  onToggle,
}: {
  log: GetActivityLogWithUser
  expanded: boolean
  onToggle: () => void
}) {
  const level = levelOf(log.actionType)
  const time = format(new Date(log.timestamp), "HH:mm:ss")
  const before = summarize(log.oldData)
  const after = summarize(log.newData)

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="hover:bg-muted/50 active:bg-muted/70 w-full p-3 text-left transition-colors"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0"
          >
            <CaretDown className="text-muted-foreground h-4 w-4" />
          </motion.div>

          <Badge
            variant="secondary"
            className={cn("shrink-0 capitalize", LEVEL_STYLES[level])}
          >
            {level}
          </Badge>

          <time className="text-muted-foreground w-20 shrink-0 font-mono text-xs">
            {time}
          </time>

          <span className="text-foreground min-w-max shrink-0 text-sm font-medium">
            {prettyAction(log.actionType)}
          </span>

          <p className="text-muted-foreground flex-1 truncate text-sm">
            {log.details ??
              `${log.actionType} on ${log.entityType ?? "System"}`}
          </p>

          <span className="text-muted-foreground hidden w-32 shrink-0 truncate text-right text-xs sm:block">
            {log.user.name ?? log.user.email}
          </span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-border bg-muted/50 overflow-hidden border-t"
          >
            <div className="space-y-4 p-4">
              {log.details && (
                <div>
                  <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                    Details
                  </p>
                  <p className="bg-background text-foreground rounded p-3 font-mono text-sm">
                    {log.details}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                    By
                  </p>
                  <p className="text-foreground font-mono text-xs">
                    {log.user.name ?? "Unknown"} · {log.user.email}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                    Timestamp
                  </p>
                  <p className="text-foreground font-mono text-xs">
                    {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                  </p>
                </div>
              </div>

              {(before || after) && (
                <div>
                  <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                    Change
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {before && (
                      <span className="bg-background rounded px-2 py-1 line-through opacity-70">
                        {before}
                      </span>
                    )}
                    {after && (
                      <span className="bg-background text-foreground rounded px-2 py-1 font-medium">
                        {after}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {log.entityType && (
                <div>
                  <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                    Entity
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      {log.entityType}
                    </Badge>
                    {log.entityId && (
                      <Badge variant="outline" className="text-xs">
                        {log.entityId}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function FilterPanel({
  filters,
  onChange,
  levels,
  actions,
}: {
  filters: Filters
  onChange: (filters: Filters) => void
  levels: string[]
  actions: string[]
}) {
  const toggle = (category: keyof Filters, value: string) => {
    const current = filters[category]
    const updated = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value]
    onChange({ ...filters, [category]: updated })
  }

  const hasActive = filters.level.length > 0 || filters.action.length > 0

  const group = (
    title: string,
    category: keyof Filters,
    values: string[],
    label: (v: string) => string
  ) => (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {title}
      </p>
      <div className="space-y-2">
        {values.map((value) => {
          const selected = filters[category].includes(value)
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggle(category, value)}
              aria-pressed={selected}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/40"
              )}
            >
              <span className="truncate">{label(value)}</span>
              {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="bg-card flex h-full flex-col space-y-6 overflow-y-auto p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-sm font-semibold">Filters</h3>
        {hasActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange({ level: [], action: [] })}
            className="h-6 text-xs"
          >
            Clear
          </Button>
        )}
      </div>
      {group("Level", "level", levels, (v) => v)}
      {group("Action", "action", actions, prettyAction)}
    </div>
  )
}

export function InteractiveLogsTable({
  endpoint = "/api/manager/logs/activity",
}: {
  endpoint?: string
}) {
  const [days, setDays] = useState("7")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({ level: [], action: [] })

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["activity-logs", "explorer", endpoint, days],
    queryFn: () =>
      kyInstance
        .get(`${endpoint}?days=${days}`)
        .json<GetActivityLogWithUser[]>(),
    refetchOnWindowFocus: false,
  })

  const logs = useMemo(() => data ?? [], [data])
  const levels = useMemo(
    () => Array.from(new Set(logs.map((log) => levelOf(log.actionType)))),
    [logs]
  )
  const actions = useMemo(
    () => Array.from(new Set(logs.map((log) => log.actionType))),
    [logs]
  )

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return logs.filter((log) => {
      const matchSearch =
        !q ||
        (log.details ?? "").toLowerCase().includes(q) ||
        log.actionType.toLowerCase().includes(q) ||
        (log.user.name ?? "").toLowerCase().includes(q) ||
        log.user.email.toLowerCase().includes(q)
      const matchLevel =
        filters.level.length === 0 ||
        filters.level.includes(levelOf(log.actionType))
      const matchAction =
        filters.action.length === 0 || filters.action.includes(log.actionType)
      return matchSearch && matchLevel && matchAction
    })
  }, [logs, searchQuery, filters])

  const activeFilters = filters.level.length + filters.action.length

  return (
    <div className="bg-card flex h-[75vh] w-full flex-col overflow-hidden rounded-xl border">
      <div className="border-border space-y-4 border-b p-4 sm:p-6">
        <div>
          <h1 className="text-foreground text-xl font-semibold">
            Activity Logs
          </h1>
          <p className="text-muted-foreground text-sm">
            {filtered.length} of {logs.length} records
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-48 flex-1">
            <MagnifyingGlass className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search by details, action, or user…"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-9 pl-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-1 rounded-md border p-0.5">
            {DAY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDays(option.value)}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  days === option.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters((current) => !current)}
            className="relative"
          >
            <Funnel className="h-4 w-4" />
            {activeFilters > 0 && (
              <Badge className="bg-destructive absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center p-0 text-xs">
                {activeFilters}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <AnimatePresence initial={false}>
          {showFilters && (
            <motion.div
              key="filters"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-border overflow-hidden border-r"
            >
              <FilterPanel
                filters={filters}
                onChange={setFilters}
                levels={levels}
                actions={actions}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex h-full items-center justify-center py-12">
              <Loader variant="spinner" size={24} />
            </div>
          ) : isError ? (
            <p className="text-destructive p-12 text-center text-sm">
              {error instanceof Error ? error.message : "Failed to load logs."}
            </p>
          ) : (
            <div className="divide-border divide-y">
              <AnimatePresence mode="popLayout">
                {filtered.length > 0 ? (
                  filtered.map((log) => (
                    <motion.div
                      key={log.id}
                      layout
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                    >
                      <LogRow
                        log={log}
                        expanded={expandedId === log.id}
                        onToggle={() =>
                          setExpandedId((current) =>
                            current === log.id ? null : log.id
                          )
                        }
                      />
                    </motion.div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <p className="text-muted-foreground">
                      No logs match your filters.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
