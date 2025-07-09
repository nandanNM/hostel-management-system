import { Separator } from "@/components/ui/separator";
import ProfileCard from "./_components/profile-card";
import OverviewCardsSkeleton from "./_components/overview-cards-skeleton";
import RecentTransactionsSkeleton from "./_components/recent-transactions-skeleton";
import MealTogleButton from "./_components/meal-togle-button";
import getSession from "@/lib/getSession";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { meal, user } from "@/db/schemas";

export default async function Dashboard() {
  const session = await getSession();
  if (!session?.user.id) return null;
  const userData = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });
  const mealStatus = await db.query.meal.findFirst({
    where: eq(meal.userId, session.user.id),
    columns: {
      isActive: true,
    },
  });
  console.log("mealStatus", mealStatus?.isActive, "userData", userData);

  return (
    <div className="w-full md:mx-8 lg:mx-auto">
      <h2 className="mb-4 font-bold">User Dashboard</h2>
      {/* <code>{JSON.stringify(userData)}</code>
      <code>{JSON.stringify(mealStatus)}</code> */}
      <MealTogleButton status={mealStatus?.isActive ?? false} />
      <Separator />
      <div className="mx-auto max-w-7xl px-2 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {session.user.name}! 👋
          </h2>
          <p className="text-gray-600">
            Here&apos;s your mess account overview
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            {/* Overview Cards */}
            <OverviewCardsSkeleton />
            {/* Recent Transactions */}
            <RecentTransactionsSkeleton />
          </div>
          {/* User Profile Card */}
          <ProfileCard />
        </div>
      </div>
    </div>
  );
}
