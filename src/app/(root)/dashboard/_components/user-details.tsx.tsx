import { cache, Suspense } from "react"
import { notFound } from "next/navigation"
import { MealPreference } from "@/types"
import {
  MapPin,
  User as UserIcon,
  ForkKnife as Utensils,
} from "@phosphor-icons/react/ssr"

import { formatIST } from "@/lib/date"
import { User } from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Loader } from "@/components/ui/loader"

import RecentTransactions from "./recent-transactions"

const getUserById = cache(async (userId: string) => {
  const foundUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!foundUser) notFound()
  return foundUser
})
interface UserDetailsProps {
  userId: string
}
export default async function UserDetails({ userId }: UserDetailsProps) {
  const user = await getUserById(userId)
  return (
    <div className="space-y-6">
      <Suspense
        fallback={<Loader variant="spinner" size={20} className="mx-auto" />}
      >
        <RecentTransactions userId={userId} />
        <UserDataCard user={user} />
      </Suspense>
    </div>
  )
}

interface UserDataCardProps {
  user: User
}

async function UserDataCard({ user }: UserDataCardProps) {
  return (
    <Card className="shadow-lg">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 gap-0 md:grid-cols-3">
          {/* Personal Info */}
          <div className="border-border border-r p-4">
            <div className="mb-3 flex items-center gap-2">
              <UserIcon className="text-muted-foreground h-4 w-4" />
              <span className="text-foreground text-sm font-semibold">
                Personal Info
              </span>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-muted-foreground text-xs">Name</p>
                <p className="text-foreground text-sm font-medium">
                  {user.name}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Date of Birth</p>
                <p className="text-foreground text-sm font-medium">
                  {formatIST(user.dob ?? new Date(), "dd/MM/yyyy")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Phone</p>
                <p className="text-foreground text-sm font-medium">
                  +91 {user.selfPhNo}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Email</p>
                <p className="text-foreground text-sm font-medium">
                  {user.email}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Religion</p>
                <p className="text-foreground text-sm font-medium">
                  {user.religion}
                </p>
              </div>
            </div>
          </div>

          {/* Address & Location */}
          <div className="border-border border-r p-4">
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="text-muted-foreground h-4 w-4" />
              <span className="text-foreground text-sm font-semibold">
                Address
              </span>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-muted-foreground text-xs">Full Address</p>
                <p className="text-foreground text-sm font-medium text-balance">
                  {user.address}
                </p>
              </div>
            </div>
          </div>

          {/* Meal Info */}
          {user.mealPreference &&
            typeof user.mealPreference === "object" &&
            !Array.isArray(user.mealPreference) &&
            (() => {
              const meal = user.mealPreference as unknown as MealPreference
              return (
                <div className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Utensils className="text-muted-foreground h-4 w-4" />
                    <span className="text-foreground text-sm font-semibold">
                      Meal Plan
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-muted-foreground text-xs">Meal Type</p>
                      <Badge variant="secondary" className="text-xs">
                        {meal.type}
                      </Badge>
                    </div>

                    {meal.type === "NON_VEG" && (
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Non Veg Type
                        </p>
                        <p className="text-foreground text-sm font-medium">
                          {meal.nonVegType}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-muted-foreground text-xs">
                        Meal Message
                      </p>
                      <p className="text-foreground text-sm font-medium">
                        {meal.message || "No meal message yet"}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground text-xs">
                        Joined Date
                      </p>
                      <p className="text-foreground text-sm font-medium">
                        Boarder since {formatIST(user.createdAt, "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })()}
        </div>
      </CardContent>
    </Card>
  )
}
