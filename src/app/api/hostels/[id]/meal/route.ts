import { NextRequest, NextResponse } from "next/server"
import { DayOfWeek, MealTimeType } from "@/generated/prisma"

import prisma from "@/lib/prisma"

const MENU_ITEM_COSTS: Record<string, number> = {
  VEG: 45,
  EGG: 50,
  FISH: 55,
  CHICKEN: 60,
  MUTTON: 130,
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hostelId } = await params
    const body = await req.json()
    const { schedule } = body

    if (!hostelId || !schedule) {
      return NextResponse.json(
        { error: "Missing hostelId or schedule" },
        { status: 400 }
      )
    }

    // Ensure all needed menu items exist
    const requiredNames = new Set<string>()
    for (const meals of Object.values(schedule)) {
      if (typeof meals !== "object" || meals === null) continue

      for (const items of Object.values(meals)) {
        if (!Array.isArray(items)) continue

        for (const name of items) {
          requiredNames.add(String(name).toLowerCase())
        }
      }
    }

    for (const name of requiredNames) {
      const cost = MENU_ITEM_COSTS[name.toUpperCase()]
      if (!cost) {
        return NextResponse.json(
          { error: `Unknown menu item '${name}'` },
          { status: 400 }
        )
      }

      await prisma.menuItem.upsert({
        where: { name },
        update: { costPerUnit: cost },
        create: { name, costPerUnit: cost },
      })
    }

    const allMenuItems = await prisma.menuItem.findMany()
    const nameToIdMap = Object.fromEntries(
      allMenuItems.map((item) => [item.name.toLowerCase(), item.id])
    )

    const entriesToCreate = []
    for (const [day, meals] of Object.entries(schedule)) {
      for (const [mealTime, items] of Object.entries(meals ?? {})) {
        if (!Array.isArray(items)) continue

        const lowerCasedItems = items.map((i) => String(i).toLowerCase())
        const menuItemIds = lowerCasedItems
          .map((name) => nameToIdMap[name])
          .filter(Boolean)

        entriesToCreate.push({
          hostelId,
          dayOfWeek: day as DayOfWeek,
          mealTime: mealTime as MealTimeType,
          menuItems: {
            create: menuItemIds.map((menuItemId) => ({
              menuItem: { connect: { id: menuItemId } },
            })),
          },
        })
      }
    }

    const created = await prisma.$transaction(
      entriesToCreate.map((entry) =>
        prisma.mealScheduleEntry.create({ data: entry })
      )
    )

    return NextResponse.json(
      { message: "Meal schedule and menu items created", created },
      { status: 201 }
    )
  } catch (error) {
    console.error("Bulk schedule creation error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
