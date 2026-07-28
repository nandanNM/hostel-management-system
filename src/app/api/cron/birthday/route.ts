import { toZonedTime } from "date-fns-tz"

import { sendHappyBirthdayEmail } from "@/lib/email"
import { UserStatusType } from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"

const TZ = "Asia/Kolkata"

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const today = toZonedTime(new Date(), TZ)
  const month = today.getMonth()
  const day = today.getDate()
  const year = today.getFullYear()

  const users = await prisma.user.findMany({
    where: {
      status: UserStatusType.ACTIVE,
      deletedAt: null,
      dob: { not: null },
    },
    select: { id: true, name: true, email: true, dob: true },
  })

  const birthdayUsers = users.filter((u) => {
    const dob = toZonedTime(u.dob as Date, TZ)
    return dob.getMonth() === month && dob.getDate() === day
  })

  let sent = 0
  for (const u of birthdayUsers) {
    if (!u.email) continue
    const ok = await sendHappyBirthdayEmail({
      to: u.email,
      name: u.name,
      idempotencyKey: `birthday/${u.id}/${year}`,
    })
    if (ok) sent += 1
  }

  return Response.json({ ok: true, birthdays: birthdayUsers.length, sent })
}
