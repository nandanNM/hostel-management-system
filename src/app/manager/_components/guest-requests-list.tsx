"use client";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Clock, Leaf, Utensils } from "lucide-react";
import { MealType } from "@/generated/prisma";
import { useMealStore } from "../store";
import { useEffect } from "react";
import { P } from "@/components/custom/p";
import { formatRelativeDate } from "@/lib/utils";

export function GuestRequestsList() {
  const requests = useMealStore((state) => state.guestRequests);
  const getGuestMealRequests = useMealStore(
    (state) => state.getGuestMealRequests,
  );
  const approveGuestRequest = useMealStore(
    (state) => state.approveGuestRequest,
  );
  const declineGuestRequest = useMealStore(
    (state) => state.declineGuestRequest,
  );
  const error = useMealStore((state) => state.errorOnGetGuestRequests);
  const getMealTypeIcon = (type: MealType) => {
    return type === MealType.VEG ? (
      <Leaf className="h-4 w-4" />
    ) : (
      <Utensils className="h-4 w-4" />
    );
  };
  useEffect(() => {
    getGuestMealRequests();
  }, [getGuestMealRequests]);

  if (error && requests.length === 0) return <P variant="error">{error}</P>;
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
          {requests.length > 0 ? (
            requests.map((request, index) => (
              <div key={request.id}>
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getMealTypeIcon(request.type)}
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {request.name}
                        </h4>{" "}
                        {/* Stronger text color */}
                        <p className="text-muted-foreground text-sm">
                          Meal Time: {request.mealTime}
                        </p>
                      </div>
                    </div>
                  </div>
                  <AlertDialog>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge
                          variant={
                            request.type === "VEG" ? "default" : "secondary"
                          }
                          className={
                            request.type === "VEG"
                              ? "bg-green-500 text-white"
                              : "bg-orange-500 text-white"
                          }
                        >
                          {request.type === "VEG"
                            ? "Vegetarian"
                            : "Non-Vegetarian"}
                        </Badge>
                        <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          {formatRelativeDate(request.createdAt)}
                        </p>
                      </div>

                      {/* Triggers Dialog  */}
                      <div className="flex gap-2">
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            Approve
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            Decline
                          </Button>
                        </AlertDialogTrigger>
                      </div>
                    </div>

                    {/* Dialog content */}
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm action</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to approve or decline this meal
                          request? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => approveGuestRequest(request.id)}
                        >
                          Approve
                        </AlertDialogAction>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => declineGuestRequest(request.id)}
                        >
                          Decline
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {index < requests.length - 1 && <Separator className="mt-4" />}
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
  );
}
