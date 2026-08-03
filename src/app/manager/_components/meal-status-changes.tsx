"use client"

import { ToggleLeft } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"

import { GetMealStatusChangeLog } from "@/types/prisma.type"
import kyInstance from "@/lib/ky"
import { cn, formatRelativeDate } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader } from "@/components/ui/loader"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { P } from "@/components/custom/p"

export function MealStatusChangesList() {
  const {
    data: logs,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["meal-status-changes", "manager"],
    queryFn: () =>
      kyInstance
        .get("/api/manager/meal/status-changes")
        .json<GetMealStatusChangeLog[]>(),
    refetchOnWindowFocus: false,
    refetchInterval: 30000,
  })

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ToggleLeft className="h-5 w-5" /> Meal On/Off Activity
          </CardTitle>
          <CardDescription>
            Today&apos;s meal status changes by boarders.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader variant="spinner" size={24} />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ToggleLeft className="h-5 w-5" /> Meal On/Off Activity
          </CardTitle>
          <CardDescription>
            Today&apos;s meal status changes by boarders.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <P variant="error">
            {error.message || "Failed to load meal status changes."}
          </P>
        </CardContent>
      </Card>
    )
  }

  const currentLogs = logs || []
  const newData = (log: GetMealStatusChangeLog) =>
    log.newData as { status?: string } | null

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ToggleLeft className="h-5 w-5" /> Meal On/Off Activity
        </CardTitle>
        <CardDescription>
          Today&apos;s meal status changes by boarders.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {currentLogs.length > 0 ? (
          <ScrollArea className="bg-muted/40 h-[300px] rounded-lg border p-2 font-mono">
            <div className="divide-border/60 divide-y pr-2">
              {currentLogs.map((log) => {
                const status = newData(log)?.status
                const isOn = status === "ACTIVE"
                return (
                  <div key={log.id} className="flex items-start gap-3 py-2.5">
                    <span
                      className={cn(
                        "mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full",
                        isOn ? "bg-green-500" : "bg-red-400"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-foreground text-sm font-medium">
                          <span className="text-muted-foreground/70">
                            $&nbsp;
                          </span>
                          {log.user.name}
                        </p>
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                            isOn
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                          )}
                        >
                          Meal {isOn ? "ON" : "OFF"}
                        </span>
                        {log.user.meals?.[0]?.type && (
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                              log.user.meals[0].type === "VEG"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                            )}
                          >
                            {log.user.meals[0].type === "VEG"
                              ? "Veg"
                              : `Non-Veg${log.user.meals[0].nonVegType !== "NONE" ? ` (${log.user.meals[0].nonVegType.toLowerCase()})` : ""}`}
                          </span>
                        )}
                        <span className="text-muted-foreground text-xs">
                          {formatRelativeDate(new Date(log.timestamp))} &bull;{" "}
                          {format(new Date(log.timestamp), "hh:mm a")}
                        </span>
                      </div>
                      <p className="text-muted-foreground pl-4 text-xs">
                        {log.user.email}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        ) : (
          <p className="text-muted-foreground text-center text-sm">
            No meal status changes today.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
