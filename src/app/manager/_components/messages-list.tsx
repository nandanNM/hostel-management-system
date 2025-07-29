"use client"

import { useEffect, useState } from "react"
import { MessageSquare } from "lucide-react"

import type { GetUserMealEventWithUser } from "@/types/prisma.type"
import kyInstance from "@/lib/ky"
import { cn, formatRelativeDate, getErrorMessage } from "@/lib/utils"
import { tryCatch } from "@/hooks/try-catch"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { P } from "@/components/custom/p"

export function MessagesList() {
  const [events, setEvents] = useState<GetUserMealEventWithUser[]>([])
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    async function getEvents() {
      setError(null)
      const { data, error } = await tryCatch(
        kyInstance
          .get("/api/manager/meal/events")
          .json<GetUserMealEventWithUser[]>()
      )
      if (error) {
        const message = await getErrorMessage(error)
        setError(message)
        return
      }
      if (data) {
        setEvents(data)
      }
    }
    getEvents()
  }, [])
  if (error) {
    ;<P variant="error">{error}</P>
  }
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Meal Messages
        </CardTitle>
        <CardDescription>
          Recent communications and updates regarding meals.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className={cn(events.length > 0 && "h-[300px]")}>
          <div className="space-y-4 pr-4">
            {events.length > 0 ? (
              events.map((message, index) => (
                <div key={message.id}>
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {message.user.name}
                        </p>
                        <span className="text-muted-foreground text-xs">
                          {formatRelativeDate(message.createdAt)}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          &bull; {message.mealTime}
                        </span>
                      </div>
                      <p className="text-muted-foreground mb-2 text-xs">
                        {message.user.email}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {message.message}
                      </p>
                    </div>
                  </div>
                  {index < events.length - 1 && <Separator className="mt-4" />}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No messages yet.</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
