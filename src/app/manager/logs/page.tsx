import { ClipboardList } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { ActivityLogsList } from "./_components/activity-logs-list"
import { GuestMealsLogList } from "./_components/guest-meals-log-list"

export default function LogsPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Logs</h1>
          <p className="text-muted-foreground mt-1">
            Activity records and guest meal history.
          </p>
        </div>
      </div>

      <Tabs defaultValue="activity">
        <TabsList className="h-10">
          <TabsTrigger value="activity" className="px-6">
            Activity Logs
          </TabsTrigger>
          <TabsTrigger value="guest-meals" className="px-6">
            Guest Meals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-4">
          <ActivityLogsList />
        </TabsContent>

        <TabsContent value="guest-meals" className="mt-4">
          <GuestMealsLogList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
