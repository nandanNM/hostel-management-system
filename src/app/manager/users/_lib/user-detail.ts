"use server"

import { revalidatePath } from "next/cache"
import { notFound } from "next/navigation"
import requireManager from "@/data/manager/require-manager"
import { ApiResponse } from "@/types"
import { z } from "zod"

import { sendDueAddedEmail, sendPaymentReceivedEmail } from "@/lib/email"
import {
  BillEntryType,
  MealStatusType,
  NotificationType,
  Prisma,
  UserRoleType,
  UserStatusType,
} from "@/lib/generated/prisma"
import getSession from "@/lib/get-session"
import prisma from "@/lib/prisma"

const CHARGE_TYPES = [
  BillEntryType.MEAL_CHARGE,
  BillEntryType.FINE_CHARGE,
  BillEntryType.GUEST_MEAL_CHARGE,
  BillEntryType.SECURITY_DEPOSIT,
  BillEntryType.ADJUSTMENT_DEBIT,
]

/** Header summary for a user: identity + balance/paid/charged (parallel). */
export async function getUserSummary(userId: string) {
  await requireManager()

  const [user, latestBill, paidAgg, chargedAgg] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        roomNo: true,
        selfPhNo: true,
        role: true,
        status: true,
        joinDate: true,
      },
    }),
    prisma.userBill.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { balanceRemaining: true },
    }),
    prisma.userBill.aggregate({
      where: { userId, type: BillEntryType.PAYMENT },
      _sum: { amount: true },
    }),
    prisma.userBill.aggregate({
      where: { userId, type: { in: CHARGE_TYPES } },
      _sum: { amount: true },
    }),
  ])

  if (!user) notFound()

  return {
    user,
    summary: {
      currentDue: latestBill?.balanceRemaining ?? 0,
      totalPaid: Math.abs(paidAgg._sum.amount ?? 0),
      totalCharged: chargedAgg._sum.amount ?? 0,
    },
  }
}

export type UserSummary = Awaited<ReturnType<typeof getUserSummary>>

const LEDGER_SELECT = {
  id: true,
  type: true,
  amount: true,
  description: true,
  balanceRemaining: true,
  isPaid: true,
  createdAt: true,
} as const

export async function getUserBills(userId: string) {
  await requireManager()
  return prisma.userBill.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: LEDGER_SELECT,
  })
}
export type LedgerRow = Awaited<ReturnType<typeof getUserBills>>[number]

export async function getUserPayments(userId: string) {
  await requireManager()
  return prisma.userBill.findMany({
    where: { userId, type: BillEntryType.PAYMENT },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: LEDGER_SELECT,
  })
}

export async function getUserMealHistory(userId: string) {
  await requireManager()
  return prisma.activityLog.findMany({
    where: { userId, actionType: "MEAL_STATUS_CHANGE" },
    orderBy: { timestamp: "desc" },
    take: 500,
    select: { id: true, details: true, timestamp: true },
  })
}
export type MealHistoryRow = Awaited<
  ReturnType<typeof getUserMealHistory>
>[number]

export async function getUserGuestMeals(userId: string) {
  await requireManager()
  return prisma.guestMeal.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 500,
    select: {
      id: true,
      name: true,
      date: true,
      mealTime: true,
      type: true,
      numberOfMeals: true,
      mealCharge: true,
      status: true,
    },
  })
}
export type GuestMealRow = Awaited<ReturnType<typeof getUserGuestMeals>>[number]

export async function getUserFines(userId: string) {
  await requireManager()
  return prisma.userFine.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      amount: true,
      reason: true,
      status: true,
      dueDate: true,
      createdAt: true,
    },
  })
}
export type FineRow = Awaited<ReturnType<typeof getUserFines>>[number]

const recordPaymentSchema = z.object({
  userId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  paymentMethod: z.string().trim().max(40).optional().default(""),
  transactionId: z.string().trim().max(80).optional().default(""),
})

export type RecordPaymentInput = z.input<typeof recordPaymentSchema>

