import { Prisma } from "@/generated/prisma";

export type GetNotificationWithIssuer = Prisma.NotificationGetPayload<{
  include: {
    issuer: true;
  };
}>;

export type GetUserMealEventWithUser = Prisma.UserMealEventGetPayload<{
  include: {
    user: {
      select: {
        name: true;
        email: true;
      };
    };
  };
}>;
