"use client"

import Link from "next/link"
import {
  CookingPot as ChefHat,
  Egg,
  Fish,
  Leaf,
  TrendUp as TrendingUp,
  ForkKnife as Utensils,
} from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"

import { formatIST } from "@/lib/date"
import type { DailyMealActivity, User } from "@/lib/generated/prisma"
import kyInstance from "@/lib/ky"
import { toast } from "@/lib/toast"
import { cn, formatRelativeDate } from "@/lib/utils"
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import LoadingButton from "@/components/LoadingButton"

import { useGenerateMealData } from "../_lib/mutations"

type DailyMealActivityWithGenerator = DailyMealActivity & {
  generatedBy: Pick<User, "id" | "name" | "image"> | null
}

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
      kyInstance
        .get("/api/manager/meal")
        .json<DailyMealActivityWithGenerator>(),
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
            ? `Today's meal statistics and requirements, generated ${formatRelativeDate(new Date(mealData.createdAt))}${
                mealData.generatedBy
                  ? ` by ${mealData.generatedBy.name ?? "a manager"}`
                  : ""
              }`
            : "Generate and view today's meal statistics and requirements"}
        </CardDescription>
        {mealData?.generatedBy && (
          <p className="text-muted-foreground text-xs">
            {formatIST(mealData.createdAt, "dd MMM yyyy, hh:mm a")}
          </p>
        )}
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

type Bucket = "VEG" | "CHICKEN" | "FISH" | "EGG"

type MealCardItem = {
  bucket: Bucket
  label: string
  sublabel?: string
  count: number
  icon: React.ReactNode
  colorClass: string
  bgClass: string
}

function MealBreakdownCards({ mealData }: { mealData: DailyMealActivity }) {
  const serving = mealData.actualNonVegServed

  const cards: MealCardItem[] = []

  if (serving === "CHICKEN" || serving === "FISH" || serving === "EGG") {
    // Priority-based day: show each type with context labels
    if (serving === "CHICKEN") {
      cards.push({
        bucket: "CHICKEN",
        label: "Chicken",
        count: mealData.totalNonvegChicken,
        icon: <Utensils className="h-5 w-5 text-orange-600" />,
        colorClass: "text-orange-600",
        bgClass: "bg-orange-600/10",
      })
      cards.push({
        bucket: "FISH",
        label: "Fish",
        sublabel: "dislikes Chicken",
        count: mealData.totalNonvegFish,
        icon: <Fish className="h-5 w-5 text-blue-500" />,
        colorClass: "text-blue-500",
        bgClass: "bg-blue-500/10",
      })
      cards.push({
        bucket: "EGG",
        label: "Egg",
        sublabel: "dislikes Chicken & Fish",
        count: mealData.totalNonvegEgg,
        icon: <Egg className="h-5 w-5 text-yellow-500" />,
        colorClass: "text-yellow-500",
        bgClass: "bg-yellow-500/10",
      })
    } else if (serving === "FISH") {
      cards.push({
        bucket: "FISH",
        label: "Fish",
        count: mealData.totalNonvegFish,
        icon: <Fish className="h-5 w-5 text-blue-500" />,
        colorClass: "text-blue-500",
        bgClass: "bg-blue-500/10",
      })
      cards.push({
        bucket: "EGG",
        label: "Egg",
        sublabel: "dislikes Fish",
        count: mealData.totalNonvegEgg,
        icon: <Egg className="h-5 w-5 text-yellow-500" />,
        colorClass: "text-yellow-500",
        bgClass: "bg-yellow-500/10",
      })
    } else if (serving === "EGG") {
      cards.push({
        bucket: "EGG",
        label: "Egg",
        count: mealData.totalNonvegEgg,
        icon: <Egg className="h-5 w-5 text-yellow-500" />,
        colorClass: "text-yellow-500",
        bgClass: "bg-yellow-500/10",
      })
    }

    cards.push({
      bucket: "VEG",
      label: "Vegetarian",
      sublabel: serving !== "EGG" ? "incl. all fallbacks" : undefined,
      count: mealData.totalVeg,
      icon: <Leaf className="h-5 w-5 text-green-600" />,
      colorClass: "text-green-600",
      bgClass: "bg-green-600/10",
    })
  } else {
    // No schedule or veg day: show simple Veg / Non-Veg split
    cards.push({
      bucket: "VEG",
      label: "Vegetarian",
      count: mealData.totalVeg,
      icon: <Leaf className="h-5 w-5 text-green-600" />,
      colorClass: "text-green-600",
      bgClass: "bg-green-600/10",
    })
    if (mealData.totalNonvegChicken > 0) {
      cards.push({
        bucket: "CHICKEN",
        label: "Non-Vegetarian",
        count: mealData.totalNonvegChicken,
        icon: <Utensils className="h-5 w-5 text-orange-600" />,
        colorClass: "text-orange-600",
        bgClass: "bg-orange-600/10",
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
      <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", cols)}>
        {cards.map((card) => (
          <Link
            key={card.label}
            href={`/manager/meal-breakdown?mealTime=${mealData.mealTime}&bucket=${card.bucket}&date=${encodeURIComponent(String(mealData.date))}`}
          >
            <Card className="bg-card hover:border-primary/40 gap-0 py-0 shadow-none transition-shadow hover:shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl",
                    card.bgClass
                  )}
                >
                  {card.icon}
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-3xl leading-none font-bold tabular-nums",
                      card.colorClass
                    )}
                  >
                    {card.count}
                  </p>
                  <p className="mt-1.5 text-sm font-medium">{card.label}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {card.sublabel ?? "meals today"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {/* Total Meals Card */}
        <Card className="from-primary/10 border-primary/20 gap-0 bg-linear-to-br to-transparent py-0 shadow-none">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="bg-primary/15 flex size-11 shrink-0 items-center justify-center rounded-xl">
              <ChefHat className="text-primary h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-primary text-3xl leading-none font-bold tabular-nums">
                {mealData.totalMeal}
              </p>
              <p className="mt-1.5 text-sm font-medium">Total Meals</p>
              <p className="text-muted-foreground truncate text-xs">
                incl. {mealData.totalGuestMeal} guest meal
                {mealData.totalGuestMeal === 1 ? "" : "s"}
              </p>
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
