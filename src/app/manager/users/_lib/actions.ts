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
  if (!session)
    return {
      status: "error",
      message: "Unauthorized",
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
  if (!session)
    return {
      status: "error",
      message: "Unauthorized",
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
  noStore()
  // console.log("[issueFineToUSerId] ", { targetUserId })

  const session = await requireManager()
  // console.log("[issueFineToUser] Session:", session)

  if (!session) {
    console.error("[issueFineToUser] Unauthorized")
    return { status: "error", message: "Unauthorized" }
  }
  const issuerUserId = session.user.id

  try {
    const fineAmountNumber = Number(fineAmount)
    // console.log("[issueFineToUser] Parsed fine amount:", fineAmountNumber)

    if (!Number.isFinite(fineAmountNumber) || fineAmountNumber <= 0) {
      console.error("[issueFineToUser] Invalid fine amount provided")
      return { status: "error", message: "Invalid fine amount provided" }
    }

    const targetUser = await prisma.user.findFirst({
      where: { id: targetUserId },
      select: { id: true },
    })
    // console.log("[issueFineToUser] Target user:", targetUser)

    if (!targetUser) {
      console.error("[issueFineToUser] Target user not found in this hostel")
      return {
        status: "error",
        message: "Target user not found in this hostel",
      }
    }

    const lastBill = await prisma.userBill.findFirst({
      where: { userId: targetUserId },
      orderBy: { createdAt: "desc" },
      select: { balanceRemaining: true },
    })
    // console.log("[issueFineToUser] Last bill:", lastBill)

    if (!issuerUserId) {
      throw new Error("Issuer is required to issue a fine")
    }

    const result = await prisma.$transaction(async (tx) => {
      // console.log("[issueFineToUser][TX] Starting transaction")

      const newFine = await tx.userFine.create({
        data: {
          userId: targetUserId,
          issuedBy: issuerUserId,
          amount: fineAmountNumber,
          reason: fineReason,
          dueDate: fineDueDate,
          status: "PENDING",
        },
      })
      // console.log("[issueFineToUser][TX] New fine created:", newFine)

      const currentDue = lastBill?.balanceRemaining ?? 0
      const newBalance = currentDue + fineAmountNumber

      const newBillEntry = await tx.userBill.create({
        data: {
          userId: targetUserId,
          fineId: newFine.id,
          type: BillEntryType.FINE_CHARGE,
          amount: newFine.amount,
          description: `Fine: ${newFine.reason}`,
          balanceRemaining: newBalance,
          isPaid: false,
          issueDate: new Date(),
          dueDate: newFine.dueDate,
        },
      })
      // console.log("[issueFineToUser][TX] New bill entry created:", newBillEntry)

      return { newFine, newBillEntry, newBalance, success: true as const }
    })
    // console.log("[issueFineToUser] Transaction result:", result)

    if (!result?.success) {
      throw new Error("Transaction completed but returned invalid result")
    }

    await prisma.notification.create({
      data: {
        title: "New Fine Issued",
        message: `You have received a fine of ₹${fineAmountNumber} for: ${fineReason}.`,
        type: NotificationType.FINE,
        user: { connect: { id: targetUserId } },
        issuer: { connect: { id: issuerUserId } },
      },
    })
    // console.log("[issueFineToUser] Notification created successfully")

    return { status: "success", message: "Fine issued successfully" }
  } catch (error) {
    console.error("[issueFineToUser] Error occurred:", error)
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again later.",
    }
  }
}
