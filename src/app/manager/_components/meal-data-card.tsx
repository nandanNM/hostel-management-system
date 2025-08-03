"use client"

import { useQuery } from "@tanstack/react-query"
import {
  ChefHat,
  Drumstick,
  Egg,
  Fish,
  Leaf,
  TrendingUp,
  Utensils,
} from "lucide-react"
import { toast } from "sonner"

import type { DailyMealActivity } from "@/lib/generated/prisma"
import kyInstance from "@/lib/ky"
import { formatRelativeDate, isActiveTime } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import LoadingButton from "@/components/LoadingButton"

import { useGenerateMealData } from "../_lib/mutations"

export function MealDataCard() {
  const { mutate: generateMealData, isPending: isGenerating } =
    useGenerateMealData()
  const activeTime = isActiveTime()
  const {
    data: mealData,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ["daily-meal-activity", "manager"],
    queryFn: () =>
      kyInstance.get("/api/manager/meal").json<DailyMealActivity>(),
    refetchOnWindowFocus: false,
  })

  if (isError && error) {
    toast.error(error.message)
  }

  if (isLoading && !mealData) return <ManagerPageSkeleton />
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Today&apos;s Meal Data
        </CardTitle>
        <CardDescription>
          {mealData
            ? `View today's meal statistics and requirements generated at ${formatRelativeDate(mealData.createdAt)}`
            : " Generate and view today's meal statistics and requirements"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!mealData && (
          <LoadingButton
            disabled={activeTime}
            loading={isGenerating}
            onClick={() => generateMealData()}
            className="w-full sm:w-auto"
          >
            {"Generate Today's Meal Data"}
          </LoadingButton>
        )}

        {mealData && (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Vegetarian Meals Card */}
            <Card className="py-4 shadow-lg transition-shadow duration-300 hover:shadow-xl">
              <CardContent className="p-2 text-center">
                <div className="mb-3 flex items-center justify-center gap-2">
                  <Leaf className="h-6 w-6 text-green-600" />
                  <h4 className="text-lg font-semibold text-green-700">
                    Vegetarian Meals
                  </h4>
                </div>
                <p className="text-5xl font-extrabold text-green-600">
                  {mealData.totalVeg}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  meals today
                </p>
              </CardContent>
            </Card>

            {/* Non-Vegetarian Meals Card */}
            <Card className="py-4 shadow-lg transition-shadow duration-300 hover:shadow-xl">
              <CardContent className="p-3">
                <div className="mb-4 flex items-center justify-center gap-2">
                  <Utensils className="h-6 w-6 text-orange-600" />
                  <h4 className="text-lg font-semibold text-orange-600">
                    Non-Vegetarian Meals
                  </h4>
                </div>
                <div className="flex items-center justify-around text-center">
                  {mealData.actualNonVegServed === "EGG" && (
                    <div className="flex flex-col items-center">
                      <Egg className="mb-1 h-6 w-6 text-orange-500" />
                      <p className="text-3xl font-bold text-orange-500">
                        {mealData.totalNonvegEgg}
                      </p>
                      <p className="text-muted-foreground text-sm">Egg</p>
                    </div>
                  )}
                  {mealData.actualNonVegServed === "FISH" && (
                    <div className="flex flex-col items-center">
                      <Fish className="mb-1 h-6 w-6 text-orange-500" />
                      <p className="text-3xl font-bold text-orange-500">
                        {mealData.totalNonvegFish}
                      </p>
                      <p className="text-muted-foreground text-sm">Fish</p>
                    </div>
                  )}
                  {mealData.actualNonVegServed === "CHICKEN" && (
                    <div className="flex flex-col items-center">
                      <Drumstick className="mb-1 h-6 w-6 text-orange-500" />
                      <p className="text-3xl font-bold text-orange-500">
                        {mealData.totalNonvegChicken}
                      </p>
                      <p className="text-muted-foreground text-sm">Chicken</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Total Meals Card */}
            <Card className="py-4 shadow-lg transition-shadow duration-300 hover:shadow-xl">
              <CardContent className="p-3 text-center">
                <div className="mb-3 flex items-center justify-center gap-2">
                  <ChefHat className="text-primary h-6 w-6" />
                  <h3 className="text-primary text-lg font-semibold">
                    Total Meals
                  </h3>
                </div>
                <p className="text-primary text-5xl font-extrabold">
                  {mealData.totalMeal}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  including guest meals
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                  <span className="text-muted-foreground">Guest Meals:</span>
                  <span className="text-muted-foreground font-semibold">
                    {mealData.totalGuestMeal}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ManagerPageSkeleton() {
  return (
    <Card className="w-full animate-pulse">
      <CardHeader>
        <div className="h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-700" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="h-32 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-32 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-32 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </CardContent>
    </Card>
  )
}
