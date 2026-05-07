"use client"

import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { Loader2, ToggleLeft } from "lucide-react"

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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
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
          <Loader2 className="size-6 animate-spin" />
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
        <ScrollArea
          className={currentLogs.length > 0 ? "h-[300px]" : "h-auto"}
        >
          <div className="space-y-4 pr-4">
            {currentLogs.length > 0 ? (
              currentLogs.map((log, index) => {
                const status = newData(log)?.status
                const isOn = status === "ACTIVE"
                return (
                  <div key={log.id}>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 shrink-0">
                        <span
                          className={cn(
                            "inline-block h-2.5 w-2.5 rounded-full",
                            isOn ? "bg-green-500" : "bg-red-400"
                          )}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <p className="text-foreground text-sm font-medium">
                            {log.user.name}
                          </p>
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                              isOn
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-600"
                            )}
                          >
                            Meal {isOn ? "ON" : "OFF"}
                          </span>
                          {log.user.meals?.[0]?.type && (
                            <span
                              className={cn(
                                "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                                log.user.meals[0].type === "VEG"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-orange-100 text-orange-700"
                              )}
                            >
                              {log.user.meals[0].type === "VEG"
                                ? "Veg"
                                : `Non-Veg${log.user.meals[0].nonVegType !== "NONE" ? ` (${log.user.meals[0].nonVegType.toLowerCase()})` : ""}`}
                            </span>
                          )}
                          <span className="text-muted-foreground text-xs">
                            {formatRelativeDate(new Date(log.timestamp))}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            &bull;{" "}
                            {format(new Date(log.timestamp), "hh:mm a")}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {log.user.email}
                        </p>
                      </div>
                    </div>
                    {index < currentLogs.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                )
              })
            ) : (
              <p className="text-muted-foreground text-center text-sm">
                No meal status changes today.
              </p>
            )}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
