import Navbar from "@/components/admin/Navbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import AppSideBar from "@/components/admin/AppSideBar";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSideBar state="MANAGER" />
      <main className="w-full">
        <Navbar />
        <div className="p-3">
          <div>{children}</div>
        </div>
      </main>
    </SidebarProvider>
  );
}
