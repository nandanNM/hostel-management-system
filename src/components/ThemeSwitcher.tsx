"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeSwitcher({ className }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <div
      className={cn(
        "flex h-8 w-16 cursor-pointer rounded-full p-1 transition-all duration-300",
        isDark
          ? "bg-muted border-border border"
          : "bg-background border-border border",
        className,
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      role="button"
      tabIndex={0}
    >
      <div className="flex w-full items-center justify-between">
        <div
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-300",
            isDark
              ? "bg-accent translate-x-0 transform"
              : "bg-muted translate-x-8 transform",
          )}
        >
          {isDark ? (
            <Moon
              className="text-accent-foreground h-4 w-4"
              strokeWidth={1.5}
            />
          ) : (
            <Sun className="text-foreground h-4 w-4" strokeWidth={1.5} />
          )}
        </div>
        <div
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-300",
            isDark ? "bg-transparent" : "-translate-x-8 transform",
          )}
        >
          {isDark ? (
            <Sun className="text-muted-foreground h-4 w-4" strokeWidth={1.5} />
          ) : (
            <Moon className="text-foreground h-4 w-4" strokeWidth={1.5} />
          )}
        </div>
      </div>
    </div>
  );
}
