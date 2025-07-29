import { cookies } from "next/headers"
import requireManager from "@/data/manager/require-manager"

import { SidebarProvider } from "@/components/ui/sidebar"
import AppSideBar from "@/components/admin/AppSideBar"
import Navbar from "@/components/admin/Navbar"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"
  await requireManager()
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
  )
}
