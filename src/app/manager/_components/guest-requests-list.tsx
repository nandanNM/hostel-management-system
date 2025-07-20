"use client";

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

interface GuestRequest {
  id: string;
  guestName: string;
  roomNumber: string;
  mealType: MealType;
  requestTime: string;
  specialRequirements?: string;
}
interface GuestRequestsListProps {
  requests: GuestRequest[];
  onApprove?: (requestId: string) => void;
  onDecline?: (requestId: string) => void;
}

export function GuestRequestsList({
  requests,
  onApprove,
  onDecline,
}: GuestRequestsListProps) {
  const getMealTypeIcon = (type: MealType) => {
    return type === MealType.VEG ? (
      <Leaf className="h-4 w-4" />
    ) : (
      <Utensils className="h-4 w-4" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Pending Guest Meal Requests
        </CardTitle>
        <CardDescription>
          Guest meal requests awaiting approval or preparation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((request, index) => (
            <div key={request.id}>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getMealTypeIcon(request.mealType)}
                    <div>
                      <h4 className="font-medium">{request.guestName}</h4>
                      <p className="text-muted-foreground text-sm">
                        Room {request.roomNumber}
                      </p>
                      {request.specialRequirements && (
                        <p className="mt-1 text-xs text-orange-600">
                          Special: {request.specialRequirements}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <Badge
                      variant={
                        request.mealType === "VEG" ? "default" : "secondary"
                      }
                    >
                      {request.mealType === "VEG"
                        ? "Vegetarian"
                        : "Non-Vegetarian"}
                    </Badge>
                    <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      {request.requestTime}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onApprove?.(request.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDecline?.(request.id)}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              </div>
              {index < requests.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