export async function recordPayment(
  input: RecordPaymentInput
): Promise<ApiResponse> {
  const session = await requireManager()
  const actorId = session?.user.id
  if (!actorId) return { status: "error", message: "Unauthorized" }

  const parsed = recordPaymentSchema.safeParse(input)
  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? "Invalid payment details provided.",
    }
  }
  const { userId, amount, paymentMethod, transactionId } = parsed.data

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    })
    if (!target) return { status: "error", message: "User not found" }

    const result = await prisma.$transaction(async (tx) => {
      const lastBill = await tx.userBill.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { balanceRemaining: true },
      })
      const currentDue = lastBill?.balanceRemaining ?? 0
      const newBalance = currentDue - amount

      const bill = await tx.userBill.create({
        data: {
          userId,
          type: BillEntryType.PAYMENT,
          amount: -amount,
          description: `Payment received${
            paymentMethod ? ` via ${paymentMethod}` : ""
          }${transactionId ? ` (txn: ${transactionId})` : ""}`,
          balanceRemaining: newBalance,
          issueDate: new Date(),
          isPaid: true,
        },
        select: { id: true },
      })

      await tx.activityLog.create({
        data: {
          userId: actorId,
          actionType: "PAYMENT_RECORDED",
          entityType: "USER",
          entityId: userId,
          newData: { amount, paymentMethod, transactionId },
          details: `Recorded a payment of ₹${amount.toFixed(2)} for ${
            target.name ?? userId
          }.`,
        },
      })

      return { newBalance, billId: bill.id }
    })

    await prisma.notification.create({
      data: {
        title: "Payment Recorded",
        message: `A payment of ₹${amount.toFixed(2)} was recorded to your account. Your outstanding due is now ₹${result.newBalance.toFixed(2)}.`,
        type: NotificationType.PAYMENT,
        user: { connect: { id: userId } },
        issuer: { connect: { id: actorId } },
      },
    })

    if (target.email) {
      await sendPaymentReceivedEmail({
        to: target.email,
        name: target.name,
        amount,
        newBalance: result.newBalance,
        method: paymentMethod || null,
        billId: result.billId,
      })
    }

    revalidatePath("/manager/users")
    revalidatePath("/mess-prefect/users")
    revalidatePath("/dashboard")
    return {
      status: "success",
      message: `Payment of ₹${amount.toFixed(2)} recorded. New balance: ₹${result.newBalance.toFixed(2)}.`,
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to record the payment.",
    }
  }
}

async function requireMessPrefectActor(): Promise<
  { actorId: string } | { error: ApiResponse }
> {
  const session = await getSession()
  const actorId = session?.user?.id
  if (!actorId || session.user.role !== UserRoleType.MESS_PREFECT) {
    return {
      error: {
        status: "error",
        message: "Only the mess prefect can perform this action.",
      },
    }
  }
  return { actorId }
}

const addDueSchema = z.object({
  userId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  description: z.string().trim().min(1, "A short reason is required").max(200),
})

export type AddDueInput = z.input<typeof addDueSchema>

