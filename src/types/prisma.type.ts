import { Prisma } from "@/generated/prisma"

export type GetNotificationWithIssuer = Prisma.NotificationGetPayload<{
  include: {
    issuer: true
  }
}>

export type GetUserMealEventWithUser = Prisma.UserMealEventGetPayload<{
  include: {
    user: {
      select: {
        name: true
        email: true
      }
    }
  }
}>

export type GetMealWithUser = Prisma.MealGetPayload<{
  include: {
    user: {
      select: {
        id: true
        selfPhNo: true
        name: true
        email: true
        image: true
      }
    }
  }
}>
export type GetUsersWithMeal = Prisma.UserGetPayload<{
  select: {
    id: true
    name: true
    email: true
    image: true
    meals: {
      select: {
        id: true
        type: true
      }
    }
  }
}>
