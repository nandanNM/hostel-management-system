import AuthProvider from "@/context/AuthProvider";
import NavBar from "@/components/NavBar";
import SideNav from "@/components/SideNav";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();
  if (!session.user.onboarding) return redirect("/onboarding/identity");
  return (
    <AuthProvider>
      <NavBar />
      <div className="flex">
        <SideNav />
        <div className="w-full overflow-x-auto">
          <div className="overflow-auto sm:h-[calc(99vh-60px)]">
            <div className="h-[calc(100vh - 120px)] relative mx-auto flex w-full justify-center overflow-auto overflow-y-auto">
              <div className="w-full p-4 md:max-w-7xl md:p-5">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
