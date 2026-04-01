import { Metadata } from "next"

import { getMealSchedule, getMenuItems } from "./_lib/actions"
import MealScheduleView from "./_components/meal-schedule-view"

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
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Meal Scheduling</h1>
        <p className="text-muted-foreground">
          Define your weekly menu items and schedule them across the days of the week.
        </p>
      </div>

      <MealScheduleView 
        initialMenuItems={menuItems} 
        initialSchedule={schedule} 
      />
    </div>
  )
}
