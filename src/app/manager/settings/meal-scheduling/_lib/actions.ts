"use server"

import { revalidatePath } from "next/cache"
import requireManager from "@/data/manager/require-manager"
import { ApiResponse } from "@/types"
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
  await requireManager()
  try {
    if (data.id) {
      await prisma.menuItem.update({
        where: { id: data.id },
        data: {
          name: data.name,
          costPerUnit: data.costPerUnit,
        },
      })
    } else {
      await prisma.menuItem.create({
        data: {
          name: data.name,
          costPerUnit: data.costPerUnit,
        },
      })
    }
    revalidatePath("/manager/settings/meal-scheduling")
    return { status: "success", message: "Menu item saved successfully" }
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Failed to save menu item" }
  }
}

export async function deleteMenuItem(id: string): Promise<ApiResponse> {
  await requireManager()
  try {
    await prisma.menuItem.delete({
      where: { id },
    })
    revalidatePath("/manager/settings/meal-scheduling")
    return { status: "success", message: "Menu item deleted successfully" }
  } catch (error) {
    return { status: "error", message: "Failed to delete menu item (check if it's used in a schedule)" }
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
  await requireManager()
  try {
    await prisma.$transaction(async (tx) => {
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
    })

    revalidatePath("/manager/settings/meal-scheduling")
    return { status: "success", message: "Schedule updated successfully" }
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Failed to update schedule" }
  }
}

export async function seedDefaultMenuItems(): Promise<ApiResponse> {
  await requireManager()
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
    revalidatePath("/manager/settings/meal-scheduling")
    return { status: "success", message: "Standard menu items seeded successfully" }
  } catch (error) {
    return { status: "error", message: "Failed to seed menu items" }
  }
}
