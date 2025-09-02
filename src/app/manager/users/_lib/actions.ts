"use server"

import { unstable_noStore as noStore, revalidatePath } from "next/cache"
import requireManager from "@/data/manager/require-manager"
import { ApiResponse } from "@/types"
import z from "zod"

import { GetMealWithUser } from "@/types/prisma.type"
import {
  BillEntryType,
  MealStatusType,
  NonVegType,
  NotificationType,
  Prisma,
} from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"
import { parseEnumList } from "@/lib/utils"
import { mealSchema } from "@/lib/validations"

import { CreateUserFineSchema, GetMealsSchema } from "./validations"

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
              id: true,
              selfPhNo: true,
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
  } catch {
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
export async function issueFineToUser({
  targetUserId,
  fineAmount,
  fineReason,
  fineDueDate,
}: CreateUserFineSchema): Promise<ApiResponse> {
  const session = await requireManager()
  if (!session?.user.hostelId)
    return {
      status: "error",
      message: "Unauthorized - Hostel ID not found",
    }
  const hostelId = session.user.hostelId
  const issuerUserId = session.user.id
  try {
    const fineAmountNumber = Number(fineAmount)
    if (isNaN(fineAmountNumber) || fineAmountNumber <= 0) {
      return {
        status: "error",
        message: "Invalid fine amount provided",
      }
    }
    const lastBill = await prisma.userBill.findFirst({
      where: {
        userId: targetUserId,
        hostelId: hostelId,
      },
      orderBy: { createdAt: "desc" },
    })
    // console.log(
    //   `Fine Debug - User: ${targetUserId}, Last Bill: ${JSON.stringify(lastBill)}`
    // )
    const result = await prisma.$transaction(async (tx) => {
      const newFine = await tx.userFine.create({
        data: {
          amount: Number(fineAmount),
          reason: fineReason,
          dueDate: fineDueDate,
          status: "PENDING",
          user: { connect: { id: targetUserId } },
          hostel: { connect: { id: hostelId } },
          issuer: { connect: { id: issuerUserId } },
          issuedByHostel: { connect: { id: hostelId } },
        },
      })
      const currentDue = lastBill?.balanceRemaining ?? 0
      const newBalance = currentDue + fineAmountNumber
      // console.log(
      //   `Fine Debug - User: ${targetUserId}, Current Balance: ${currentDue}, Fine Amount: ${fineAmountNumber}, New Balance: ${newBalance}`
      // )
      const newBillEntry = await tx.userBill.create({
        data: {
          type: BillEntryType.FINE_CHARGE,
          amount: newFine.amount,
          description: `Fine: ${newFine.reason}`,
          balanceRemaining: newBalance,
          isPaid: false,
          issueDate: new Date(),
          dueDate: newFine.dueDate,
          user: { connect: { id: targetUserId } },
          hostel: { connect: { id: hostelId } },
          fine: { connect: { id: newFine.id } },
        },
      })
      // console.log(
      //   `Fine Debug - User: ${newBillEntry.userId}, Current Balance: ${newBillEntry.balanceRemaining}, Fine Amount: ${newBillEntry.amount}, New Balance: ${newBillEntry.balanceRemaining}`
      // )
      return { newFine, newBillEntry, newBalance, success: true }
    })
    if (!result || !result.success) {
      throw new Error("Transaction completed but returned invalid result")
    }
    prisma.notification.create({
      data: {
        title: "New Fine Issued",
        message: `You have received a fine of ₹${Number(fineAmount)} for: ${fineReason}.`,
        type: NotificationType.FINE,
        hostel: { connect: { id: hostelId } },
        user: { connect: { id: targetUserId } },
        issuer: { connect: { id: issuerUserId } },
      },
    })
    return {
      status: "success",
      message: "Fine issued successfully",
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
