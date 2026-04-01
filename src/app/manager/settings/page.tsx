import { Metadata } from "next"
import Link from "next/link"
import { Calendar, Utensils } from "lucide-react"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Manager Settings",
  description: "Configure your hostel management application.",
}

export default function SettingsPage() {
  const settings = [
    {
      title: "Meal Scheduling",
      description: "Manage the menu items and schedule meals for each day.",
      href: "/manager/settings/meal-scheduling",
      icon: Calendar,
    },
    // Add more section here later
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Management Settings</h1>
        <p className="text-muted-foreground">
          Global configuration and scheduling options for the hostel.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settings.map((item) => (
          <Link key={item.href} href={item.href} className="group">
            <Card className="transition-all hover:bg-accent hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2 text-primary group-hover:bg-primary/20">
                    <item.icon size={24} />
                  </div>
                  <div className="space-y-1">
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
