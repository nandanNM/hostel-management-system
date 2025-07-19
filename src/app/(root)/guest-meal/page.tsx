"use client";
import { format } from "date-fns";
import Link from "next/link";
import { GuestMeal } from "@/generated/prisma";
import { useEffect, useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { PlusIcon, Trash2Icon, UtensilsCrossedIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { tryCatch } from "@/hooks/try-catch";
import kyInstance from "@/lib/ky";
import { toast } from "sonner";
import { RiLoader3Fill } from "@remixicon/react";
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
} from "@/components/ui/alert-dialog";
import { deleteGuestMealRequest } from "./action";

export default function GuestMealsPage() {
  const [isPending, startTransition] = useTransition();
  const [isPendingDelete, startTransitionDelete] = useTransition();
  const [pendingRequests, setPendingRequests] = useState<GuestMeal[]>([]);
  useEffect(() => {
    startTransition(async () => {
      const { data, error } = await tryCatch(
        kyInstance.get("/api/user/guest-meals").json<GuestMeal[]>(),
      );

      if (error) {
        toast.error(
          error.name === "TimeoutError"
            ? "Request timed out. Please try again."
            : "An unexpected error occurred. Please try again later.",
        );
        return;
      }
      setPendingRequests(data ?? []);
    });
  }, []);
  const handleDeleteRequest = (id: string) => {
    startTransitionDelete(async () => {
      const { data: result, error } = await tryCatch(
        deleteGuestMealRequest(id),
      );
      if (error) {
        toast.error("A Unexpected error occurred. Please try again later.");
        return;
      }
      if (result.status === "success") {
        setPendingRequests((prevRequests) =>
          prevRequests.filter((request) => request.id !== id),
        );
        toast.success(result.message);
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  };
  if (isPending)
    return <RiLoader3Fill size={30} className="mx-auto my-10 animate-spin" />;
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
          <Link
            href="/guest-meal/create"
            className={buttonVariants({ variant: "default" })}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Create New Request
          </Link>
        </CardHeader>

        <CardContent className="p-4 md:p-6">
          {!isPending && pendingRequests.length === 0 ? (
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
                  {pendingRequests.map((meal) => (
                    <TableRow key={meal.id} className="hover:bg-accent">
                      <TableCell>
                        {format(new Date(meal.date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{meal.numberOfMeals}</TableCell>
                      <TableCell className="capitalize">
                        {meal.mealTime.replace("_", " ")}
                      </TableCell>
                      <TableCell>{meal.mealCharge}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {meal.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-secondary hover:bg-destructive rounded-full transition-colors duration-300"
                            >
                              {isPendingDelete ? (
                                <RiLoader3Fill className="h-4 w-4 animate-spin" />
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
                                This will permanently delete the guest meal
                                request.
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
          )}
        </CardContent>
      </Card>
    </main>
  );
}
