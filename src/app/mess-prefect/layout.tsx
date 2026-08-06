import { Metadata } from "next"
import { cookies } from "next/headers"
import requireMessPrefect from "@/data/mess-prefect/require-mess-prefect"

import { SidebarProvider } from "@/components/ui/sidebar"
import AppSideBar from "@/components/admin/AppSideBar"
import Navbar from "@/components/admin/Navbar"

export const metadata: Metadata = {
  title: "Mess Prefect",
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"
  const { user } = await requireMessPrefect()
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSideBar state="MESS_PREFECT" user={user} />
      <main className="w-full min-w-0">
        <Navbar />
        {children}
      </main>
    </SidebarProvider>
  )
}
