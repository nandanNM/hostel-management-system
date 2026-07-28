import { Metadata } from "next"

import MealScheduleView from "./_components/meal-schedule-view"
import { getMealSchedule, getMenuItems } from "./_lib/actions"

export const metadata: Metadata = {
  title: "Meal Scheduling | Manager Settings",
  description: "Schedule meals and manage menu items.",
}

export default async function MealSchedulingPage() {
  const [menuItems, schedule] = await Promise.all([
    getMenuItems(),
    getMealSchedule(),
  ])

  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-foreground text-2xl font-bold tracking-tight">
          Meal Scheduling
        </h1>
        <p className="text-muted-foreground">
          Define your weekly menu items and schedule them across the days of the
          week.
        </p>
      </div>

      <MealScheduleView
        initialMenuItems={menuItems}
        initialSchedule={schedule}
      />
    </div>
  )
}
