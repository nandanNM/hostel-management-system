import { PushSubscription } from "web-push"

import getSession from "@/lib/get-session"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const newSubscription: PushSubscription | undefined = await req.json()
    if (!newSubscription) {
      return Response.json({ error: "Invalid subscription" }, { status: 400 })
    }

    const session = await getSession()
    if (!session?.user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findFirst({
      where: { id: session.user.id },
      include: { subscriptions: true },
    })
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    const existingSubscription = user.subscriptions.find(
      (sub) => sub.endpoint === newSubscription.endpoint
    )
    if (existingSubscription) {
      await prisma.user.update({
        where: { id: user.id },
        data: { pushEnabled: true },
      })
      return Response.json(
        { message: "Subscription already exists" },
        { status: 200 }
      )
    }

    await prisma.$transaction([
      prisma.subscription.create({
        data: {
          endpoint: newSubscription.endpoint,
          p256dh: newSubscription.keys.p256dh,
          auth: newSubscription.keys.auth,
          user: { connect: { id: user.id } },
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { pushEnabled: true, pushPromptSkipped: false },
      }),
    ])

    return Response.json(
      { message: "Subscription added successfully" },
      { status: 201 }
    )
  } catch (error) {
    console.error(error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const subscriptionToDelete: PushSubscription | undefined = await req.json()
    if (!subscriptionToDelete) {
      return Response.json({ error: "Invalid subscription" }, { status: 400 })
    }

    const session = await getSession()
    if (!session?.user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findFirst({
      where: { id: session.user.id },
      include: { subscriptions: true },
    })
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    const subscription = user.subscriptions.find(
      (sub) => sub.endpoint === subscriptionToDelete.endpoint
    )
    if (!subscription) {
      return Response.json({ error: "Subscription not found" }, { status: 404 })
    }

    const remaining = user.subscriptions.length - 1

    await prisma.$transaction([
      prisma.subscription.delete({ where: { id: subscription.id } }),
      prisma.user.update({
        where: { id: user.id },
        data: { pushEnabled: remaining > 0 },
      }),
    ])

    return Response.json(
      { message: "Subscription deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error(error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
