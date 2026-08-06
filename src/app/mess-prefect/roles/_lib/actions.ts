"use server"

import { unstable_noStore as noStore, revalidatePath } from "next/cache"
import requireMessPrefect from "@/data/mess-prefect/require-mess-prefect"
import { ApiResponse } from "@/types"
import { z } from "zod"

import { Prisma, UserRoleType, UserStatusType } from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"
import { parseEnumList } from "@/lib/utils"

import { GetRolesSchema } from "./validations"

export interface RoleUser {
  id: string
  name: string | null
  email: string
  image: string | null
  role: UserRoleType
  status: UserStatusType
  selfPhNo: string | null
  roomNo: string | null
}

interface RolesResponse {
  data: RoleUser[]
  totalRows: number
  pageCount: number
}

export async function getUsersForRoles(
  input: GetRolesSchema
): Promise<RolesResponse> {
  noStore()
  await requireMessPrefect()

  const { page, per_page, sort, name, role, status, operator = "and" } = input
  const offset = (page - 1) * per_page
  const [sortField, sortOrder] = (sort?.split(".") ?? ["role", "asc"]) as [
    keyof Prisma.UserOrderByWithRelationInput,
    "asc" | "desc",
  ]

  const roleList = parseEnumList(role, UserRoleType)
  const statusList = parseEnumList(status, UserStatusType)

  const roleCondition =
    roleList.length > 0 ? { role: { in: roleList } } : undefined
  const statusCondition =
    statusList.length > 0 ? { status: { in: statusList } } : undefined

  const filters = [roleCondition, statusCondition].filter(
    Boolean
  ) as Prisma.UserWhereInput[]

  if (name) {
    filters.push({
      OR: [
        { name: { contains: name, mode: "insensitive" } },
        { email: { contains: name, mode: "insensitive" } },
        { roomNo: { contains: name, mode: "insensitive" } },
      ],
    })
  }

  const baseScope: Prisma.UserWhereInput = {
    deletedAt: null,
    NOT: { status: { in: [UserStatusType.INACTIVE, UserStatusType.FORMA] } },
  }

  const whereClause: Prisma.UserWhereInput =
    filters.length > 0
      ? operator === "or"
        ? { AND: [baseScope, { OR: filters }] }
        : { AND: [baseScope, ...filters] }
      : baseScope

  try {
    const [data, totalRows] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip: offset,
        take: per_page,
        orderBy: [{ [sortField]: sortOrder }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          status: true,
          selfPhNo: true,
          roomNo: true,
        },
      }),
      prisma.user.count({ where: whereClause }),
    ])

    return {
      data,
      totalRows,
      pageCount: Math.ceil(totalRows / per_page),
    }
  } catch {
    throw new Error("Failed to retrieve users.")
  }
}

const assignRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["STUDENT", "STAFF", "MANAGER", "MESS_PREFECT"]),
})

const updateDetailsSchema = z.object({
  userId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(100),
  selfPhNo: z.string().trim().max(20).optional().default(""),
  roomNo: z.string().trim().max(20).optional().default(""),
})

export type AssignRoleInput = z.infer<typeof assignRoleSchema>
export type UpdateManagerDetailsInput = z.infer<typeof updateDetailsSchema>

export async function assignRole(input: AssignRoleInput): Promise<ApiResponse> {
  const session = await requireMessPrefect()
  const actorId = session?.user.id
  if (!actorId) return { status: "error", message: "Unauthorized" }

  const parsed = assignRoleSchema.safeParse(input)
  if (!parsed.success) {
    return { status: "error", message: "Invalid input" }
  }
  const { userId, role } = parsed.data

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, name: true },
    })
    if (!target) return { status: "error", message: "User not found" }
    if (target.id === actorId) {
      return { status: "error", message: "You cannot change your own role." }
    }
    if (target.role === role) {
      return { status: "success", message: "Role is already set." }
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { role } }),
      prisma.activityLog.create({
        data: {
          userId: actorId,
          actionType: "ROLE_CHANGE",
          entityType: "USER",
          entityId: userId,
          oldData: { role: target.role },
          newData: { role },
          details: `Changed ${target.name ?? userId}'s role from ${
            target.role
          } to ${role}.`,
        },
      }),
    ])

    revalidatePath("/mess-prefect/roles")
    return {
      status: "success",
      message:
        role === UserRoleType.MANAGER
          ? `${target.name ?? "User"} is now a Manager.`
          : `Role updated to ${role}.`,
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

export async function updateManagerDetails(
  input: UpdateManagerDetailsInput
): Promise<ApiResponse> {
  const session = await requireMessPrefect()
  const actorId = session?.user.id
  if (!actorId) return { status: "error", message: "Unauthorized" }

  const parsed = updateDetailsSchema.safeParse(input)
  if (!parsed.success) {
    return {
      status: "error",
      message: `Invalid form data - ${parsed.error.issues[0]?.message ?? "check your input"}`,
    }
  }
  const { userId, name, selfPhNo, roomNo } = parsed.data

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, selfPhNo: true, roomNo: true },
    })
    if (!target) return { status: "error", message: "User not found" }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          name,
          selfPhNo: selfPhNo || null,
          roomNo: roomNo || null,
        },
      }),
      prisma.activityLog.create({
        data: {
          userId: actorId,
          actionType: "USER_DETAILS_UPDATE",
          entityType: "USER",
          entityId: userId,
          oldData: {
            name: target.name,
            selfPhNo: target.selfPhNo,
            roomNo: target.roomNo,
          },
          newData: { name, selfPhNo: selfPhNo || null, roomNo: roomNo || null },
          details: `Updated profile details for ${name}.`,
        },
      }),
    ])

    revalidatePath("/mess-prefect/roles")
    return { status: "success", message: "Details updated successfully. ✨" }
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
