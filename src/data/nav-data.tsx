import { usePathname } from "next/navigation"
import {
  ChartBar as BarChart3,
  Bell,
  GraduationCap,
  House as Home,
  ClipboardText as Logs,
  ForkKnife as Utensils,
} from "@phosphor-icons/react/ssr"
import { RiDashboardLine, RiToolsFill } from "@remixicon/react"

export const NavItems = () => {
  const pathname = usePathname()
  function isNavItemActive(pathname: string, nav: string) {
    return pathname.includes(nav)
  }

  return [
    {
      name: "Home",
      href: "/",
      icon: <Home size={20} />,
      active: pathname === "/",
      position: "top",
    },
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <RiDashboardLine size={20} />,
      active: isNavItemActive(pathname, "/dashboard"),
      position: "top",
    },
    {
      name: "Guest Meal",
      href: "/guest-meal",
      icon: <Utensils size={20} />,
      active: isNavItemActive(pathname, "/guest-meal"),
      position: "top",
    },
    {
      name: "Meal Count",
      href: "/meal-count",
      icon: <BarChart3 size={20} />,
      active: isNavItemActive(pathname, "/meal-count"),
      position: "top",
    },
    {
      name: "Alumni",
      href: "/alumni",
      icon: <GraduationCap size={20} />,
      active: isNavItemActive(pathname, "/alumni"),
      position: "top",
    },
    {
      name: "Activity",
      href: "/activity",
      icon: <Logs size={20} />,
      active: isNavItemActive(pathname, "/activity"),
      position: "top",
    },
    {
      name: "Notifications",
      href: "/notifications",
      icon: <Bell size={20} />,
      active: isNavItemActive(pathname, "/notifications"),
      position: "top",
    },

    {
      name: "Settings",
      href: "/settings",
      icon: <RiToolsFill size={20} />,
      active: isNavItemActive(pathname, "/settings"),
      position: "bottom",
    },
  ]
}
