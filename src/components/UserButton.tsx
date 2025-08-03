import Image from "next/image"
import Link from "next/link"
import avatarPlaceholder from "@/assets/avatar-placeholder.png"
import { ChefHatIcon, Lock, LogOut, Settings2 } from "lucide-react"
import { signOut, useSession } from "next-auth/react"

import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"

export default function UserButton() {
  const session = useSession()
  const user = session.data?.user

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" className="flex-none rounded-full">
          <Image
            src={user?.image || avatarPlaceholder}
            alt="User profile picture"
            width={50}
            height={50}
            className="bg-background aspect-square rounded-full object-cover"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>
          Logged in as {user?.name || "User"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="#">
              <Settings2 className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          {user?.role === "ADMIN" && (
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <Lock className="mr-2 h-4 w-4" />
                Admin
              </Link>
            </DropdownMenuItem>
          )}
          {user?.role === "MANAGER" && (
            <DropdownMenuItem asChild>
              <Link href="/manager">
                <ChefHatIcon className="mr-2 h-4 w-4" />
                Manager Panel
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild variant="destructive">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center"
          >
            <LogOut className="mr-2 h-[1.2rem] w-[1.2rem]" />
            Sign Out
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
