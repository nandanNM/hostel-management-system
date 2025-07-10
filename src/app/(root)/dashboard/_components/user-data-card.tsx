import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Utensils } from "lucide-react";
import { SelectUserModel } from "@/db/schemas/user";
import { cache } from "react";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { meal } from "@/db/schemas";
import { formatDate } from "date-fns";
interface UserDataCardProps {
  user: SelectUserModel;
}
const getUserMeal = cache(async (userId: string) => {
  const foundMeal = await db.query.meal.findFirst({
    where: eq(meal.userId, userId),
  });
  return foundMeal;
});

export default async function UserDataCard({ user }: UserDataCardProps) {
  const meal = await getUserMeal(user.id);
  return (
    <Card className="shadow-lg">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 gap-0 md:grid-cols-3">
          {/* Personal Info */}
          <div className="border-r border-gray-200 p-4">
            <div className="mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">
                Personal Info
              </span>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="text-sm font-medium">{user.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Date of Birth</p>
                <p className="text-sm font-medium">{user.dob}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-medium">+91 {user.selfPhNo}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium">{user.email}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Religion</p>
                <p className="text-sm font-medium">{user.religion}</p>
              </div>
            </div>
          </div>

          {/* Address & Location */}
          <div className="border-r border-gray-200 p-4">
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">
                Address
              </span>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Full Adddress</p>
                <p className="text-sm font-medium">{user.address}</p>
              </div>
            </div>
          </div>

          {/* Meal Info */}
          {meal && (
            <div className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Utensils className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">
                  Meal Plan
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Meal Type</p>
                  <Badge variant="secondary" className="text-xs">
                    {meal.mealType}
                  </Badge>
                </div>
                {meal.mealType === "non-veg" && (
                  <div>
                    <p className="text-xs text-gray-500">Non Veg Type</p>
                    <p className="text-sm font-medium">{meal.nonVegType}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Meal Time</p>
                  <p className="text-sm font-medium">{meal.mealTime}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Meal Massage</p>
                  <p className="text-sm font-medium">
                    {meal.mealMassage
                      ? meal.mealMassage
                      : "No meal massage yeat"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Joined Date</p>
                  <p className="text-sm font-medium">
                    Border since {formatDate(user.createdAt, "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
