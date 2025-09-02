"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { format, isSameDay } from "date-fns"
import { toast } from "sonner"

import type { GetUsersWithMeal } from "@/types/prisma.type"
import kyInstance from "@/lib/ky"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CalendarBody,
  CalendarDate,
  CalendarDatePagination,
  CalendarDatePicker,
  CalendarHeader,
  CalendarItem,
  CalendarMonthPicker,
  CalendarProvider,
  CalendarYearPicker,
  Feature,
  useCalendarMonth,
  useCalendarYear,
} from "@/components/calendar"

import { ResidentAttendanceTable } from "./_components/resident-attendance-table"
import { transformAttendanceToMeals } from "./_lib/utils"

export default function HostelManagementPage() {
  const [month] = useCalendarMonth()
  const [year] = useCalendarYear()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const {
    data: attendanceSummary,
    isLoading: isAttendanceLoading,
    isError: isAttendanceError,
    error: attendanceError,
  } = useQuery({
    queryKey: ["attendance-summary", "manager", month + 1, year],
    queryFn: async () => {
      // console.log(
      //   `Fetching attendance summary for month: ${month + 1}, year: ${year}`
      // )
      return await kyInstance
        .get(
          `/api/manager/meal/attendance-summary?month=${month + 1}&year=${year}`
        )
        .json<AttendanceSummaryResponse>()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: month != null && year != null,
  })

  const {
    data: residents,
    isLoading: isResidentsLoading,
    isError: isResidentsError,
    error: residentsError,
  } = useQuery({
    queryKey: ["residents", "manager"],
    queryFn: async () =>
      await kyInstance.get("/api/manager/users").json<GetUsersWithMeal[]>(),
    refetchOnWindowFocus: false,
  })

  // toast errors
  if (isAttendanceError && attendanceError) {
    toast.error(`Failed to load meal summary: ${attendanceError.message}`)
  }
  if (isResidentsError && residentsError) {
    toast.error(`Failed to load residents data: ${residentsError.message}`)
  }

  // Transform attendance summary into calendar features
  const mealData = useMemo(
    () => transformAttendanceToMeals(attendanceSummary || {}),
    [attendanceSummary]
  )

  const selectedDateMeals = useMemo(() => {
    if (!selectedDate) return []
    // console.log(
    //   `Recalculating selectedDateMeals for: ${selectedDate?.toDateString()}`
    // )
    return mealData.filter((meal) =>
      isSameDay(new Date(meal.endAt), selectedDate)
    )
  }, [selectedDate, mealData])

  // Determine present residents for the selected date based on fetched data
  const selectedDateAttendance = useMemo<SelectedDateAttendance>(() => {
    if (!selectedDate || !residents || !attendanceSummary)
      return { lunch: [], dinner: [] }

    // console.log(
    //   `Recalculating selectedDateAttendance for: ${selectedDate?.toDateString()}`
    // )
    const dateKey = format(selectedDate, "yyyy-MM-dd")
    const dailyAttendance = attendanceSummary[dateKey] || {
      lunch: [],
      dinner: [],
    }

    const presentLunchResidents = residents.filter((resident) =>
      dailyAttendance.lunch.includes(resident.id)
    )
    const presentDinnerResidents = residents.filter((resident) =>
      dailyAttendance.dinner.includes(resident.id)
    )

    return {
      lunch: presentLunchResidents,
      dinner: presentDinnerResidents,
    }
  }, [selectedDate, attendanceSummary, residents])

  // Calculate total UNIQUE present residents for the selected date
  const totalPresentToday = useMemo(() => {
    if (!selectedDate) return 0
    const uniquePresentIds = new Set([
      ...selectedDateAttendance.lunch.map((r) => r.id),
      ...selectedDateAttendance.dinner.map((r) => r.id),
    ])
    return uniquePresentIds.size
  }, [selectedDate, selectedDateAttendance])

  return (
    <div className="container mx-auto max-w-7xl p-3 md:p-6">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">
          Hostel Management System
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Track daily meals and resident attendance
        </p>
      </div>
      <CalendarAndDetails
        residents={residents}
        isResidentsLoading={isResidentsLoading}
        attendanceSummary={attendanceSummary}
        isAttendanceLoading={isAttendanceLoading}
        mealData={mealData}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedDateMeals={selectedDateMeals}
        totalPresentToday={totalPresentToday}
      />

      {/* Resident Attendance Table - Rendered below the CalendarAndDetails component */}
      <div className="mt-6 md:mt-8">
        <Card className="gap-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">
              {selectedDate
                ? `Resident Attendance for ${format(selectedDate, "MMM dd, yyyy")}`
                : "Resident Attendance"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              <ResidentAttendanceTable
                allResidents={residents}
                selectedDateAttendance={selectedDateAttendance}
                isLoading={isResidentsLoading || isAttendanceLoading}
              />
            ) : (
              <div className="text-muted-foreground text-center text-sm">
                Select a date in the calendar above to view attendance details.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

type AttendanceSummaryResponse = Record<
  string,
  {
    lunch: string[]
    dinner: string[]
  }
>
type SelectedDateAttendance = {
  lunch: GetUsersWithMeal[]
  dinner: GetUsersWithMeal[]
}

const CalendarAndDetails = ({
  residents,
  isResidentsLoading,
  attendanceSummary,
  isAttendanceLoading,
  mealData,
  selectedDate,
  setSelectedDate,
  selectedDateMeals,
  totalPresentToday,
}: {
  residents: GetUsersWithMeal[] | undefined
  isResidentsLoading: boolean
  attendanceSummary: AttendanceSummaryResponse | undefined
  isAttendanceLoading: boolean
  mealData: Feature[]
  selectedDate: Date | null
  setSelectedDate: (date: Date) => void
  selectedDateMeals: Feature[]
  totalPresentToday: number
}) => {
  if (isAttendanceLoading && !attendanceSummary) {
  }
  if (isResidentsLoading && !residents) {
    //loading toast
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-3">
        {/* Calendar Section */}
        <div className="xl:col-span-2">
          <Card className="gap-3">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg md:text-xl">
                Hostel Meal Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 md:p-6">
              <CalendarProvider className="min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
                <CalendarDate>
                  <CalendarDatePicker className="flex-wrap gap-2">
                    <CalendarMonthPicker className="w-32 md:w-40" />
                    <CalendarYearPicker
                      start={2020}
                      end={2030}
                      className="w-24 md:w-32"
                    />
                  </CalendarDatePicker>
                  <CalendarDatePagination />
                </CalendarDate>
                <CalendarHeader className="hidden sm:grid" />
                <div className="grid grid-cols-7 sm:hidden">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                    <div
                      key={index}
                      className="text-muted-foreground p-2 text-center text-xs font-medium"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <CalendarBody
                  features={mealData}
                  onDateSelect={setSelectedDate}
                >
                  {({ feature }) => (
                    <CalendarItem
                      key={feature.id}
                      feature={feature}
                      className="pointer-events-none text-xs"
                    />
                  )}
                </CalendarBody>
              </CalendarProvider>
            </CardContent>
          </Card>
        </div>
        {/* Details Section */}
        <div className="space-y-4">
          {/* Selected Date Details */}
          <Card className="gap-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">
                {selectedDate
                  ? `Details for ${format(selectedDate, "MMM dd, yyyy")}`
                  : "Select a date"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAttendanceLoading && selectedDate ? (
                <div className="text-muted-foreground py-8 text-center text-sm">
                  Loading details...
                </div>
              ) : selectedDate ? (
                <>
                  {/* Meals Section */}
                  <div>
                    <h4 className="mb-3 text-sm font-semibold md:text-base">
                      Meals Served
                    </h4>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
                      {selectedDateMeals.length > 0 ? (
                        selectedDateMeals.map((meal) => (
                          <div
                            key={meal.id}
                            className="bg-muted/30 flex items-center gap-2 rounded-lg p-2"
                          >
                            <div
                              className="h-3 w-3 flex-shrink-0 rounded-full"
                              style={{ backgroundColor: meal.status.color }}
                            />
                            <span className="truncate text-xs md:text-sm">
                              {meal.name}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-xs">
                          No meals scheduled for this date
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground mb-2 text-xs md:text-sm">
                    👆 Tap on any date in the calendar above
                  </p>
                  <p className="text-muted-foreground text-xs">
                    View meal details and resident attendance
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Quick Stats */}
          <Card className="gap-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 md:grid-cols-1 md:space-y-0">
                <div className="flex flex-col items-center md:flex-row md:items-start md:justify-between">
                  <span className="text-center text-xs md:text-left md:text-sm">
                    Total Residents
                  </span>
                  <Badge className="mt-1 md:mt-0">
                    {isResidentsLoading ? "..." : residents?.length || 0}
                  </Badge>
                </div>
                <div className="flex flex-col items-center md:flex-row md:items-start md:justify-between">
                  <span className="text-center text-xs md:text-left md:text-sm">
                    Present Today
                  </span>
                  <Badge variant="secondary" className="mt-1 md:mt-0">
                    {isAttendanceLoading || isResidentsLoading
                      ? "..."
                      : totalPresentToday}
                  </Badge>
                </div>
                <div className="flex flex-col items-center md:flex-row md:items-start md:justify-between">
                  <span className="text-center text-xs md:text-left md:text-sm">
                    Meals Today
                  </span>
                  <Badge variant="outline" className="mt-1 md:mt-0">
                    {isAttendanceLoading
                      ? "..."
                      : selectedDate
                        ? selectedDateMeals.length
                        : 0}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
