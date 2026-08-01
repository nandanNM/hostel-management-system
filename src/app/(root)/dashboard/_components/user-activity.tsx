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

type LogStyle = { icon: Icon; color: string }

function getLogStyle(actionType: string): LogStyle {
  if (actionType.startsWith("MEAL"))
    return { icon: UtensilsCrossed, color: "text-orange-500" }
  if (actionType.startsWith("PAYMENT"))
    return { icon: Wallet, color: "text-emerald-500" }
  if (actionType.startsWith("ADVANCE"))
    return { icon: PiggyBank, color: "text-emerald-500" }
  if (actionType.startsWith("DUE"))
    return { icon: MinusCircle, color: "text-red-500" }
  if (actionType.startsWith("FINE"))
    return { icon: Gavel, color: "text-red-500" }
  if (actionType.includes("TRANSFER"))
    return { icon: ArrowsLeftRight, color: "text-blue-500" }
  if (actionType.startsWith("ALUMNI"))
    return { icon: GraduationCap, color: "text-violet-500" }
  if (actionType.includes("BILL") || actionType.includes("AUDIT"))
    return { icon: Receipt, color: "text-amber-500" }
  return { icon: Info, color: "text-muted-foreground" }
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
          <ScrollArea className="bg-muted/40 min-h-72 flex-1 rounded-lg border p-2 font-mono">
            <div className="divide-border/60 divide-y">
              {activityLogs.map((log) => {
                const { icon: LogIcon, color } = getLogStyle(log.actionType)
                return (
                  <div
                    key={log.id}
                    className="hover:bg-muted/60 flex items-start gap-3 rounded px-2 py-2.5 transition-colors"
                  >
                    <LogIcon
                      className={cn("mt-0.5 size-4 shrink-0", color)}
                      weight="fill"
                    />
                    <div className="grid min-w-0 flex-1 gap-0.5">
                      <p className="text-foreground text-sm break-words">
                        <span className="text-muted-foreground/70">
                          $&nbsp;
                        </span>
                        {log.details ||
                          `${log.actionType} on ${log.entityType || "System"}${
                            log.entityId ? ` (ID: ${log.entityId})` : ""
                          }`}
                      </p>
                      <p className="text-muted-foreground pl-4 text-xs">
                        {format(log.timestamp, "yyyy-MM-dd HH:mm")}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
