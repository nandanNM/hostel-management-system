"use server"

import requireManager from "@/data/manager/require-manager"

import { MealTimeType } from "@/lib/generated/prisma"

import {
  getMealBreakdownUsers,
  type MealBreakdownUser,
  type MealBucket,
} from "../../_lib/meal-breakdown"
import { GetMealBreakdownSchema } from "./validations"

interface PaginatedMealBreakdown {
  data: MealBreakdownUser[]
  totalRows: number
  pageCount: number
}

/**
 * Bucket membership comes from calculateActualNonVegMeal, not a DB column,
 * so filtering happens in-memory over the day's full attendance list — then
 * name-search and pagination apply to that same in-memory list. A single
 * hostel's headcount is small enough that this costs nothing.
 */
export async function getPaginatedMealBreakdown(
  mealTime: MealTimeType,
  date: Date,
  bucket: MealBucket,
  input: GetMealBreakdownSchema
): Promise<PaginatedMealBreakdown> {
  await requireManager()

  const all = await getMealBreakdownUsers(mealTime, date, bucket)

  const { page, per_page, name } = input
  const filtered = name
    ? all.filter((u) =>
        (u.name ?? "").toLowerCase().includes(name.toLowerCase())
      )
    : all

  const totalRows = filtered.length
  const offset = (page - 1) * per_page
  const data = filtered.slice(offset, offset + per_page)

  return {
    data,
    totalRows,
    pageCount: Math.max(1, Math.ceil(totalRows / per_page)),
  }
}
