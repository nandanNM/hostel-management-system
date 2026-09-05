"use client"

import Link from "next/link"
import {
  CookingPot as ChefHat,
  Cow,
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
import {
  BUCKET_LABELS,
  bucketsForOffers,
  describeOffers,
  offersForRecord,
  type MealBucket,
} from "@/lib/meal-priority"
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

type BucketPresentation = {
  count: (data: DailyMealActivity) => number
  icon: React.ReactNode
  colorClass: string
  bgClass: string
}

/**
 * One entry per bucket, so a tier is added by adding a row rather than another
 * branch. Mutton had no entry at all: on a mutton night its boarders were
 * counted into total_veg and no card could show them.
 */
const BUCKET_PRESENTATION: Record<MealBucket, BucketPresentation> = {
  MUTTON: {
    count: (d) => d.totalNonvegMutton,
    icon: <Cow className="h-5 w-5 text-red-600" />,
    colorClass: "text-red-600",
    bgClass: "bg-red-600/10",
  },
  CHICKEN: {
    count: (d) => d.totalNonvegChicken,
    icon: <Utensils className="h-5 w-5 text-orange-600" />,
    colorClass: "text-orange-600",
    bgClass: "bg-orange-600/10",
  },
  FISH: {
    count: (d) => d.totalNonvegFish,
    icon: <Fish className="h-5 w-5 text-blue-500" />,
    colorClass: "text-blue-500",
    bgClass: "bg-blue-500/10",
  },
  EGG: {
    count: (d) => d.totalNonvegEgg,
    icon: <Egg className="h-5 w-5 text-yellow-500" />,
    colorClass: "text-yellow-500",
    bgClass: "bg-yellow-500/10",
  },
  VEG: {
    count: (d) => d.totalVeg,
    icon: <Leaf className="h-5 w-5 text-green-600" />,
    colorClass: "text-green-600",
    bgClass: "bg-green-600/10",
  },
}

type MealCardItem = {
  bucket: MealBucket
  label: string
  sublabel?: string
  count: number
  icon: React.ReactNode
  colorClass: string
  bgClass: string
}

/** "dislikes Chicken", "dislikes Chicken & Fish" — why a boarder dropped here. */
function fallbackReason(higher: MealBucket[]): string | undefined {
  if (higher.length === 0) return undefined
  const names = higher.map((tier) => BUCKET_LABELS[tier])
  const last = names.pop()
  return `dislikes ${names.length > 0 ? `${names.join(", ")} & ${last}` : last}`
}

function MealBreakdownCards({ mealData }: { mealData: DailyMealActivity }) {
  // What the day actually offered, recorded when the count was generated. The
  // drill-down reconstructs this the same way, so the cards and the lists they
  // link to cannot disagree - including on rows that predate the column.
  const offers = offersForRecord(
    mealData.offeredTypes ?? [],
    mealData.actualNonVegServed
  )
  const isLegacyUnknown = offers === null

  const buckets: MealBucket[] = isLegacyUnknown
    ? mealData.totalNonvegChicken > 0
      ? ["CHICKEN", "VEG"]
      : ["VEG"]
    : bucketsForOffers(offers)

  const cards: MealCardItem[] = buckets.map((bucket, index) => {
    const presentation = BUCKET_PRESENTATION[bucket]
    const higher = buckets.slice(0, index).filter((b) => b !== "VEG")

    return {
      bucket,
      label:
        isLegacyUnknown && bucket === "CHICKEN"
          ? "Non-Vegetarian"
          : BUCKET_LABELS[bucket],
      sublabel:
        bucket === "VEG"
          ? buckets.length > 2
            ? "incl. all fallbacks"
            : undefined
          : fallbackReason(higher),
      count: presentation.count(mealData),
      icon: presentation.icon,
      colorClass: presentation.colorClass,
      bgClass: presentation.bgClass,
    }
  })

  const dayLabel = offers === null ? null : describeOffers(offers)

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
            Serving today: {dayLabel}
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
