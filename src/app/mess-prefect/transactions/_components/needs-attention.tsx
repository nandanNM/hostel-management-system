import Link from "next/link"
import type { Icon } from "@phosphor-icons/react"
import {
  CaretRight,
  CheckCircle,
  Receipt,
  Users,
} from "@phosphor-icons/react/ssr"

import { cn } from "@/lib/utils"

interface NeedsAttentionProps {
  overdueBills: number
  boardersWithDues: number
}

type AttentionItem = {
  label: string
  count: number
  href: string
  icon: Icon
}

/**
 * Only genuinely actionable items belong here. Unpaid fines are deliberately
 * absent: a fine charge already rolls into a boarder's balance, so listing it
 * separately would count the same money twice.
 */
export function NeedsAttention({
  overdueBills,
  boardersWithDues,
}: NeedsAttentionProps) {
  const items: AttentionItem[] = [
    {
      label: "Boarders with dues",
      count: boardersWithDues,
      href: "/mess-prefect/transactions/attention?type=dues",
      icon: Users,
    },
    {
      label: "Overdue bills",
      count: overdueBills,
      href: "/mess-prefect/transactions/attention?type=overdue",
      icon: Receipt,
    },
  ]

  const outstanding = items.filter((item) => item.count > 0)

  if (outstanding.length === 0) {
    return (
      <div className="flex items-center gap-2 py-2">
        <CheckCircle
          className="size-5 shrink-0 text-green-600 dark:text-green-400"
          weight="fill"
        />
        <p className="text-muted-foreground text-sm">
          Nothing needs attention right now.
        </p>
      </div>
    )
  }

  return (
    <ul className="-mx-2">
      {outstanding.map((item) => (
        <li key={item.label}>
          <Link
            href={item.href}
            className={cn(
              "hover:bg-accent flex items-center gap-3 rounded-lg px-2 py-2.5",
              "focus-visible:ring-ring outline-none focus-visible:ring-2"
            )}
          >
            <item.icon className="text-muted-foreground size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate text-sm">
              {item.label}
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {item.count}
            </span>
            <CaretRight className="text-muted-foreground size-3.5 shrink-0" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
