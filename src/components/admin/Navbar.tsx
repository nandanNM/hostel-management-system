"use client"

import Link from "next/link"
import { Bell } from "@phosphor-icons/react"

import { ThemeSwitcher } from "../ThemeSwitcher"
import { SidebarTrigger } from "../ui/sidebar"

const Navbar = () => {
  return (
    <nav className="bg-background sticky top-0 z-10 mx-auto flex h-16 w-full items-center justify-between p-4">
      {/* LEFT */}
      <SidebarTrigger />
      <div className="flex items-center gap-4">
        <Link
          href="/manager/notifications"
          className="text-muted-foreground hover:text-foreground mr-2 transition-colors"
        >
          <Bell size={20} />
        </Link>
        <ThemeSwitcher />
      </div>
    </nav>
  )
}

export default Navbar
