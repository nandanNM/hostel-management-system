"use client";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import UserButton from "./UserButton";
import { Button } from "./ui/button";
import { useState } from "react";
import { NavItems } from "@/data/nav-data";
import { Menu } from "lucide-react";

export default function NavBar() {
  const session = useSession();
  const user = session.data?.user;
  const navItems = NavItems();
  const [isOpen, setIsOpen] = useState(false);
  return (
    <header className="border-grid bg-sidebar supports-[backdrop-filter]:bg-sidebar/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <nav className="mx-auto flex h-14 w-full max-w-7xl shrink-0 items-center justify-between gap-3">
        <div className="ml-4 flex items-center gap-3">
          <button onClick={() => setIsOpen(true)} className="block sm:hidden">
            <Menu size={24} />
          </button>
          <MobileNav
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            navItems={navItems}
          />
          <Link href="/" className="font-bold">
            Next-PG1 v5
          </Link>
        </div>
        {user && <UserButton user={user} />}
        {!user && session.status !== "loading" && <SignInButton />}
      </nav>
    </header>
  );
}

function SignInButton() {
  return <Button onClick={() => signIn()}>Sign in</Button>;
}

interface MobileNavProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  navItems: {
    name: string;
    href: string;
    icon: React.ReactNode;
    active: boolean;
    position: string;
  }[];
}
function MobileNav({ isOpen, setIsOpen, navItems }: MobileNavProps) {
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="left" className="block md:hidden">
        <SheetTitle />
        <div className="mt-4 flex h-fit w-full flex-col gap-1 overflow-y-auto p-3">
          {navItems.map((navItem, idx) => (
            <Link
              key={idx}
              href={navItem.href}
              onClick={() => setIsOpen(false)}
              className={`relative flex h-full items-center rounded-md whitespace-nowrap ${
                navItem.active
                  ? "font-base bg-neutral-200 text-sm text-neutral-700 shadow-sm dark:bg-neutral-800 dark:text-white"
                  : "text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
              }`}
            >
              <div className="font-base relative flex flex-row items-center space-x-2 rounded-md px-2 py-1.5 text-sm duration-100">
                {navItem.icon}
                <span>{navItem.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
