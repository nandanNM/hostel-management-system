import { type ReactNode } from "react"

import { cn } from "@/lib/utils"

export function Announcement({
  icon,
  children,
  className,
}: {
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("rounded-md border px-4 py-3", className)}>
      <div className="flex items-start gap-3 text-sm">
        {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
