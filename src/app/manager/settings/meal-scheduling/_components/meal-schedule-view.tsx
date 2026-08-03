"use client"

import { useState } from "react"
import {
  CaretDown as ChevronDown,
  Plus,
  Trash as Trash2,
  ForkKnife as Utensils,
} from "@phosphor-icons/react"

import {
  DayOfWeek,
  MealTimeType,
  MenuItem,
  type MealScheduleEntry,
} from "@/lib/generated/prisma"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  deleteMenuItem,
  seedDefaultMenuItems,
  upsertMealSchedule,
  upsertMenuItem,
} from "../_lib/actions"

type ScheduleEntry = MealScheduleEntry & {
  menuItems: { menuItem: MenuItem }[]
}

interface MealScheduleViewProps {
  initialMenuItems: MenuItem[]
  initialSchedule: ScheduleEntry[]
}

const DAYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]

function DayMealCard({
  day,
  meal,
  schedule,
  onOpen,
}: {
  day: DayOfWeek
  meal: MealTimeType
  schedule: ScheduleEntry[]
  onOpen: (day: DayOfWeek, meal: MealTimeType) => void
}) {
  const entry = schedule.find((s) => s.dayOfWeek === day && s.mealTime === meal)
  return (
    <Card
      className="group hover:border-primary/50 border-muted/60 cursor-pointer transition-all active:scale-[0.98]"
      onClick={() => onOpen(day, meal)}
    >
      <CardHeader className="p-2 sm:p-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground/80 text-[10px] font-bold tracking-widest uppercase sm:text-xs">
            {meal}
          </span>
          <ChevronDown className="h-3 w-3 opacity-30 transition-opacity group-hover:opacity-100" />
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-0 pb-2 sm:px-3 sm:pb-3">
        {entry?.menuItems && entry.menuItems.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {entry.menuItems.map((mi) => (
              <span
                key={mi.menuItem.id}
                className="bg-primary/5 border-primary/10 text-primary/80 inline-flex rounded-sm border px-1 py-0.5 text-[9px] font-semibold sm:text-[10px]"
              >
                {mi.menuItem.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground/50 text-[9px] italic sm:text-[10px]">
            Not Set
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default function MealScheduleView({
  initialMenuItems,
  initialSchedule,
}: MealScheduleViewProps) {
  const [menuItems] = useState(initialMenuItems)
  const [schedule] = useState(initialSchedule)
  const [isMenuItemModalOpen, setIsMenuItemModalOpen] = useState(false)
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null)

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [activeSlot, setActiveSlot] = useState<{
    day: DayOfWeek
    meal: MealTimeType
  } | null>(null)
  const [selectedMenuItemIds, setSelectedMenuItemIds] = useState<string[]>([])

  const [loading, setLoading] = useState(false)

  // Handlers for Menu Items
  async function handleSaveMenuItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const cost = parseFloat(formData.get("cost") as string)

    const result = await upsertMenuItem({
      id: editingMenuItem?.id,
      name,
      costPerUnit: cost,
    })

    if (result.status === "success") {
      toast.success(result.message)
      setIsMenuItemModalOpen(false)
      window.location.reload()
    } else {
      toast.error(result.message)
      setLoading(false)
    }
  }

  async function handleDeleteMenuItem(id: string) {
    if (!confirm("Are you sure you want to delete this menu item?")) return
    const result = await deleteMenuItem(id)
    if (result.status === "success") {
      toast.success(result.message)
      window.location.reload()
    } else {
      toast.error(result.message)
    }
  }

  // Handlers for Schedule
  function openScheduleDialog(day: DayOfWeek, meal: MealTimeType) {
    const entry = schedule.find(
      (s) => s.dayOfWeek === day && s.mealTime === meal
    )
    const currentIds = entry?.menuItems.map((mi) => mi.menuItem.id) || []
    setSelectedMenuItemIds(currentIds)
    setActiveSlot({ day, meal })
    setIsScheduleModalOpen(true)
  }

  async function handleSaveSchedule() {
    if (!activeSlot) return
    setLoading(true)
    const result = await upsertMealSchedule({
      dayOfWeek: activeSlot.day,
      mealTime: activeSlot.meal,
      menuItemIds: selectedMenuItemIds,
    })

    if (result.status === "success") {
      toast.success(result.message)
      setIsScheduleModalOpen(false)
      window.location.reload()
    } else {
      toast.error(result.message)
      setLoading(false)
    }
  }

  return (
    <Tabs defaultValue="schedule" className="w-full">
      <TabsList className="bg-muted/30 mb-6 h-11 p-1">
        <TabsTrigger
          value="schedule"
          className="data-[state=active]:bg-background px-6 data-[state=active]:shadow-sm"
        >
          Weekly Schedule
        </TabsTrigger>
        <TabsTrigger
          value="items"
          className="data-[state=active]:bg-background px-6 data-[state=active]:shadow-sm"
        >
          Global Menu
        </TabsTrigger>
      </TabsList>

      <TabsContent value="schedule" className="space-y-6">
        {/* Mobile View: One day at a time */}
        <div className="block md:hidden">
          <Tabs defaultValue="MONDAY" className="w-full">
            <ScrollArea className="w-full pb-2 whitespace-nowrap">
              <TabsList className="inline-flex h-9 w-max gap-1 bg-transparent p-0">
                {DAYS.map((day) => (
                  <TabsTrigger
                    key={day}
                    value={day}
                    className="border-muted data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-8 rounded-full border px-4 text-[10px] font-bold tracking-wider uppercase"
                  >
                    {day.substring(0, 3)}
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" className="hidden" />
            </ScrollArea>

            {DAYS.map((day) => (
              <TabsContent
                key={day}
                value={day}
                className="space-y-3 pt-2 focus-visible:outline-none"
              >
                <div className="grid grid-cols-1 gap-2">
                  {(["LUNCH", "DINNER"] as MealTimeType[]).map((meal) => (
                    <DayMealCard
                      key={`${day}-${meal}`}
                      day={day}
                      meal={meal}
                      schedule={schedule}
                      onOpen={openScheduleDialog}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Desktop View: 7-column grid */}
        <div className="hidden gap-3 md:grid md:grid-cols-4 lg:grid-cols-7">
          {DAYS.map((day) => (
            <div key={day} className="space-y-3">
              <h3 className="text-muted-foreground text-center text-[10px] font-bold tracking-[0.2em] uppercase">
                {day.substring(0, 3)}
              </h3>
              {(["LUNCH", "DINNER"] as MealTimeType[]).map((meal) => (
                <DayMealCard
                  key={`${day}-${meal}`}
                  day={day}
                  meal={meal}
                  schedule={schedule}
                  onOpen={openScheduleDialog}
                />
              ))}
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="items" className="space-y-6">
        <div className="bg-muted/20 border-muted/50 flex flex-col items-start justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-bold">Menu Items Library</h3>
            <p className="text-muted-foreground text-xs">
              The master list of dishes available for scheduling.
            </p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const res = await seedDefaultMenuItems()
                if (res.status === "success") {
                  toast.success(res.message)
                  window.location.reload()
                } else toast.error(res.message)
              }}
              className="flex-1 text-[10px] font-bold tracking-wider uppercase sm:flex-initial"
            >
              Seed Standard Menu
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingMenuItem(null)
                setIsMenuItemModalOpen(true)
              }}
              className="flex-1 text-[10px] font-bold tracking-wider uppercase sm:flex-initial"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add New Dish
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {menuItems.map((item) => (
            <Card
              key={item.id}
              className="group border-muted/60 relative overflow-hidden transition-shadow hover:shadow-sm"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 p-3 pb-0">
                <div className="flex flex-col">
                  <span className="line-clamp-1 text-xs leading-tight font-bold">
                    {item.name}
                  </span>
                  <span className="text-muted-foreground mt-0.5 text-[10px]">
                    ₹ {item.costPerUnit.toFixed(2)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-2">
                <div className="border-muted/30 flex justify-end gap-1 border-t pt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-primary/10 hover:text-primary h-7 w-7 rounded-full transition-colors"
                    onClick={() => {
                      setEditingMenuItem(item)
                      setIsMenuItemModalOpen(true)
                    }}
                  >
                    <Utensils className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-destructive/10 hover:text-destructive h-7 w-7 rounded-full transition-colors"
                    onClick={() => handleDeleteMenuItem(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      {/* Modals */}
      <Dialog open={isMenuItemModalOpen} onOpenChange={setIsMenuItemModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSaveMenuItem}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingMenuItem ? (
                  <Utensils className="text-primary h-5 w-5" />
                ) : (
                  <Plus className="text-primary h-5 w-5" />
                )}
                {editingMenuItem ? "Edit Dish" : "New Dish"}
              </DialogTitle>
              <DialogDescription>
                Define a dish and its base cost to use in the menu.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Dish Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. Chicken Curry"
                  defaultValue={editingMenuItem?.name}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cost">Estimated Cost per Unit (₹)</Label>
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  defaultValue={editingMenuItem?.costPerUnit.toString()}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Save to Library"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="max-w-md overflow-hidden p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="capitalize">
              {activeSlot?.day.toLowerCase()} {activeSlot?.meal.toLowerCase()}{" "}
              Menu
            </DialogTitle>
            <DialogDescription>
              Select which items will be served during this slot.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto px-6 py-2">
            {menuItems.length > 0 ? (
              <div className="space-y-1">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex cursor-pointer items-center space-x-3 rounded-lg p-3 transition-colors",
                      selectedMenuItemIds.includes(item.id)
                        ? "bg-primary/5 border-primary/10 border"
                        : "hover:bg-muted/50 border border-transparent"
                    )}
                    onClick={() => {
                      setSelectedMenuItemIds((prev) =>
                        prev.includes(item.id)
                          ? prev.filter((id) => id !== item.id)
                          : [...prev, item.id]
                      )
                    }}
                  >
                    <Checkbox
                      id={item.id}
                      checked={selectedMenuItemIds.includes(item.id)}
                      onCheckedChange={(checked) => {
                        setSelectedMenuItemIds((prev) =>
                          checked
                            ? [...prev, item.id]
                            : prev.filter((id) => id !== item.id)
                        )
                      }}
                    />
                    <div className="flex flex-1 flex-col leading-tight">
                      <label className="cursor-pointer text-sm font-semibold">
                        {item.name}
                      </label>
                      <span className="text-muted-foreground text-[10px]">
                        ₹ {item.costPerUnit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Utensils className="text-muted-foreground/30 h-8 w-8" />
                <p className="text-muted-foreground text-sm">
                  Your dish library is empty.
                </p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setIsScheduleModalOpen(
                      false
                    ) /* Switch tab logic? or just tell them */
                  }}
                >
                  Add items first
                </Button>
              </div>
            )}
          </div>
          <div className="bg-muted/10 border-t p-6 pt-4">
            <Button
              onClick={handleSaveSchedule}
              className="w-full"
              disabled={loading}
            >
              {loading ? "Saving changes..." : "Confirm Schedule"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
