"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ClockCounterClockwise as HistoryIcon,
  Info as InfoIcon,
  Plus,
  Trash as Trash2Icon,
  ForkKnife as UtensilsCrossedIcon,
} from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"

import { formatIST } from "@/lib/date"
import { GuestMeal } from "@/lib/generated/prisma"
import kyInstance from "@/lib/ky"
import { toast } from "@/lib/toast"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader } from "@/components/ui/loader"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageContainer } from "@/components/page-container"

import { CreateGuestMealSheet } from "./_components/create-guest-meal-sheet"
import { useDeleteGuestMealRequest } from "./_lib/mutations"

export default function GuestMealsPage() {
  const [showCreateGuestMealSheet, setShowCreateGuestMealSheet] =
    useState(false)
  const {
    data: pendingRequests,
    isLoading: isPending,
    error,
    isError,
  } = useQuery({
    queryKey: ["guest-meals", "self", "pending"],
    queryFn: () => kyInstance.get("/api/user/guest-meals").json<GuestMeal[]>(),
  })
  if (isError && error) {
    toast.error(error.message)
  }

  if (isPending) {
    return (
      <div className="flex min-h-[70vh] w-full items-center justify-center">
        <Loader variant="spinner" size={28} />
      </div>
    )
  }
  return (
    <PageContainer>
      <div className="rounded-md border px-4 py-3">
        <p className="text-sm">
          <InfoIcon
            className="me-3 -mt-0.5 inline-flex text-blue-500"
            size={16}
            aria-hidden="true"
          />
          If Your guest meal request has been approved, then the meal charge has
          been added to your bill.
        </p>
      </div>
      <Card className="w-full shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-foreground flex items-center gap-3 text-2xl font-bold">
              <UtensilsCrossedIcon className="text-primary h-6 w-6" />
              Guest Meal Requests
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage your pending guest meal requests.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs sm:flex-none sm:text-sm"
              asChild
            >
              <Link href="/guest-meal/history">
                <HistoryIcon className="mr-1.5 size-3.5 sm:mr-2 sm:size-4" />
                History
              </Link>
            </Button>
            <Button
              size="sm"
              className="flex-1 text-xs sm:flex-none sm:text-sm"
              onClick={() => setShowCreateGuestMealSheet(true)}
            >
              <Plus className="mr-1.5 size-3.5 sm:mr-2 sm:size-4" />
              Create New Request
            </Button>
          </div>
          <CreateGuestMealSheet
            open={showCreateGuestMealSheet}
            onOpenChange={setShowCreateGuestMealSheet}
          />
        </CardHeader>

        <CardContent className="p-4 md:p-6">
          {!pendingRequests || pendingRequests.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center">
              <UtensilsCrossedIcon className="text-muted-foreground mx-auto mb-4 h-10 w-10" />
              <p className="text-foreground text-lg font-semibold">
                No pending guest meal requests found.
              </p>
              <p className="mt-1 text-sm">
                Click Create New Request to add one.
              </p>
            </div>
          ) : (
            <GuestMealsTable meals={pendingRequests} />
          )}
        </CardContent>
      </Card>
    </PageContainer>
  )
}

interface GuestMealsTableProps {
  meals: GuestMeal[]
}
function GuestMealsTable({ meals }: GuestMealsTableProps) {
  const { mutate: handleDeleteRequest, isPending: isPendingDelete } =
    useDeleteGuestMealRequest()
  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Meals</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {meals?.map((meal) => (
            <TableRow key={meal.id} className="hover:bg-accent">
              <TableCell>{formatIST(meal.date, "dd/MM/yyyy")}</TableCell>
              <TableCell>{meal.numberOfMeals}</TableCell>
              <TableCell className="capitalize">
                {meal.mealTime.replace("_", " ")}
              </TableCell>
              <TableCell>{meal.mealCharge}</TableCell>
              <TableCell>
                <Badge variant="secondary">{meal.status.toLowerCase()}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-secondary hover:bg-destructive rounded-full transition-colors duration-300"
                      disabled={isPendingDelete}
                    >
                      {isPendingDelete ? (
                        <Loader variant="spinner" size={16} />
                      ) : (
                        <Trash2Icon className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the guest meal request.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteRequest(meal.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
