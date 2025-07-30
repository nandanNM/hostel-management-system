"use server"

import { unstable_noStore as noStore, revalidatePath } from "next/cache"
import requireManager from "@/data/manager/require-manager"
import { MealStatusType, NonVegType, Prisma } from "@/generated/prisma"
import { ApiResponse } from "@/types"
import z from "zod"

import { GetMealWithUser } from "@/types/prisma.type"
import prisma from "@/lib/prisma"
import { parseEnumList } from "@/lib/utils"
import { mealSchema } from "@/lib/validations"

import { GetMealsSchema } from "./validations"

interface MealsResponse {
  data: GetMealWithUser[]
  totalRows: number
  pageCount: number
}

export async function getMealsForManager(
  input: GetMealsSchema
): Promise<MealsResponse> {
  noStore()
  const {
    page,
    per_page,
    sort,
    status,
    nonVegType,
    user,
    operator = "and",
  } = input
  const offset = (page - 1) * per_page
  const [sortField, sortOrder] = (sort?.split(".") ?? [
    "updatedAt",
    "desc",
  ]) as [keyof Prisma.MealOrderByWithRelationInput, "asc" | "desc"]
  const statusList = parseEnumList(status, MealStatusType)
  const nonVegList = parseEnumList(nonVegType, NonVegType)

  const statusCondition =
    statusList.length > 0 ? { status: { in: statusList } } : undefined
  const nonVegCondition =
    nonVegList.length > 0 ? { nonVegType: { in: nonVegList } } : undefined

  const filters = [statusCondition, nonVegCondition].filter(
    Boolean
  ) as Prisma.MealWhereInput[]

  if (user) {
    filters.push({
      user: {
        OR: [
          { name: { contains: user, mode: "insensitive" } },
          { email: { contains: user, mode: "insensitive" } },
        ],
      },
    })
  }

  const whereClause =
    filters.length > 0
      ? operator === "or"
        ? { OR: filters }
        : { AND: filters }
      : {}

  try {
    const [data, totalRows] = await Promise.all([
      prisma.meal.findMany({
        where: whereClause,
        skip: offset,
        take: per_page,
        orderBy: {
          [sortField]: sortOrder,
        },
        include: {
          user: {
            select: {
              image: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.meal.count({ where: whereClause }),
    ])

    return {
      data,
      totalRows,
      pageCount: Math.ceil(totalRows / per_page),
    }
  } catch (error) {
    throw new Error("Failed to retrieve meal data.")
  }
}

type UpdateMealSchema = z.infer<typeof mealSchema>
export async function updateMeal(
  values: UpdateMealSchema & { id: string }
): Promise<ApiResponse> {
  noStore()
  const session = await requireManager()
  if (!session?.user.hostelId)
    return {
      status: "error",
      message: "Unauthorized - Hostel ID not found",
    }
  try {
    await prisma.meal.update({
      where: {
        id: values.id,
      },
      data: {
        ...values,
      },
    })
    revalidatePath("/manager/users")
    return {
      status: "success",
      message: "Guest meal request approved successfully",
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again later.",
    }
  }
}

export async function updateUserMealStatus(
  mealId: string,
  status: MealStatusType
): Promise<ApiResponse> {
  noStore()
  const session = await requireManager()
  if (!session?.user.hostelId)
    return {
      status: "error",
      message: "Unauthorized - Hostel ID not found",
    }
  try {
    await prisma.meal.update({
      where: {
        id: mealId,
      },
      data: {
        status,
      },
    })
    revalidatePath("/manager/users")
    return {
      status: "success",
      message: "Guest meal request approved successfully",
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again later.",
    }
  }
}
