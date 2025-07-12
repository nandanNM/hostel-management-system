import { usePathname } from "next/navigation";
import { Bell, Home } from "lucide-react";
import { RiDashboardLine, RiToolsFill } from "@remixicon/react";

export const NavItems = () => {
  const pathname = usePathname();
  function isNavItemActive(pathname: string, nav: string) {
    return pathname.includes(nav);
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
  ];
};
