import { Prisma } from "@/generated/prisma";

export type GetNotificationWithIssuer = Prisma.NotificationGetPayload<{
  include: {
    issuer: true;
  };
}>;
