import Link from "next/link"
import {
  ArrowLeft,
  ForkKnife as UtensilsCrossedIcon,
} from "@phosphor-icons/react/ssr"

import { formatIST } from "@/lib/date"
import { GuestMealStatusType } from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"
import { requireUser } from "@/lib/require-user"
import { Badge } from "@/components/ui/badge"
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
import { PageContainer } from "@/components/page-container"

export const metadata = {
  title: "Guest Meal History",
}

export default async function GuestMealHistoryPage() {
  const session = await requireUser()

  // Only requests that actually went through — a request that was rejected,
  // cancelled, or is still pending never resulted in a real guest meal, so
  // it doesn't belong in a history of meals that happened.
  const meals = await prisma.guestMeal.findMany({
    where: {
      userId: session.user.id,
      status: {
        in: [GuestMealStatusType.APPROVED, GuestMealStatusType.SERVED],
      },
    },
    orderBy: { date: "desc" },
  })

  return (
    <PageContainer>
      <Link
        href="/guest-meal"
        className="text-muted-foreground hover:text-foreground -mb-2 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to guest meals
      </Link>
      <Card className="w-full shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-foreground flex items-center gap-3 text-2xl font-bold">
            <UtensilsCrossedIcon className="text-primary h-6 w-6" />
            Guest Meal History
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Your approved guest meal requests.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 md:p-6">
          {meals.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center">
              <UtensilsCrossedIcon className="text-muted-foreground mx-auto mb-4 h-10 w-10" />
              <p className="text-foreground text-lg font-semibold">
                No approved guest meal requests yet.
              </p>
              <p className="mt-1 text-sm">
                Approved requests will show up here once a manager reviews them.
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meals.map((meal) => (
                    <TableRow key={meal.id} className="hover:bg-accent">
                      <TableCell>
                        {formatIST(meal.date, "dd/MM/yyyy")}
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  )
}
