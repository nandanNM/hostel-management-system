"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  ChartBar,
  CaretUp as ChevronUp,
  ClipboardText as ClipboardList,
  EnvelopeSimple,
  FileText as FileCheck,
  Gavel,
  House as Home,
  SignOut as LogOut,
  Megaphone,
  Plus,
  ProjectorScreen as Projector,
  Receipt,
  GearSix as Settings2,
  UserCheck,
  UserGear as UserCog,
  Users,
  ForkKnife as UtensilsCrossed,
  Wallet,
} from "@phosphor-icons/react"
import { User } from "next-auth"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

import { Separator } from "../ui/separator"
import UserAvatar from "../UserAvatar"

interface AppSideBarProps {
  state: "ADMIN" | "MANAGER" | "MESS_PREFECT"
  user: User
}

const BASE_PATH: Record<AppSideBarProps["state"], string> = {
  ADMIN: "/admin",
  MANAGER: "/manager",
  MESS_PREFECT: "/mess-prefect",
}

export default function AppSideBar({ state, user }: AppSideBarProps) {
  const basePath = BASE_PATH[state]
  const isMessPrefect = state === "MESS_PREFECT"
  const showReports = state === "MANAGER" || isMessPrefect

  // When viewing a single user (…/users/{id}[/section]) the sidebar swaps to
  // that user's sections so all navigation stays in the sidebar (no tabs).
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  const onUserDetail = segments[1] === "users" && Boolean(segments[2])
  const detailUserId = onUserDetail ? segments[2] : null
  const userBase = `${basePath}/users/${detailUserId}`
  const userNav = [
    { title: "Overview", href: userBase, icon: ClipboardList },
    { title: "Payments", href: `${userBase}/payments`, icon: Receipt },
    { title: "Meals", href: `${userBase}/meals`, icon: UtensilsCrossed },
    { title: "Guest Meals", href: `${userBase}/guest-meals`, icon: Users },
    { title: "Fines", href: `${userBase}/fines`, icon: Gavel },
  ]

  // Grouped by what the work actually is, not by when the item was added:
  // Overview (who's here / what needs action) → Meals (day-to-day ops) →
  // Finance (money, MessPrefect only) → Administration (staff, MessPrefect
  // only) → Activity (audit trail) → Settings.
  //
  // Home is a Manager/Admin entry only. MessPrefect gets Approvals +
  // Invitations in Overview instead.
  const overviewItems = [
    ...(isMessPrefect ? [] : [{ title: "Home", url: "/", icon: Home }]),
    { title: "Users", url: "users", icon: Users },
    ...(isMessPrefect
      ? [
          { title: "Approvals", url: "approvals", icon: UserCheck },
          { title: "Invitations", url: "invitations", icon: EnvelopeSimple },
        ]
      : []),
  ]

  const mealItems = [
    { title: "Calendar", url: "calander", icon: Calendar },
    { title: "Guest Meal Logs", url: "guest-meal-logs", icon: UtensilsCrossed },
    { title: "Monthly Meals", url: "reports/monthly-meals", icon: ChartBar },
  ]

  const financeItems = [
    { title: "Billing", url: "billing", icon: Receipt },
    { title: "Transactions", url: "transactions", icon: Wallet },
  ]

  const administrationItems = [
    { title: "Change Roles", url: "roles", icon: UserCog },
    { title: "Send Notification", url: "notify", icon: Megaphone },
  ]

  const activityItems = [
    { title: "Activity Logs", url: "logs", icon: ClipboardList },
  ]

  const settingsItems = [
    { title: "Settings", url: "settings", icon: Settings2 },
  ]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              asChild
            >
              <Link href="/">
                <UserAvatar size={32} avatarUrl={user.image} />
                <span className="truncate data-[state=collapsed]:hidden">
                  {user.name}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        {onUserDetail && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href={`${basePath}/users`}>
                      <ArrowLeft />
                      <span>Back to users</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
            <SidebarGroupLabel>User</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {userNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {!onUserDetail && (
          <>
            <SidebarNavGroup
              label="Overview"
              items={overviewItems}
              basePath={basePath}
            />
            <SidebarNavGroup
              label="Meals"
              items={mealItems}
              basePath={basePath}
            />
            {isMessPrefect && (
              <SidebarNavGroup
                label="Finance"
                items={financeItems}
                basePath={basePath}
              />
            )}
            {isMessPrefect && (
              <SidebarNavGroup
                label="Administration"
                items={administrationItems}
                basePath={basePath}
              />
            )}
            {showReports && (
              <SidebarNavGroup
                label="Activity"
                items={activityItems}
                basePath={basePath}
              />
            )}
            <SidebarNavGroup
              label="Preferences"
              items={settingsItems}
              basePath={basePath}
            />
            {state === "ADMIN" && (
              <>
                {/* users */}
                <SidebarGroup>
                  <SidebarGroupLabel>Users</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href={`/${state.toLocaleLowerCase()}/users`}>
                            <Users />
                            See All Users
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
                {/* payments */}
                <SidebarGroup>
                  <SidebarGroupLabel>Payments</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href={`/${state.toLocaleLowerCase()}/payments`}>
                            <Projector />
                            See All Payments
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/#">
                            <Plus />
                            Add Payment
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
                {/* audits */}
                <SidebarGroup>
                  <SidebarGroupLabel>Audits</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href={`/${state.toLocaleLowerCase()}/audits`}>
                            <FileCheck />
                            See All Audits
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href={`${state.toLocaleLowerCase()}/audit`}>
                            <Plus />
                            Add Audit
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </>
            )}
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <UserAvatar size={32} avatarUrl={user.image} />
                  <span className="truncate data-[state=collapsed]:hidden">
                    {user.name}
                  </span>
                  <ChevronUp className="ml-auto data-[state=collapsed]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    href={`${basePath}/settings`}
                    className="flex w-full items-center"
                  >
                    <Settings2 className="mr-2 h-[1.2rem] w-[1.2rem]" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <Link href="/api/auth/signout?callbackUrl=/login">
                    <button className="flex w-full items-center">
                      <LogOut className="text-destructive mr-2 h-[1.2rem] w-[1.2rem]" />
                      Sign Out
                    </button>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarRail />
      </SidebarFooter>
    </Sidebar>
  )
}

type NavItem = { title: string; url: string; icon: React.ElementType }

function SidebarNavGroup({
  label,
  items,
  basePath,
}: {
  label: string
  items: NavItem[]
  basePath: string
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const href = item.url === "/" ? basePath : `${basePath}/${item.url}`
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={pathname === href}>
                  <Link href={href}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
