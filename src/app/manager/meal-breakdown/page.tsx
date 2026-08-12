import Link from "next/link"
import { notFound } from "next/navigation"
import requireManager from "@/data/manager/require-manager"
import { ArrowLeft, Users } from "@phosphor-icons/react/ssr"

import { MealTimeType } from "@/lib/generated/prisma"
import { Card, CardContent } from "@/components/ui/card"
import UserAvatar from "@/components/UserAvatar"

import {
  BUCKET_LABELS,
  getMealBreakdownUsers,
  type MealBucket,
} from "../_lib/meal-breakdown"

const MEAL_TIMES: string[] = ["LUNCH", "DINNER"]
const BUCKETS: string[] = Object.keys(BUCKET_LABELS)

export interface MealBreakdownPageProps {
  searchParams: Promise<{ mealTime?: string; bucket?: string }>
}

export default async function MealBreakdownPage({
  searchParams,
}: MealBreakdownPageProps) {
  await requireManager()

  const { mealTime, bucket } = await searchParams
  if (
    !mealTime ||
    !bucket ||
    !MEAL_TIMES.includes(mealTime) ||
    !BUCKETS.includes(bucket)
  ) {
    return notFound()
  }

  const users = await getMealBreakdownUsers(
    mealTime as MealTimeType,
    bucket as MealBucket
  )
  const label = BUCKET_LABELS[bucket as MealBucket]
  const mealLabel = mealTime === "LUNCH" ? "Lunch" : "Dinner"

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6">
      <div>
        <Link
          href="/manager"
          className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {label} — {mealLabel}
            </h1>
            <p className="text-muted-foreground mt-1">
              {users.length} boarder{users.length === 1 ? "" : "s"} having{" "}
              {label.toLowerCase()} today.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="divide-y p-0">
          {users.length === 0 && (
            <p className="text-muted-foreground py-10 text-center text-sm">
              No one in this category today.
            </p>
          )}
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-3 px-4 py-3">
              <UserAvatar size={36} avatarUrl={user.image} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {user.name ?? "Unnamed"}
                </p>
                {user.roomNo && (
                  <p className="text-muted-foreground text-xs">
                    Room {user.roomNo}
                  </p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
