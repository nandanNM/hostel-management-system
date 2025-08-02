"use client"

import { useState } from "react"
import { GuestMeal } from "@/generated/prisma"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { Loader2, Plus, Trash2Icon, UtensilsCrossedIcon } from "lucide-react"
import { toast } from "sonner"

import kyInstance from "@/lib/ky"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
    return <Loader2 className="mx-auto my-6 size-6 animate-spin" />
  }
  return (
    <main className="flex flex-col items-center justify-center px-4 py-6 md:px-6 lg:px-12">
      <Card className="w-full max-w-4xl shadow-sm">
        <CardHeader className="flex flex-col gap-2 border-b md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-foreground flex items-center gap-2 text-2xl font-bold">
              <UtensilsCrossedIcon className="text-primary h-6 w-6" />
              Guest Meal Requests
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage your pending guest meal requests.
            </CardDescription>
          </div>
          <Button onClick={() => setShowCreateGuestMealSheet(true)}>
            <Plus className="mr-2 size-4" />
            Create New Request
          </Button>
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
    </main>
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
              <TableCell>{format(new Date(meal.date), "dd/MM/yyyy")}</TableCell>
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
                        <Loader2 className="size-4 animate-spin" />
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
