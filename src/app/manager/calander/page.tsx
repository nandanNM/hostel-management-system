"use client";

import { useState, useMemo, useCallback } from "react";
import { format, isSameDay, isValid, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CalendarProvider,
  CalendarDate,
  CalendarDatePicker,
  CalendarMonthPicker,
  CalendarYearPicker,
  CalendarDatePagination,
  CalendarHeader,
  CalendarBody,
  CalendarItem,
  useCalendarMonth,
  useCalendarYear,
  type Feature,
  type Status,
} from "@/components/calendar";
import kyInstance from "@/lib/ky";

// Sample data for hostel management
const mealStatuses: Status[] = [
  { id: "breakfast", name: "Breakfast", color: "#f59e0b" },
  { id: "lunch", name: "Lunch", color: "#10b981" },
  { id: "dinner", name: "Dinner", color: "#3b82f6" },
];

const residents = [
  { id: "1", name: "John Doe", room: "101" },
  { id: "2", name: "Jane Smith", room: "102" },
  { id: "3", name: "Mike Johnson", room: "103" },
  { id: "4", name: "Sarah Wilson", room: "104" },
  { id: "5", name: "Tom Brown", room: "105" },
];

async function getData() {
  try {
    const data = await kyInstance
      .get("/api/manager/meal/calendar?date=2025-07-01")
      .json();
    console.log(data);
  } catch (error) {
    console.log(error);
  }
}
getData();

// Generate sample meal data
const generateMealData = (): Feature[] => {
  const meals: Feature[] = [];
  const today = new Date();

  for (let i = -15; i <= 15; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    // Breakfast
    meals.push({
      id: `breakfast-${i}`,
      name: `Breakfast (${Math.floor(Math.random() * 50) + 20} meals)`,
      startAt: new Date(date.setHours(7, 0, 0, 0)),
      endAt: new Date(date.setHours(9, 0, 0, 0)),
      status: mealStatuses[0],
    });

    // Lunch
    meals.push({
      id: `lunch-${i}`,
      name: `Lunch (${Math.floor(Math.random() * 60) + 30} meals)`,
      startAt: new Date(date.setHours(12, 0, 0, 0)),
      endAt: new Date(date.setHours(14, 0, 0, 0)),
      status: mealStatuses[1],
    });

    // Dinner
    meals.push({
      id: `dinner-${i}`,
      name: `Dinner (${Math.floor(Math.random() * 55) + 25} meals)`,
      startAt: new Date(date.setHours(18, 0, 0, 0)),
      endAt: new Date(date.setHours(20, 0, 0, 0)),
      status: mealStatuses[2],
    });
  }

  return meals;
};

// Generate sample attendance data
const generateAttendanceData = () => {
  const attendance: { [key: string]: string[] } = {};
  const today = new Date();

  for (let i = -15; i <= 15; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateKey = format(date, "yyyy-MM-dd");

    // Randomly select residents who are present
    const presentResidents = residents.filter(() => Math.random() > 0.2);
    attendance[dateKey] = presentResidents.map((r) => r.id);
  }

  return attendance;
};

const DateDetailsPanel = () => {
  const [month] = useCalendarMonth();
  const [year] = useCalendarYear();
  console.log("month", month, "year", year);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const mealData = useMemo(() => generateMealData(), []);
  const attendanceData = useMemo(() => generateAttendanceData(), []);

  const selectedDateMeals = useMemo(() => {
    if (!selectedDate) return [];
    return mealData.filter((meal) =>
      isSameDay(new Date(meal.endAt), selectedDate),
    );
  }, [selectedDate, mealData]);

  const selectedDateAttendance = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const presentIds = attendanceData[dateKey] || [];
    return residents.filter((resident) => presentIds.includes(resident.id));
  }, [selectedDate, attendanceData]);

  // Function to handle date selection - this will be passed to the calendar
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Mobile-first layout */}
      <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-3">
        {/* Calendar Section */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg md:text-xl">
                Hostel Meal Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 md:p-6">
              <CalendarProvider className="min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
                {/* Mobile-optimized calendar header */}
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
                {/* Mobile calendar header */}
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
                  onDateSelect={handleDateSelect}
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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">
                {selectedDate
                  ? `Details for ${format(selectedDate, "MMM dd, yyyy")}`
                  : "Select a date"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedDate ? (
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

                  <Separator />

                  {/* Attendance Section */}
                  <div>
                    <h4 className="mb-3 text-sm font-semibold md:text-base">
                      Residents Present ({selectedDateAttendance.length})
                    </h4>
                    <div className="max-h-48 space-y-2 overflow-y-auto md:max-h-60">
                      {selectedDateAttendance.length > 0 ? (
                        selectedDateAttendance.map((resident) => (
                          <div
                            key={resident.id}
                            className="flex items-center justify-between rounded-lg border p-2"
                          >
                            <span className="text-xs font-medium md:text-sm">
                              {resident.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              Room {resident.room}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-xs">
                          No residents present on this date
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
          <Card>
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
                  <Badge className="mt-1 md:mt-0">{residents.length}</Badge>
                </div>
                <div className="flex flex-col items-center md:flex-row md:items-start md:justify-between">
                  <span className="text-center text-xs md:text-left md:text-sm">
                    Present Today
                  </span>
                  <Badge variant="secondary" className="mt-1 md:mt-0">
                    {selectedDate
                      ? selectedDateAttendance.length
                      : Math.floor(residents.length * 0.8)}
                  </Badge>
                </div>
                <div className="flex flex-col items-center md:flex-row md:items-start md:justify-between">
                  <span className="text-center text-xs md:text-left md:text-sm">
                    Meals Today
                  </span>
                  <Badge variant="outline" className="mt-1 md:mt-0">
                    {selectedDate ? selectedDateMeals.length : 3}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default function HostelManagementPage() {
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
      <DateDetailsPanel />
    </div>
  );
}
