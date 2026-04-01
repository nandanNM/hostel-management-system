"use client"

import { useState } from "react"
import { Calendar, ChevronDown, Plus, Trash2, Utensils } from "lucide-react"
import { toast } from "sonner"

import { DayOfWeek, MealTimeType, MenuItem, type MealScheduleEntry } from "@/lib/generated/prisma"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { deleteMenuItem, seedDefaultMenuItems, upsertMealSchedule, upsertMenuItem } from "../_lib/actions"

interface MealScheduleViewProps {
  initialMenuItems: MenuItem[]
  initialSchedule: (MealScheduleEntry & { 
    menuItems: { menuItem: MenuItem }[]
  })[]
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
  onOpen 
}: { 
  day: DayOfWeek, 
  meal: MealTimeType, 
  schedule: any[], 
  onOpen: (day: DayOfWeek, meal: MealTimeType) => void 
}) {
  const entry = schedule.find(s => s.dayOfWeek === day && s.mealTime === meal)
  return (
    <Card 
      className="group cursor-pointer hover:border-primary/50 transition-all active:scale-[0.98] border-muted/60"
      onClick={() => onOpen(day, meal)}
    >
      <CardHeader className="p-2 sm:p-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/80">{meal}</span>
          <ChevronDown className="h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-2 sm:px-3 sm:pb-3 pt-0">
        {entry?.menuItems && entry.menuItems.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {entry.menuItems.map((mi: any) => (
              <span key={mi.menuItem.id} className="inline-flex rounded-sm bg-primary/5 border border-primary/10 px-1 py-0.5 text-[9px] sm:text-[10px] font-semibold text-primary/80">
                {mi.menuItem.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[9px] sm:text-[10px] italic text-muted-foreground/50">Not Set</p>
        )}
      </CardContent>
    </Card>
  )
}

export default function MealScheduleView({ 
  initialMenuItems, 
  initialSchedule 
}: MealScheduleViewProps) {
  const [menuItems, setMenuItems] = useState(initialMenuItems)
  const [schedule, setSchedule] = useState(initialSchedule)
  const [isMenuItemModalOpen, setIsMenuItemModalOpen] = useState(false)
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null)
  
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [activeSlot, setActiveSlot] = useState<{ day: DayOfWeek, meal: MealTimeType } | null>(null)
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
      costPerUnit: cost 
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
    const entry = schedule.find(s => s.dayOfWeek === day && s.mealTime === meal)
    const currentIds = entry?.menuItems.map((mi: any) => mi.menuItem.id) || []
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
      <TabsList className="mb-6 h-11 bg-muted/30 p-1">
        <TabsTrigger value="schedule" className="px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">Weekly Schedule</TabsTrigger>
        <TabsTrigger value="items" className="px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">Global Menu</TabsTrigger>
      </TabsList>

      <TabsContent value="schedule" className="space-y-6">
        {/* Mobile View: One day at a time */}
        <div className="block md:hidden">
          <Tabs defaultValue="MONDAY" className="w-full">
            <ScrollArea className="w-full whitespace-nowrap pb-2">
              <TabsList className="inline-flex w-max h-9 bg-transparent p-0 gap-1">
                {DAYS.map((day) => (
                  <TabsTrigger key={day} value={day} className="h-8 px-4 rounded-full border border-muted data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary text-[10px] font-bold uppercase tracking-wider">
                    {day.substring(0, 3)}
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" className="hidden" />
            </ScrollArea>

            {DAYS.map((day) => (
              <TabsContent key={day} value={day} className="space-y-3 pt-2 focus-visible:outline-none">
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
        <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-7 gap-3">
          {DAYS.map((day) => (
            <div key={day} className="space-y-3">
              <h3 className="text-center font-bold text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{day.substring(0, 3)}</h3>
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-muted/20 border border-muted/50 p-4 rounded-xl gap-4">
          <div>
            <h3 className="font-bold text-lg">Menu Items Library</h3>
            <p className="text-xs text-muted-foreground">The master list of dishes available for scheduling.</p>
          </div>
          <div className="flex w-full sm:w-auto gap-2">
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
              className="flex-1 sm:flex-initial text-[10px] font-bold uppercase tracking-wider"
            >
              Seed Standard Menu
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingMenuItem(null)
                setIsMenuItemModalOpen(true)
              }}
              className="flex-1 sm:flex-initial text-[10px] font-bold uppercase tracking-wider"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add New Dish
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {menuItems.map((item) => (
            <Card key={item.id} className="relative overflow-hidden group hover:shadow-sm transition-shadow border-muted/60">
              <CardHeader className="p-3 pb-0 flex flex-row items-start justify-between space-y-0">
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-tight line-clamp-1">{item.name}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">₹ {item.costPerUnit.toFixed(2)}</span>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-2">
                <div className="flex gap-1 justify-end pt-2 border-t border-muted/30">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => { setEditingMenuItem(item); setIsMenuItemModalOpen(true) }}>
                        <Utensils className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => handleDeleteMenuItem(item.id)}>
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
                {editingMenuItem ? <Utensils className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                {editingMenuItem ? "Edit Dish" : "New Dish"}
              </DialogTitle>
              <DialogDescription>Define a dish and its base cost to use in the menu.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Dish Name</Label>
                <Input id="name" name="name" placeholder="e.g. Chicken Curry" defaultValue={editingMenuItem?.name} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cost">Estimated Cost per Unit (₹)</Label>
                <Input id="cost" name="cost" type="number" step="0.01" placeholder="0.00" defaultValue={editingMenuItem?.costPerUnit.toString()} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Saving..." : "Save to Library"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="capitalize">{activeSlot?.day.toLowerCase()} {activeSlot?.meal.toLowerCase()} Menu</DialogTitle>
            <DialogDescription>Select which items will be served during this slot.</DialogDescription>
          </DialogHeader>
          <div className="px-6 py-2 max-h-[400px] overflow-y-auto">
            {menuItems.length > 0 ? (
                <div className="space-y-1">
                {menuItems.map(item => (
                <div key={item.id} className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer",
                    selectedMenuItemIds.includes(item.id) ? "bg-primary/5 border border-primary/10" : "hover:bg-muted/50 border border-transparent"
                )} onClick={() => {
                   setSelectedMenuItemIds(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id])
                }}>
                  <Checkbox 
                    id={item.id} 
                    checked={selectedMenuItemIds.includes(item.id)} 
                    onCheckedChange={(checked) => {
                       setSelectedMenuItemIds(prev => checked ? [...prev, item.id] : prev.filter(id => id !== item.id))
                    }}
                  />
                  <div className="flex flex-col flex-1 leading-tight">
                    <label className="text-sm font-semibold cursor-pointer">{item.name}</label>
                    <span className="text-[10px] text-muted-foreground">₹ {item.costPerUnit.toFixed(2)}</span>
                  </div>
                </div>
                ))}
                </div>
            ) : (
                <div className="text-center py-12 flex flex-col items-center gap-2">
                    <Utensils className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Your dish library is empty.</p>
                    <Button variant="link" size="sm" onClick={() => { setIsScheduleModalOpen(false); /* Switch tab logic? or just tell them */ }}>Add items first</Button>
                </div>
            )}
          </div>
          <div className="p-6 pt-4 bg-muted/10 border-t">
            <Button onClick={handleSaveSchedule} className="w-full" disabled={loading}>{loading ? "Saving changes..." : "Confirm Schedule"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
