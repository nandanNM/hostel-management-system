"use client"

import { useQuery } from "@tanstack/react-query"
import {
  ChefHat,
  Egg,
  Fish,
  Leaf,
  TrendingUp,
  Utensils,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

import type { DailyMealActivity } from "@/lib/generated/prisma"
import kyInstance from "@/lib/ky"
import { cn, formatRelativeDate } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import LoadingButton from "@/components/LoadingButton"

import { useGenerateMealData } from "../_lib/mutations"

export function MealDataCard() {
  const { data: session } = useSession()
  const isReadOnly = session?.user?.role === "MESS_PREFECT"
  const { mutate: generateMealData, isPending: isGenerating } =
    useGenerateMealData()
  // const activeTime = isActiveTime()
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
            ? `View today's meal statistics and requirements generated at ${formatRelativeDate(new Date(mealData.createdAt))}`
            : " Generate and view today's meal statistics and requirements"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!mealData && isReadOnly && (
          <p className="text-muted-foreground text-sm">
            Today&apos;s meal count hasn&apos;t been generated yet. Meal
            generation is handled by the mess manager.
          </p>
        )}
        {!mealData && !isReadOnly && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <LoadingButton
                // disabled={activeTime}
                loading={isGenerating}
                className="w-full sm:w-auto"
              >
                {"Generate Meal Count"}
              </LoadingButton>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. Generating today&apos;s meal
                  record will finalize the counts for the current meal slot.
                  Please ensure all guest requests and meal messages have been
                  reviewed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => generateMealData()}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {mealData && (
          <div className="mt-6 space-y-4">
            <MealBreakdownCards mealData={mealData} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type MealCardItem = {
  label: string
  sublabel?: string
  count: number
  icon: React.ReactNode
  colorClass: string
}

function MealBreakdownCards({ mealData }: { mealData: DailyMealActivity }) {
  const serving = mealData.actualNonVegServed

  const cards: MealCardItem[] = []

  if (serving === "CHICKEN" || serving === "FISH" || serving === "EGG") {
    // Priority-based day: show each type with context labels
    if (serving === "CHICKEN") {
      cards.push({
        label: "Chicken",
        count: mealData.totalNonvegChicken,
        icon: <Utensils className="h-6 w-6 text-orange-600" />,
        colorClass: "text-orange-600",
      })
      cards.push({
        label: "Fish",
        sublabel: "dislikes Chicken",
        count: mealData.totalNonvegFish,
        icon: <Fish className="h-6 w-6 text-blue-500" />,
        colorClass: "text-blue-500",
      })
      cards.push({
        label: "Egg",
        sublabel: "dislikes Chicken & Fish",
        count: mealData.totalNonvegEgg,
        icon: <Egg className="h-6 w-6 text-yellow-500" />,
        colorClass: "text-yellow-500",
      })
    } else if (serving === "FISH") {
      cards.push({
        label: "Fish",
        count: mealData.totalNonvegFish,
        icon: <Fish className="h-6 w-6 text-blue-500" />,
        colorClass: "text-blue-500",
      })
      cards.push({
        label: "Egg",
        sublabel: "dislikes Fish",
        count: mealData.totalNonvegEgg,
        icon: <Egg className="h-6 w-6 text-yellow-500" />,
        colorClass: "text-yellow-500",
      })
    } else if (serving === "EGG") {
      cards.push({
        label: "Egg",
        count: mealData.totalNonvegEgg,
        icon: <Egg className="h-6 w-6 text-yellow-500" />,
        colorClass: "text-yellow-500",
      })
    }

    cards.push({
      label: "Vegetarian",
      sublabel: serving !== "EGG" ? "incl. all fallbacks" : undefined,
      count: mealData.totalVeg,
      icon: <Leaf className="h-6 w-6 text-green-600" />,
      colorClass: "text-green-600",
    })
  } else {
    // No schedule or veg day: show simple Veg / Non-Veg split
    cards.push({
      label: "Vegetarian",
      count: mealData.totalVeg,
      icon: <Leaf className="h-6 w-6 text-green-600" />,
      colorClass: "text-green-600",
    })
    if (mealData.totalNonvegChicken > 0) {
      cards.push({
        label: "Non-Vegetarian",
        count: mealData.totalNonvegChicken,
        icon: <Utensils className="h-6 w-6 text-orange-600" />,
        colorClass: "text-orange-600",
      })
    }
  }

  const dayLabel =
    serving === "CHICKEN"
      ? "Chicken Day"
      : serving === "FISH"
        ? "Fish Day"
        : serving === "EGG"
          ? "Egg Day"
          : null

  const cols =
    cards.length <= 2
      ? "md:grid-cols-2"
      : cards.length === 3
        ? "md:grid-cols-3"
        : "md:grid-cols-4"

  return (
    <>
      {dayLabel && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs font-semibold">
            Today&apos;s Non-Veg: {dayLabel}
          </Badge>
        </div>
      )}
      <div className={cn("grid grid-cols-1 gap-6", cols)}>
        {cards.map((card) => (
          <Card
            key={card.label}
            className="py-4 shadow-lg transition-shadow duration-300 hover:shadow-xl"
          >
            <CardContent className="p-2 text-center">
              <div className="mb-3 flex items-center justify-center gap-2">
                {card.icon}
                <h4 className={cn("text-lg font-semibold", card.colorClass)}>
                  {card.label}
                </h4>
              </div>
              <p className={cn("text-5xl font-extrabold", card.colorClass)}>
                {card.count}
              </p>
              {card.sublabel ? (
                <p className="text-muted-foreground mt-1 text-xs">
                  {card.sublabel}
                </p>
              ) : (
                <p className="text-muted-foreground mt-1 text-sm">
                  meals today
                </p>
              )}
            </CardContent>
          </Card>
        ))}

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
    </>
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
