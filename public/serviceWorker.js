// @ts-check

/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = /** @type {ServiceWorkerGlobalScope & typeof globalThis} */ (
  globalThis
)

sw.addEventListener("push", (event) => {
  const message = event.data?.json()
  const { title, body, icon, image, url, tag } = message

  async function handlePushEvent() {
    const windowClients = await sw.clients.matchAll({ type: "window" })

    if (windowClients.length > 0) {
      const appInForeground = windowClients.some((client) => client.focused)

      if (appInForeground) {
        return
      }
    }

    await sw.registration.showNotification(title, {
      body,
      icon: icon || "/app-icon-192.png",
      image,
      badge: "/app-icon-192.png",
      tag,
      renotify: true,
      data: { url: url || "/notifications" },
    })
  }

  event.waitUntil(handlePushEvent())
})

sw.addEventListener("notificationclick", (event) => {
  const notification = event.notification
  notification.close()

  async function handleNotificationClick() {
    const windowClients = await sw.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    })

    const url = notification.data?.url || "/notifications"

    if (windowClients.length > 0) {
      await windowClients[0].focus()
      windowClients[0].postMessage({ url })
    } else {
      sw.clients.openWindow(url)
    }
  }

  event.waitUntil(handleNotificationClick())
})
