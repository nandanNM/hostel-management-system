"use client"

import { Fragment, useEffect, useState } from "react"
import Link from "next/link"
import { NavItems } from "@/data/nav-data"
import { RiArrowLeftDoubleLine, RiArrowRightDoubleLine } from "@remixicon/react"
import { useQuery } from "@tanstack/react-query"

import kyInstance from "@/lib/ky"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function SideNav() {
  const navItems = NavItems()
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("sidebarExpanded")
      if (saved !== null) {
        setIsSidebarExpanded(JSON.parse(saved))
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "sidebarExpanded",
        JSON.stringify(isSidebarExpanded)
      )
    }
  }, [isSidebarExpanded])

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded)
  }
  const { data: unreadCount } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () =>
      kyInstance.get("/api/user/notifications/unread-count").json<number>(),
  })

  return (
    <div>
      <div
        className={cn(
          isSidebarExpanded ? "w-[200px]" : "w-[68px]",
          "bg-sidebar hidden h-full transform border-r transition-all duration-300 ease-in-out sm:flex"
        )}
      >
        <aside className="flex h-full w-full columns-1 flex-col overflow-x-hidden px-4 break-words">
          {/* Top */}
          <div className="relative mt-4 pb-2">
            <div className="flex flex-col space-y-2">
              {navItems.map((item, idx) => {
                if (item.position === "top") {
                  return (
                    <Fragment key={idx}>
                      <div className="space-y-1">
                        <SideNavItem
                          label={item.name}
                          icon={item.icon}
                          path={item.href}
                          active={item.active}
                          isSidebarExpanded={isSidebarExpanded}
                          unreadCount={unreadCount}
                        />
                      </div>
                    </Fragment>
                  )
                }
              })}
            </div>
          </div>
          {/* Bottom */}
          <div className="sticky bottom-0 mt-auto mb-4 block whitespace-nowrap transition duration-200">
            {navItems.map((item, idx) => {
              if (item.position === "bottom") {
                return (
                  <Fragment key={idx}>
                    <div className="space-y-1">
                      <SideNavItem
                        label={item.name}
                        icon={item.icon}
                        path={item.href}
                        active={item.active}
                        isSidebarExpanded={isSidebarExpanded}
                        unreadCount={unreadCount}
                      />
                    </div>
                  </Fragment>
                )
              }
            })}
          </div>
        </aside>
        <div className="relative mt-[calc(calc(90vh)-40px)]">
          <button
            type="button"
            className="border-muted-foreground/20 bg-accent absolute right-[-12px] bottom-32 flex h-6 w-6 items-center justify-center rounded-full border shadow-md transition-shadow duration-300 ease-in-out hover:shadow-lg"
            onClick={toggleSidebar}
          >
            {isSidebarExpanded ? (
              <RiArrowLeftDoubleLine
                size={16}
                className="stroke-foreground cursor-pointer"
              />
            ) : (
              <RiArrowRightDoubleLine
                size={16}
                className="stroke-foreground cursor-pointer"
              />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export const SideNavItem: React.FC<{
  label: string
  icon: React.ReactNode
  path: string
  active: boolean
  isSidebarExpanded: boolean
  unreadCount?: number
}> = ({ label, icon, path, active, isSidebarExpanded, unreadCount = 0 }) => {
  // featch unread count
  return (
    <>
      {isSidebarExpanded ? (
        <Link
          href={path}
          className={`relative flex h-full items-center rounded-md whitespace-nowrap ${
            active
              ? "font-base bg-neutral-200 text-sm text-neutral-700 shadow-sm dark:bg-neutral-800 dark:text-white"
              : "text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
          }`}
        >
          <div className="font-base relative flex flex-row items-center space-x-2 rounded-md px-2 py-1.5 text-sm duration-100">
            {icon}
            {label === "Notifications" && unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground absolute top-2.5 -right-12 rounded-full px-1 text-xs font-medium tabular-nums">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
            <span>{label}</span>
          </div>
        </Link>
      ) : (
        <TooltipProvider delayDuration={70}>
          <Tooltip>
            <TooltipTrigger>
              <Link
                href={path}
                className={`relative flex h-full items-center rounded-md whitespace-nowrap ${
                  active
                    ? "font-base bg-neutral-200 text-sm text-neutral-700 dark:bg-neutral-800 dark:text-white"
                    : "text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                }`}
              >
                <div className="font-base relative flex flex-row items-center space-x-2 rounded-md p-2 text-sm duration-100">
                  {icon}
                  {label === "Notifications" && unreadCount > 0 && (
                    <span className="bg-primary text-primary-foreground absolute top-1 right-3 rounded-full px-1 text-xs font-medium tabular-nums">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent
              side="left"
              className="px-3 py-1.5 text-xs"
              sideOffset={10}
            >
              <span>{label}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </>
  )
}
