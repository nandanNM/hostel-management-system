import { Separator } from "@/components/ui/separator";
import OverviewCardsSkeleton from "./_components/overview-cards-skeleton";
import MealTogleButton from "./_components/meal-togle-button";
import getSession from "@/lib/getSession";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { user } from "@/db/schemas";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Metadata } from "next";
import RecentTransactions from "./_components/recent-transactions";
import ActionSidebar from "./_components/action-card";
import UserDataCard from "./_components/user-data-card";

export const metadata: Metadata = {
  title: "Dashboard",
};
const getUserById = cache(async (userId: string) => {
  const foundUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });
  if (!foundUser) notFound();
  return foundUser;
});

export default async function Page() {
  const session = await getSession();
  if (!session?.user.id) return null;
  const user = await getUserById(session.user.id);
  console.log(user, "user");

  return (
    <div className="w-full md:mx-8 lg:mx-auto">
      <h2 className="mb-4 font-bold">User Dashboard</h2>
      <MealTogleButton />
      <Separator />
      <div className="mx-auto max-w-7xl px-2 py-8 sm:px-6 lg:px-8">
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
            <OverviewCardsSkeleton />
            <RecentTransactions />
            <UserDataCard user={user} />
          </div>
          {/* UserActions */}
          <ActionSidebar user={user} />
        </div>
      </div>
    </div>
  );
}
