"use client"

import { Cake } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"

import kyInstance from "@/lib/ky"
import { Announcement } from "@/components/custom/announcement"

type UpcomingBirthday = {
  id: string
  name: string | null
  image: string | null
  daysUntil: number
}

function label(daysUntil: number) {
  if (daysUntil === 0) return "has a birthday today! 🎉"
  if (daysUntil === 1) return "has a birthday tomorrow 🎂"
  return `has a birthday in ${daysUntil} days 🎂`
}

export function BirthdayAnnouncements() {
  const { data } = useQuery({
    queryKey: ["birthdays", "upcoming"],
    queryFn: () =>
      kyInstance.get("/api/user/birthdays").json<UpcomingBirthday[]>(),
    refetchOnWindowFocus: false,
  })

  if (!data || data.length === 0) return null

  return (
    <div className="space-y-2">
      {data.map((b) => (
        <Announcement
          key={b.id}
          icon={<Cake className="text-primary" size={18} weight="fill" />}
        >
          <span className="text-foreground font-medium">
            {b.name ?? "A boarder"}
          </span>{" "}
          {label(b.daysUntil)}
        </Announcement>
      ))}
    </div>
  )
}
