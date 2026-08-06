import { useEffect, useState } from "react"

export type PlatformContext = {
  isStandalone: boolean
  os: "ios" | "android" | "desktop"
}

function detect(): PlatformContext {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { isStandalone: false, os: "desktop" }
  }

  const ua = navigator.userAgent
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari's legacy standalone flag; no display-mode support pre-16.4.
    (navigator as Navigator & { standalone?: boolean }).standalone === true

  const isIOS = /iPad|iPhone|iPod/.test(ua)
  const isAndroid = /Android/.test(ua)

  return {
    isStandalone,
    os: isIOS ? "ios" : isAndroid ? "android" : "desktop",
  }
}

export function usePlatformContext(): PlatformContext {
  const [context, setContext] = useState<PlatformContext>({
    isStandalone: false,
    os: "desktop",
  })

  useEffect(() => {
    setContext(detect())
  }, [])

  return context
}
