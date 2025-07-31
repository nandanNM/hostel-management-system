import { Metadata } from "next"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import CreateGuestMealForm from "@/app/(root)/guest-meal/_components/create-guest-meal-form"

export const metadata: Metadata = {
  title: "Create Guest Meal",
}

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
  )
}
