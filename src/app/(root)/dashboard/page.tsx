import { Separator } from "@/components/ui/separator";
import MealTogleButton from "./_components/meal-togle-button";
import { Metadata } from "next";
import ActionSidebar from "./_components/action-card";
import UserDataCard from "./_components/user-data-card";
import OverviewCards from "./_components/overview";
import { P } from "@/components/custom/p";
import { requireUser } from "@/lib/require-user";
import { cache } from "react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import RecentTransactions from "./_components/recent-transactions";

export const metadata: Metadata = {
  title: "Dashboard",
};
const getUserById = cache(async (userId: string) => {
  const foundUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!foundUser) notFound();
  return foundUser;
});

export default async function Page() {
  const { user: sessionUser } = await requireUser();

  if (sessionUser.status === "INACTIVE")
    return (
      <div className="w-full md:mx-8 lg:mx-auto">
        <P className="text-destructive text-center text-balance">
          You are not a boarder member and cannot access this page please
          contact the admin or a boarder member
        </P>
      </div>
    );
  if (sessionUser.status === "BANNED")
    return (
      <div className="w-full md:mx-8 lg:mx-auto">
        <P className="text-destructive text-center text-balance">
          You are banned and cannot access this page please contact the admin
        </P>
      </div>
    );
  const user = await getUserById(sessionUser.id as string);
  return (
    <div className="w-full md:mx-8 lg:mx-auto">
      <h2 className="mb-4 font-bold">User Dashboard</h2>
      <MealTogleButton />
      <Separator />
      <div className="mx-auto max-w-7xl px-2 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.name}! 👋
          </h2>
          <p className="text-gray-600">
            Here&apos;s your mess account overview
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <OverviewCards />
            <RecentTransactions userId={user.id} />
            <UserDataCard user={user} />
          </div>
          {/* UserActions */}
          <ActionSidebar user={user} />
        </div>
      </div>
    </div>
  );
}
