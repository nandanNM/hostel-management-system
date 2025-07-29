"use client"

import { useEffect, useTransition } from "react"
import { DailyMealActivity } from "@/generated/prisma"
import { ChefHat, Leaf, TrendingUp, Utensils } from "lucide-react"
import { toast } from "sonner"

import kyInstance from "@/lib/ky"
import { formatRelativeDate, getErrorMessage } from "@/lib/utils"
import { tryCatch } from "@/hooks/try-catch"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import LoadingButton from "@/components/LoadingButton"

import { useMealStore } from "../store"
import ManagerPageSkeleton from "./manager-page-skeleton"

export function MealDataCard() {
  const [isPanding, startTransition] = useTransition()
  const mealData = useMealStore((state) => state.mealData)
  const setMealData = useMealStore((state) => state.setMealData)
  const getMealData = useMealStore((state) => state.getMealData)
  const loading = useMealStore((state) => state.loading)

  const generateMealData = () => {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        kyInstance.post("/api/manager/meal").json<DailyMealActivity>()
      )
      if (error) {
        const message = await getErrorMessage(error)
        toast.error(message)
        return
      }
      setMealData(result)
      toast.success("Successfully generated today's meal data.")
    })
  }
  useEffect(() => {
    if (!mealData) {
      getMealData()
    }
  }, [getMealData, mealData])

  if (loading && !mealData) return <ManagerPageSkeleton />

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
            loading={isPanding}
            onClick={generateMealData}
            className="w-full sm:w-auto"
          >
            {"Generate Today's Meal Data"}
          </LoadingButton>
        )}

        {mealData && (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <Leaf className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold">Vegetarian</h4>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {mealData.totalVeg}
                </p>
                <p className="text-muted-foreground text-sm">meals today</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-center gap-2">
                  <Utensils className="h-5 w-5 text-orange-600" />
                  <h4 className="font-semibold text-orange-600">
                    Non-Vegetarian Meals
                  </h4>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-orange-500">
                      {mealData.totalNonvegEgg}
                    </p>
                    <p className="text-muted-foreground text-sm">Egg</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-500">
                      {mealData.totalNonvegFish}
                    </p>
                    <p className="text-muted-foreground text-sm">Fish</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-500">
                      {mealData.totalNonvegChicken}
                    </p>
                    <p className="text-muted-foreground text-sm">Chicken</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <ChefHat className="text-primary h-5 w-5" />
                  <h3 className="text-primary font-semibold">Total Meals</h3>
                </div>
                <p className="text-primary text-3xl font-bold">
                  {mealData.totalMeal}
                </p>
                <p className="text-muted-foreground text-sm">
                  including guest meals
                </p>

                <div className="mt-3 flex items-center justify-center gap-2 text-sm">
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
