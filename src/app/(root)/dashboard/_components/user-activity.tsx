import type { Icon } from "@phosphor-icons/react"
import {
  ArrowsLeftRight,
  Gavel,
  GraduationCap,
  Info,
  MinusCircle,
  PiggyBank,
  Receipt,
  Terminal,
  ForkKnife as UtensilsCrossed,
  Wallet,
} from "@phosphor-icons/react/ssr"
import { format } from "date-fns"

import prisma from "@/lib/prisma"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
} from "@/components/reui/timeline"

type LogStyle = { icon: Icon; dotColor: string }

function getLogStyle(actionType: string): LogStyle {
  if (actionType.startsWith("MEAL"))
    return { icon: UtensilsCrossed, dotColor: "bg-orange-500" }
  if (actionType.startsWith("PAYMENT"))
    return { icon: Wallet, dotColor: "bg-emerald-500" }
  if (actionType.startsWith("ADVANCE"))
    return { icon: PiggyBank, dotColor: "bg-emerald-500" }
  if (actionType.startsWith("DUE"))
    return { icon: MinusCircle, dotColor: "bg-red-500" }
  if (actionType.startsWith("FINE"))
    return { icon: Gavel, dotColor: "bg-red-500" }
  if (actionType.includes("TRANSFER"))
    return { icon: ArrowsLeftRight, dotColor: "bg-blue-500" }
  if (actionType.startsWith("ALUMNI"))
    return { icon: GraduationCap, dotColor: "bg-violet-500" }
  if (actionType.includes("BILL") || actionType.includes("AUDIT"))
    return { icon: Receipt, dotColor: "bg-amber-500" }
  return { icon: Info, dotColor: "bg-muted-foreground" }
}

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
    <Card className="flex h-full flex-col gap-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Terminal className="text-primary size-5" weight="bold" />
          Your Activity
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Recent actions by you and the system.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col p-2">
        {activityLogs.length === 0 ? (
          <p className="text-muted-foreground text-center text-sm">
            No activity logs found.
          </p>
        ) : (
          <ScrollArea className="bg-muted/40 min-h-72 flex-1 rounded-lg border p-4 font-mono">
            <Timeline defaultValue={0} className="gap-4">
              {activityLogs.map((log, index) => {
                const { icon: LogIcon, dotColor } = getLogStyle(log.actionType)
                return (
                  <TimelineItem
                    key={log.id}
                    step={index + 1}
                    className="has-[+[data-completed]]:**:data-[slot=timeline-separator]:bg-foreground/20 group-data-[orientation=vertical]/timeline:not-last:pb-0"
                  >
                    <TimelineHeader className="flex items-center gap-2.5">
                      <TimelineSeparator />
                      <TimelineIndicator
                        className={cn("size-2 border-none", dotColor)}
                      />
                      <TimelineDate className="text-muted-foreground/60 mb-0 text-[10px] font-semibold uppercase">
                        {format(log.timestamp, "yyyy-MM-dd HH:mm")}
                      </TimelineDate>
                    </TimelineHeader>
                    <TimelineContent className="text-foreground flex items-start gap-1.5 text-sm font-medium">
                      <LogIcon
                        className="text-muted-foreground mt-0.5 size-3.5 shrink-0"
                        weight="fill"
                      />
                      <span className="wrap-break-word">
                        <span className="text-muted-foreground/70">
                          $&nbsp;
                        </span>
                        {log.details ||
                          `${log.actionType} on ${log.entityType || "System"}${
                            log.entityId ? ` (ID: ${log.entityId})` : ""
                          }`}
                      </span>
                    </TimelineContent>
                  </TimelineItem>
                )
              })}
            </Timeline>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
