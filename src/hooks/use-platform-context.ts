import { useEffect, useState } from "react"

export type BrowserName = "safari" | "chrome" | "firefox" | "edge" | "other"

export type PlatformContext = {
  isStandalone: boolean
  os: "ios" | "android" | "desktop"
  browser: BrowserName
}

/**
 * Order matters. Every iOS browser is WebKit and keeps "Safari" in its user
 * agent, and Edge keeps "Chrome" in its, so the most specific token has to be
 * tested first or everything reads as Safari.
 */
export function detectBrowser(ua: string): BrowserName {
  if (/EdgiOS|Edg\//.test(ua)) return "edge"
  if (/FxiOS|Firefox\//.test(ua)) return "firefox"
  if (/CriOS|Chrome\//.test(ua)) return "chrome"
  if (/Safari\//.test(ua)) return "safari"
  return "other"
}

function detect(): PlatformContext {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { isStandalone: false, os: "desktop", browser: "other" }
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
    browser: detectBrowser(ua),
  }
}

export function usePlatformContext(): PlatformContext {
  const [context, setContext] = useState<PlatformContext>({
    isStandalone: false,
    os: "desktop",
    browser: "other",
  })

  useEffect(() => {
    setContext(detect())
  }, [])

  return context
}