export async function addUserDue(input: AddDueInput): Promise<ApiResponse> {
  const auth = await requireMessPrefectActor()
  if ("error" in auth) return auth.error
  const { actorId } = auth

  const parsed = addDueSchema.safeParse(input)
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid due details.",
    }
  }
  const { userId, amount, description } = parsed.data

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    })
    if (!target) return { status: "error", message: "User not found" }

    const result = await prisma.$transaction(async (tx) => {
      const lastBill = await tx.userBill.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { balanceRemaining: true },
      })
      const currentDue = lastBill?.balanceRemaining ?? 0
      const newBalance = currentDue + amount

      const bill = await tx.userBill.create({
        data: {
          userId,
          type: BillEntryType.ADJUSTMENT_DEBIT,
          amount,
          description,
          balanceRemaining: newBalance,
          issueDate: new Date(),
          isPaid: false,
        },
        select: { id: true },
      })

      await tx.activityLog.create({
        data: {
          userId: actorId,
          actionType: "DUE_ADDED",
          entityType: "USER",
          entityId: userId,
          newData: { amount, description },
          details: `Added a due of ₹${amount.toFixed(2)} for ${
            target.name ?? userId
          }.`,
        },
      })

      return { newBalance, billId: bill.id }
    })

    await prisma.notification.create({
      data: {
        title: "Due Added",
        message: `A due of ₹${amount.toFixed(2)} was added to your account (${description}). Your outstanding due is now ₹${result.newBalance.toFixed(2)}.`,
        type: NotificationType.PAYMENT,
        user: { connect: { id: userId } },
        issuer: { connect: { id: actorId } },
      },
    })

    if (target.email) {
      await sendDueAddedEmail({
        to: target.email,
        name: target.name,
        amount,
        newBalance: result.newBalance,
        description,
        billId: result.billId,
      })
    }

    revalidatePath("/manager/users")
    revalidatePath("/mess-prefect/users")
    revalidatePath("/dashboard")
    return {
      status: "success",
      message: `Due of ₹${amount.toFixed(2)} added. New balance: ₹${result.newBalance.toFixed(2)}.`,
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to add the due.",
    }
  }
}

const addAdvanceSchema = z.object({
  userId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  paymentMethod: z.string().trim().max(40).optional().default(""),
  note: z.string().trim().max(200).optional().default(""),
})

export type AddAdvanceInput = z.input<typeof addAdvanceSchema>

export async function addUserAdvance(
  input: AddAdvanceInput
): Promise<ApiResponse> {
  const auth = await requireMessPrefectActor()
  if ("error" in auth) return auth.error
  const { actorId } = auth

  const parsed = addAdvanceSchema.safeParse(input)
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid advance details.",
    }
  }
  const { userId, amount, paymentMethod, note } = parsed.data

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    })
    if (!target) return { status: "error", message: "User not found" }

    const result = await prisma.$transaction(async (tx) => {
      const lastBill = await tx.userBill.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { balanceRemaining: true },
      })
      const currentDue = lastBill?.balanceRemaining ?? 0
      const newBalance = currentDue - amount

      const descriptionParts = ["Advance payment"]
      if (paymentMethod) descriptionParts.push(`via ${paymentMethod}`)
      if (note) descriptionParts.push(`— ${note}`)

      const bill = await tx.userBill.create({
        data: {
          userId,
          type: BillEntryType.ADJUSTMENT_CREDIT,
          amount: -amount,
          description: descriptionParts.join(" "),
          balanceRemaining: newBalance,
          issueDate: new Date(),
          isPaid: true,
        },
        select: { id: true },
      })

      await tx.activityLog.create({
        data: {
          userId: actorId,
          actionType: "ADVANCE_RECORDED",
          entityType: "USER",
          entityId: userId,
          newData: { amount, paymentMethod, note },
          details: `Recorded an advance of ₹${amount.toFixed(2)} for ${
            target.name ?? userId
          }.`,
        },
      })

      return { newBalance, billId: bill.id }
    })

    await prisma.notification.create({
      data: {
        title: "Advance Recorded",
        message: `An advance of ₹${amount.toFixed(2)} was recorded to your account. Your outstanding due is now ₹${result.newBalance.toFixed(2)}.`,
        type: NotificationType.PAYMENT,
        user: { connect: { id: userId } },
        issuer: { connect: { id: actorId } },
      },
    })

    if (target.email) {
      await sendPaymentReceivedEmail({
        to: target.email,
        name: target.name,
        amount,
        newBalance: result.newBalance,
        method: paymentMethod || null,
        billId: result.billId,
        kind: "advance",
      })
    }

    revalidatePath("/manager/users")
    revalidatePath("/mess-prefect/users")
    revalidatePath("/dashboard")
    return {
      status: "success",
      message: `Advance of ₹${amount.toFixed(2)} recorded. New balance: ₹${result.newBalance.toFixed(2)}.`,
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to record the advance.",
    }
  }
}

