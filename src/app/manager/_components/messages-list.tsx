"use client"

import { useQuery } from "@tanstack/react-query"
import { Loader2, MessageSquare } from "lucide-react"

import type { GetUserMealEventWithUser } from "@/types/prisma.type"
import kyInstance from "@/lib/ky"
import { formatRelativeDate } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { P } from "@/components/custom/p"

export function MessagesList() {
  const {
    data: messages,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["meal-messages", "manager"],
    queryFn: () =>
      kyInstance
        .get("/api/manager/meal/events")
        .json<GetUserMealEventWithUser[]>(),
    refetchOnWindowFocus: false,
  })

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> Meal Messages
          </CardTitle>
          <CardDescription>
            Recent communications and updates regarding meals.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="size-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> Meal Messages
          </CardTitle>
          <CardDescription>
            Recent communications and updates regarding meals.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <P variant="error">
            {error.message || "Failed to load meal messages."}
          </P>
        </CardContent>
      </Card>
    )
  }

  const currentMessages = messages || []

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" /> Meal Messages
        </CardTitle>
        <CardDescription>
          Recent communications and updates regarding meals.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea
          className={currentMessages.length > 0 ? "h-[300px]" : "h-auto"}
        >
          <div className="space-y-4 pr-4">
            {currentMessages.length > 0 ? (
              currentMessages.map((message, index) => (
                <div key={message.id}>
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <p className="text-foreground text-sm font-medium">
                          {message.user.name}
                        </p>
                        <span className="text-muted-foreground text-xs">
                          {formatRelativeDate(message.createdAt)}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {" "}
                          &bull; {message.mealTime}
                        </span>
                      </div>
                      <p className="text-muted-foreground mb-2 text-xs">
                        {message.user.email}
                      </p>
                      <p className="text-foreground text-sm">
                        {message.message}
                      </p>
                    </div>
                  </div>
                  {index < currentMessages.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center text-sm">
                No messages yet.
              </p>
            )}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
