import * as React from "react"

import { cn } from "@/lib/utils"

export function PageContainer({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("w-full space-y-6", className)} {...props}>
      {children}
    </div>
  )
}

export function PageHeader({
  icon: Icon,
  title,
  description,
}: {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      {Icon ? <Icon className="h-6 w-6 shrink-0" /> : null}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-muted-foreground mt-1">{description}</p>
        ) : null}
      </div>
    </div>
  )
}
