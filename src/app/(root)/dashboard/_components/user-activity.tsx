import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import UserAvatar from "@/components/UserAvatar";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
interface UserActivityProps {
  userId: string;
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
  });

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
                  className="hover:bg-muted flex items-start gap-3 rounded-md p-2"
                >
                  <UserAvatar
                    className="h-8 w-8 border"
                    avatarUrl="https://avatars.githubusercontent.com/u/1486366"
                  />
                  <div className="grid flex-1 gap-1">
                    <div className="text-sm leading-none font-medium">
                      {log.details ||
                        `${log.actionType} on ${log.entityType || "System"}${log.entityId ? ` (ID: ${log.entityId})` : ""}`}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {format(log.timestamp, "yyyy-MM-dd HH:mm")}
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
