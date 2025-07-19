import CreateGuestMealForm from "@/components/forms/create-guest-meal-form";
import { Metadata } from "next";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Create Guest Meal",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl p-4">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-foreground text-2xl">
            Create Guest Meal
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Fill out the form to register a guest meal entry.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <CreateGuestMealForm />
        </CardContent>
      </Card>
    </div>
  );
}
