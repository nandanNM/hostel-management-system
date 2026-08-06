import { getReadyServiceWorker } from "./serviceWorker"

export class PushPermissionDeniedError extends Error {
  constructor() {
    super(
      "Notifications are blocked for this site. Your browser won't show the permission prompt again — you'll need to allow it manually in your browser's site settings."
    )
    this.name = "PushPermissionDeniedError"
  }
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  const sw = await getReadyServiceWorker()
  return await sw.pushManager.getSubscription()
}

export async function registerPushNotification() {
  if (!("PushManager" in window) || !("Notification" in window)) {
    throw Error("Push notifications are not supported in this browser")
  }

  if (Notification.permission === "denied") {
    throw new PushPermissionDeniedError()
  }

  if (!process.env.NEXT_PUBLIC_WEB_PUSH_KEY) {
    throw Error(
      "Push notifications aren't configured on this server (missing VAPID key). Restart the dev server after setting NEXT_PUBLIC_WEB_PUSH_KEY."
    )
  }

  const existingSubscription = await getCurrentPushSubscription()
  if (existingSubscription) {
    throw Error("Push notifications are already enabled")
  }

  const sw = await getReadyServiceWorker()
  try {
    const subscription = await sw.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_WEB_PUSH_KEY,
    })
    await sendPushSubscriptionToServer(subscription)
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotAllowedError") {
      throw new PushPermissionDeniedError()
    }
    throw error
  }
}

export async function unregisterPushNotification() {
  const existingSubscription = await getCurrentPushSubscription()
  if (!existingSubscription) {
    throw Error("Push notifications are not enabled")
  }

  await deletePushSubscriptionFromServer(existingSubscription)
  await existingSubscription.unsubscribe()
}

export async function sendPushSubscriptionToServer(
  subscription: PushSubscription
) {
  const response = await fetch("/api/register-push", {
    method: "POST",
    body: JSON.stringify(subscription),
  })

  if (!response.ok) {
    throw Error("Failed to send push subscription to server")
  }
}

export async function deletePushSubscriptionFromServer(
  subscription: PushSubscription
) {
  const response = await fetch("/api/register-push", {
    method: "DELETE",
    body: JSON.stringify(subscription),
  })
  if (!response.ok) {
    throw Error("Failed to delete push subscription from server")
  }
}
