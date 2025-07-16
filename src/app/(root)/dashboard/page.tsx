import { Separator } from "@/components/ui/separator";
import MealTogleButton from "./_components/meal-togle-button";
import { Metadata } from "next";
import ActionSidebar from "./_components/action-card";
import UserDataCard from "./_components/user-data-card";
import OverviewCards from "./_components/overview";
import { P } from "@/components/custom/p";
import { requireUser } from "@/lib/require-user";

export const metadata: Metadata = {
  title: "Dashboard",
};
// const getUserById = cache(async (userId: string) => {
//   const foundUser = await db.query.user.findFirst({
//     where: eq(user.id, userId),
//   });
//   if (!foundUser) notFound();
//   return foundUser;
// });

export default async function Page() {
  const session = await requireUser();
  // const user = await getUserById(session.user.id as string);
  const user = {
    //dumy data
    isBoader: true,
    isBanned: false,
    name: session.user.name,
    role: session.user.role,
  };
  if (!user.isBoader)
    return (
      <div className="w-full md:mx-8 lg:mx-auto">
        <P className="text-destructive text-center text-balance">
          You are not a boarder member and cannot access this page please
          contact the admin or a boarder member
        </P>
      </div>
    );
  if (user.isBanned)
    return (
      <div className="w-full md:mx-8 lg:mx-auto">
        <P className="text-destructive text-center text-balance">
          You are banned and cannot access this page please contact the admin
        </P>
      </div>
    );
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
            <OverviewCards />
            {/* <RecentTransactions userId={user.id} /> */}
            <UserDataCard user={user} />
          </div>
          {/* UserActions */}
          <ActionSidebar user={user} />
        </div>
      </div>
    </div>
  );
}
