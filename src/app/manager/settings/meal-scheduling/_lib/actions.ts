"use server"

import { revalidatePath } from "next/cache"
import requireManager from "@/data/manager/require-manager"
import { ApiResponse } from "@/types"

import { invalidate, mealScheduleKeys } from "@/lib/cache"
import { DayOfWeek, MealTimeType } from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"

export async function getMenuItems() {
  await requireManager()
  return await prisma.menuItem.findMany({
    orderBy: { name: "asc" },
  })
}

export async function upsertMenuItem(data: {
  id?: string
  name: string
  costPerUnit: number
}): Promise<ApiResponse> {
  const session = await requireManager()
  const actorId = session.user.id
  if (!actorId) return { status: "error", message: "Unauthorized" }

  try {
    const item = data.id
      ? await prisma.menuItem.update({
          where: { id: data.id },
          data: {
            name: data.name,
            costPerUnit: data.costPerUnit,
          },
        })
      : await prisma.menuItem.create({
          data: {
            name: data.name,
            costPerUnit: data.costPerUnit,
          },
        })

    prisma.activityLog
      .create({
        data: {
          userId: actorId,
          actionType: data.id ? "UPDATE" : "CREATE",
          entityType: "MENU_ITEM",
          entityId: item.id,
          newData: { name: data.name, costPerUnit: data.costPerUnit },
          details: `${data.id ? "Updated" : "Created"} menu item "${data.name}" (₹${data.costPerUnit}).`,
        },
      })
      .catch((err) => console.error("Activity log creation failed:", err))

    await invalidate(...mealScheduleKeys())
    revalidatePath("/manager/settings/meal-scheduling")
    return { status: "success", message: "Menu item saved successfully" }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to save menu item",
    }
  }
}

export async function deleteMenuItem(id: string): Promise<ApiResponse> {
  const session = await requireManager()
  const actorId = session.user.id
  if (!actorId) return { status: "error", message: "Unauthorized" }

  try {
    const deleted = await prisma.menuItem.delete({
      where: { id },
    })

    prisma.activityLog
      .create({
        data: {
          userId: actorId,
          actionType: "DELETE",
          entityType: "MENU_ITEM",
          entityId: id,
          oldData: { name: deleted.name, costPerUnit: deleted.costPerUnit },
          details: `Deleted menu item "${deleted.name}".`,
        },
      })
      .catch((err) => console.error("Activity log creation failed:", err))

    await invalidate(...mealScheduleKeys())
    revalidatePath("/manager/settings/meal-scheduling")
    return { status: "success", message: "Menu item deleted successfully" }
  } catch {
    return {
      status: "error",
      message: "Failed to delete menu item (check if it's used in a schedule)",
    }
  }
}

export async function getMealSchedule() {
  await requireManager()
  return await prisma.mealScheduleEntry.findMany({
    include: {
      menuItems: {
        include: {
          menuItem: true,
        },
      },
    },
  })
}

export async function upsertMealSchedule(data: {
  dayOfWeek: DayOfWeek
  mealTime: MealTimeType
  menuItemIds: string[]
}): Promise<ApiResponse> {
  const session = await requireManager()
  const actorId = session.user.id
  if (!actorId) return { status: "error", message: "Unauthorized" }

  try {
    const entryId = await prisma.$transaction(async (tx) => {
      // Find or create the schedule entry
      const entry = await tx.mealScheduleEntry.upsert({
        where: {
          dayOfWeek_mealTime: {
            dayOfWeek: data.dayOfWeek,
            mealTime: data.mealTime,
          },
        },
        create: {
          dayOfWeek: data.dayOfWeek,
          mealTime: data.mealTime,
        },
        update: {},
      })

      // Delete existing relations
      await tx.menuItemOnMealScheduleEntry.deleteMany({
        where: { mealScheduleEntryId: entry.id },
      })

      // Create new relations
      if (data.menuItemIds.length > 0) {
        await tx.menuItemOnMealScheduleEntry.createMany({
          data: data.menuItemIds.map((itemId) => ({
            mealScheduleEntryId: entry.id,
            menuItemId: itemId,
          })),
        })
      }

      return entry.id
    })

    prisma.activityLog
      .create({
        data: {
          userId: actorId,
          actionType: "UPDATE",
          entityType: "MEAL_SCHEDULE_ENTRY",
          entityId: entryId,
          newData: {
            dayOfWeek: data.dayOfWeek,
            mealTime: data.mealTime,
            menuItemIds: data.menuItemIds,
          },
          details: `Updated ${data.dayOfWeek} ${data.mealTime} schedule (${data.menuItemIds.length} item(s)).`,
        },
      })
      .catch((err) => console.error("Activity log creation failed:", err))

    await invalidate(...mealScheduleKeys())
    revalidatePath("/manager/settings/meal-scheduling")
    return { status: "success", message: "Schedule updated successfully" }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to update schedule",
    }
  }
}

export async function seedDefaultMenuItems(): Promise<ApiResponse> {
  const session = await requireManager()
  const actorId = session.user.id
  if (!actorId) return { status: "error", message: "Unauthorized" }

  const defaults = [
    { name: "Veg", costPerUnit: 45 },
    { name: "Egg", costPerUnit: 50 },
    { name: "Fish", costPerUnit: 55 },
    { name: "Chicken", costPerUnit: 60 },
    { name: "Mutton", costPerUnit: 130 },
  ]
  try {
    for (const item of defaults) {
      await prisma.menuItem.upsert({
        where: { name: item.name },
        update: { costPerUnit: item.costPerUnit },
        create: { name: item.name, costPerUnit: item.costPerUnit },
      })
    }

    prisma.activityLog
      .create({
        data: {
          userId: actorId,
          actionType: "SEED",
          entityType: "MENU_ITEM",
          entityId: "default-menu-items",
          newData: { items: defaults },
          details: "Seeded standard menu items.",
        },
      })
      .catch((err) => console.error("Activity log creation failed:", err))

    await invalidate(...mealScheduleKeys())
    revalidatePath("/manager/settings/meal-scheduling")
    return {
      status: "success",
      message: "Standard menu items seeded successfully",
    }
  } catch {
    return { status: "error", message: "Failed to seed menu items" }
  }
}
