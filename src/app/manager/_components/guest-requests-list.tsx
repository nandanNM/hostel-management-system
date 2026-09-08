"use client"

import {
  WarningCircle as CircleAlert,
  Clock,
  Leaf,
  Users,
  ForkKnife as Utensils,
} from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"

import { GetGuestMealWithUser } from "@/types/prisma.type"
import { MealType } from "@/lib/generated/prisma"
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
import { Loader } from "@/components/ui/loader"
import { Separator } from "@/components/ui/separator"
import { AlumniGuestBadge } from "@/components/AlumniGuestBadge"
import { P } from "@/components/custom/p"

import { useUpdateGuestMealStatus } from "../_lib/mutations"

export function GuestRequestsList() {
  const { data: session } = useSession()
  const isReadOnly = session?.user?.role === "MESS_PREFECT"
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
        .get("/api/manager/meal/pending-guest-meals")
        .json<GetGuestMealWithUser[]>(),
    refetchOnWindowFocus: false,
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
          <Loader variant="spinner" size={24} className="mx-auto mt-4" />
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
          <div className="mb-2 rounded-md border border-red-500/50 px-4 py-3 text-red-600">
            <p className="text-sm">
              <CircleAlert
                className="me-3 -mt-0.5 inline-flex opacity-60"
                size={16}
                aria-hidden="true"
              />
              Failed to fetch guest meal requests. Please refresh the page
              before generating meal data.
            </p>
          </div>
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
    <Card className="w-full">
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
                <div className="bg-card flex flex-col justify-between rounded-lg border p-4 shadow-sm transition-all hover:shadow-md sm:flex-row sm:items-center">
                  <div className="flex flex-col gap-1">
                    <p className="text-muted-foreground text-xs">
                      Requested by:{" "}
                      <span className="text-foreground font-medium">
                        {request.user?.name ?? "Unknown"}
                      </span>{" "}
                      &bull; {request.user?.email}
                    </p>
                    <div className="mb-1 flex items-center gap-2">
                      <h4 className="text-foreground text-lg font-semibold">
                        {request.name}
                      </h4>
                      {request.alumniId && <AlumniGuestBadge />}
                      <Badge
                        variant={request.type === "VEG" ? "default" : "orange"}
                      >
                        {request.type === "VEG"
                          ? "Vegetarian"
                          : "Non-Vegetarian"}
                      </Badge>
                      {request.type === "NON_VEG" &&
                        request.nonVegType !== "NONE" && (
                          <Badge variant="outline" className="capitalize">
                            {request.nonVegType.toLowerCase()}
                          </Badge>
                        )}
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
                  {isReadOnly && (
                    <div className="ml-auto flex items-center">
                      <Badge variant="secondary" className="capitalize">
                        {request.status.toLowerCase()}
                      </Badge>
                    </div>
                  )}
                  {!isReadOnly && (
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
                                requestedUserId: request.userId,
                                amount: request.mealCharge,
                              })
                            }
                            disabled={updateMutation.isPending}
                          >
                            {updateMutation.isPending ? (
                              <Loader
                                variant="spinner"
                                size={16}
                                className="mr-2"
                              />
                            ) : null}
                            Approve
                          </AlertDialogAction>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() =>
                              updateMutation.mutate({
                                id: request.id,
                                status: "REJECTED",
                                requestedUserId: request.userId,
                                amount: request.mealCharge,
                              })
                            }
                            disabled={updateMutation.isPending}
                          >
                            {updateMutation.isPending ? (
                              <Loader
                                variant="spinner"
                                size={16}
                                className="mr-2"
                              />
                            ) : null}
                            Decline
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
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
