"use client"

import { LogOut, Settings, User } from "lucide-react"

import { ThemeSwitcher } from "../ThemeSwitcher"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { SidebarTrigger } from "../ui/sidebar"
import UserAvatar from "../UserAvatar"

const Navbar = () => {
  return (
    <nav className="bg-background sticky top-0 z-10 mx-auto flex h-16 w-full max-w-7xl items-center justify-between p-4">
      {/* LEFT */}
      <SidebarTrigger />
      <div className="flex items-center gap-4">
        <ThemeSwitcher />
        {/* USER MENU */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <UserAvatar avatarUrl="https://avatars.githubusercontent.com/u/1486366" />
          </DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={10}>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-[1.2rem] w-[1.2rem]" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-[1.2rem] w-[1.2rem]" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive">
              <LogOut className="mr-2 h-[1.2rem] w-[1.2rem]" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}

export default Navbar
