import { format } from "date-fns"

import prisma from "@/lib/prisma"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface UserActivityProps {
  userId: string
}
export default async function UserActivity({ userId }: UserActivityProps) {
  const activityLogs = await prisma.activityLog.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      timestamp: "desc",
    },
    take: 10,
    select: {
      id: true,
      actionType: true,
      entityType: true,
      entityId: true,
      timestamp: true,
      details: true,
    },
  })

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader>
        <CardTitle className="text-xl">Your Activity</CardTitle>
        <CardDescription className="text-gray-500">
          Recent actions by you and the system.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-2">
        <div className="space-y-4">
          {activityLogs.length === 0 ? (
            <p className="text-muted-foreground text-center text-sm">
              No activity logs found.
            </p>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              {activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-muted/40 hover:bg-muted flex items-start gap-3 rounded-lg px-4 py-3 transition-colors"
                >
                  <div className="bg-primary mt-1 h-2.5 w-2.5 shrink-0 rounded-full" />
                  <div className="grid gap-1 text-sm">
                    <p className="text-foreground font-medium">
                      {log.details ||
                        `${log.actionType} on ${log.entityType || "System"}${
                          log.entityId ? ` (ID: ${log.entityId})` : ""
                        }`}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {format(log.timestamp, "yyyy-MM-dd HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
