"use client"

import { GuestMeal, MealType } from "@/generated/prisma"
import { useQuery } from "@tanstack/react-query"
import { Clock, Leaf, Loader2, Users, Utensils } from "lucide-react"

import kyInstance from "@/lib/ky"
import { formatRelativeDate } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/crazxy-ui/badge"
import { Separator } from "@/components/ui/separator"
import { P } from "@/components/custom/p"

import { useUpdateGuestMealStatus } from "../_lib/mutations"

export function GuestRequestsList() {
  const updateMutation = useUpdateGuestMealStatus()
  const {
    data: pendingRequests,
    isLoading: isPending,
    error,
    isError,
  } = useQuery({
    queryKey: ["guest-meals", "manager", "pending"],
    queryFn: () =>
      kyInstance
        .get("/api/manager/meal/panding-gurst-meals")
        .json<GuestMeal[]>(),
  })

  const getMealTypeIcon = (type: MealType) => {
    return type === MealType.VEG ? (
      <Leaf className="h-4 w-4" />
    ) : (
      <Utensils className="h-4 w-4" />
    )
  }

  if (isPending) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" /> Pending Guest Meal
            Requests
          </CardTitle>
          <CardDescription>
            Guest meal requests awaiting approval or preparation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Loader2 className="mx-auto mt-4 size-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }
  if (isError) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" /> Pending Guest Meal
            Requests
          </CardTitle>
          <CardDescription>
            Guest meal requests awaiting approval or preparation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <P variant="error">
            {error.message || "Failed to load guest meal requests."}
          </P>
        </CardContent>
      </Card>
    )
  }
  const currentRequests = pendingRequests || []
  const isAnyMutationPending = updateMutation.isPending
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" /> Pending Guest Meal
          Requests
        </CardTitle>
        <CardDescription>
          Guest meal requests awaiting approval or preparation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {currentRequests.length > 0 ? (
            currentRequests.map((request, index) => (
              <div key={request.id}>
                <div className="flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:flex-row sm:items-center">
                  <div className="flex flex-col gap-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h4 className="text-lg font-semibold text-gray-800">
                        {request.name}
                      </h4>
                      <Badge
                        variant={request.type === "VEG" ? "default" : "orange"}
                      >
                        {request.type === "VEG"
                          ? "Vegetarian"
                          : "Non-Vegetarian"}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-1 text-sm">
                      {getMealTypeIcon(request.type)}
                      <span>Meal Time:</span>
                      <Clock className="ml-auto h-3 w-3" />
                      <span className="text-xs">
                        {formatRelativeDate(request.createdAt)}
                      </span>
                    </div>
                    <p className="text-foreground ml-7 text-sm font-medium">
                      {request.mealTime}
                    </p>
                  </div>
                  <AlertDialog>
                    <div className="ml-auto flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="mt-3 flex gap-2 sm:mt-0">
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isAnyMutationPending}
                          >
                            Approve
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isAnyMutationPending}
                          >
                            Decline
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            disabled={isAnyMutationPending}
                          >
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                      </div>
                    </div>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Action</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to perform this action? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            updateMutation.mutate({
                              id: request.id,
                              status: "APPROVED",
                            })
                          }
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Approve
                        </AlertDialogAction>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() =>
                            updateMutation.mutate({
                              id: request.id,
                              status: "REJECTED",
                            })
                          }
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Decline
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                {index < currentRequests.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center">
              No pending meal requests.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