const transferToAlumniSchema = z.object({
  userId: z.string().min(1),
  department: z.string().trim().min(1, "Department is required").max(100),
  year: z.string().trim().min(1, "Passing year is required").max(20),
  mobileNumber: z.string().trim().max(20).optional().default(""),
})

export type TransferToAlumniInput = z.input<typeof transferToAlumniSchema>

const NON_TRANSFERABLE_ROLES: UserRoleType[] = [
  UserRoleType.ADMIN,
  UserRoleType.SUPER_ADMIN,
  UserRoleType.MESS_PREFECT,
]

export async function transferUserToAlumni(
  input: TransferToAlumniInput
): Promise<ApiResponse> {
  const auth = await requireMessPrefectActor()
  if ("error" in auth) return auth.error
  const { actorId } = auth

  const parsed = transferToAlumniSchema.safeParse(input)
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid transfer details.",
    }
  }
  const { userId, department, year, mobileNumber } = parsed.data

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        roomNo: true,
        gender: true,
        religion: true,
        dob: true,
        education: true,
        selfPhNo: true,
        guardianPhNo: true,
        address: true,
        bio: true,
        role: true,
        status: true,
        mealPreference: true,
        onboardingCompleted: true,
        joinDate: true,
        createdAt: true,
        deletedAt: true,
      },
    })
    if (!user) return { status: "error", message: "User not found" }
    if (user.deletedAt || user.status === UserStatusType.FORMA) {
      return {
        status: "error",
        message: "This user has already been transferred to alumni.",
      }
    }
    if (NON_TRANSFERABLE_ROLES.includes(user.role)) {
      return {
        status: "error",
        message: "Admins and mess prefects cannot be transferred to alumni.",
      }
    }

    const alumniName = user.name?.trim() || "Unnamed"
    const alumniEmail = user.email
    const alumniMobile = mobileNumber || user.selfPhNo || "—"

    const snapshot = {
      userId: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      roomNo: user.roomNo,
      gender: user.gender,
      religion: user.religion,
      dob: user.dob ? user.dob.toISOString() : null,
      education: user.education ?? null,
      selfPhNo: user.selfPhNo,
      guardianPhNo: user.guardianPhNo,
      address: user.address,
      bio: user.bio,
      role: user.role,
      mealPreference: user.mealPreference ?? null,
      onboardingCompleted: user.onboardingCompleted,
      joinDate: user.joinDate ? user.joinDate.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
    }

    await prisma.$transaction(async (tx) => {
      const alumni = await tx.alumni.create({
        data: {
          name: alumniName,
          department,
          mobileNumber: alumniMobile,
          email: alumniEmail,
          year,
          address: user.address,
          roomNo: user.roomNo,
          image: user.image,
          snapshot: snapshot as Prisma.InputJsonValue,
        },
        select: { id: true },
      })

      await tx.user.update({
        where: { id: userId },
        data: { status: UserStatusType.FORMA, deletedAt: new Date() },
      })

      await tx.meal.updateMany({
        where: { userId },
        data: { status: MealStatusType.INACTIVE },
      })

      await tx.activityLog.create({
        data: {
          userId: actorId,
          actionType: "USER_TRANSFERRED_TO_ALUMNI",
          entityType: "ALUMNI",
          entityId: alumni.id,
          oldData: snapshot as Prisma.InputJsonValue,
          newData: { department, year, mobileNumber: alumniMobile },
          details: `Transferred ${alumniName} to alumni. Financial records preserved.`,
        },
      })

      return { alumniId: alumni.id }
    })

    revalidatePath("/manager/users")
    revalidatePath("/mess-prefect/users")
    revalidatePath("/alumni")
    revalidatePath("/dashboard")
    return {
      status: "success",
      message: `${alumniName} transferred to alumni. Their financial records were preserved.`,
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to transfer the user to alumni.",
    }
  }
}
