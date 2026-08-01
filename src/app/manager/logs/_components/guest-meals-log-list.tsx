"use client"

import { useState } from "react"
import {
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
  Leaf,
  ForkKnife as UtensilsCrossed,
} from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"
import { addMonths, format, subMonths } from "date-fns"

import { GetGuestMealWithUser } from "@/types/prisma.type"
import { GuestMealStatusType } from "@/lib/generated/prisma"
import kyInstance from "@/lib/ky"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader } from "@/components/ui/loader"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { P } from "@/components/custom/p"

const STATUS_STYLES: Record<GuestMealStatusType, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
  CANCELLED: "bg-muted text-muted-foreground",
  SERVED: "bg-blue-100 text-blue-700",
}

export function GuestMealsLogList() {
  const [refDate, setRefDate] = useState(() => new Date())

  const year = refDate.getFullYear()
  const month = refDate.getMonth() + 1

  const {
    data: meals,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["manager", "guest-meals-log", year, month],
    queryFn: () =>
      kyInstance
        .get(`/api/manager/logs/guest-meals?year=${year}&month=${month}`)
        .json<GetGuestMealWithUser[]>(),
    refetchOnWindowFocus: false,
  })

  // Only APPROVED/SERVED guest meals are actually billed to the user; PENDING,
  // REJECTED and CANCELLED requests must never count toward the charge totals.
  const billedMeals = (meals ?? []).filter(
    (m) => m.status === "APPROVED" || m.status === "SERVED"
  )
  const totalMeals = billedMeals.reduce((s, m) => s + m.numberOfMeals, 0)
  const totalCharge = billedMeals.reduce((s, m) => s + m.mealCharge, 0)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5" />
          Guest Meal Logs
        </CardTitle>
        <CardDescription>
          All guest meal requests and their billing status for the month.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Month navigator */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setRefDate((d) => subMonths(d, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[120px] text-center text-sm font-semibold">
            {format(refDate, "MMMM yyyy")}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setRefDate((d) => addMonths(d, 1))}
            disabled={
              year === new Date().getFullYear() &&
              month === new Date().getMonth() + 1
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader variant="comet" size={24} />
          </div>
        )}

        {isError && (
          <P variant="error">
            {error?.message ?? "Failed to load guest meals."}
          </P>
        )}

        {!isLoading && !isError && (
          <>
            {/* Summary */}
            <div className="flex flex-wrap gap-4 rounded-lg border px-4 py-3 text-sm">
              <span>
                <span className="text-muted-foreground">Total requests: </span>
                <span className="font-semibold">{meals?.length ?? 0}</span>
              </span>
              <span>
                <span className="text-muted-foreground">Billed meals: </span>
                <span className="font-semibold">{totalMeals}</span>
              </span>
              <span>
                <span className="text-muted-foreground">Billed charges: </span>
                <span className="font-semibold">₹{totalCharge.toFixed(2)}</span>
              </span>
            </div>

            {meals && meals.length > 0 ? (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Meal Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Charge</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {meals.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {m.user?.name ?? "Unknown"}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {m.user?.email}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(m.date), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-sm capitalize">
                          {m.mealTime.toLowerCase()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            {m.type === "VEG" ? (
                              <Leaf className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <UtensilsCrossed className="h-3.5 w-3.5 text-orange-500" />
                            )}
                            <span className="capitalize">
                              {m.type === "VEG"
                                ? "Veg"
                                : m.nonVegType !== "NONE"
                                  ? m.nonVegType.charAt(0) +
                                    m.nonVegType.slice(1).toLowerCase()
                                  : "Non-Veg"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {m.numberOfMeals}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{m.mealCharge.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold",
                              STATUS_STYLES[m.status]
                            )}
                          >
                            {m.status.charAt(0) +
                              m.status.slice(1).toLowerCase()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground py-6 text-center text-sm">
                No guest meals for {format(refDate, "MMMM yyyy")}.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
