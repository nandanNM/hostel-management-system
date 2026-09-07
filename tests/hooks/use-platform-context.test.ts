import { describe, expect, it } from "vitest"

import { detectBrowser } from "@/hooks/use-platform-context"

// Real strings. Every iOS browser is WebKit and keeps "Safari/" in its agent,
// and Edge keeps "Chrome/" in its, so the install instructions read as Safari
// for everyone if these are ever tested in the wrong order.
const UA = {
  iosSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  iosChrome:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1",
  iosFirefox:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/127.0 Mobile/15E148 Safari/605.1.15",
  iosEdge:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 EdgiOS/126.0.2592.87 Mobile/15E148 Safari/605.1.15",
  macSafari:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  macChrome:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  winEdge:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.2592.87",
  desktopFirefox:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:127.0) Gecko/20100101 Firefox/127.0",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.71 Mobile Safari/537.36",
}

describe("detectBrowser", () => {
  it("tells the iOS browsers apart despite all of them saying Safari", () => {
    expect(detectBrowser(UA.iosSafari)).toBe("safari")
    expect(detectBrowser(UA.iosChrome)).toBe("chrome")
    expect(detectBrowser(UA.iosFirefox)).toBe("firefox")
    expect(detectBrowser(UA.iosEdge)).toBe("edge")
  })

  it("does not read Edge as Chrome, or Chrome as Safari", () => {
    expect(detectBrowser(UA.winEdge)).toBe("edge")
    expect(detectBrowser(UA.macChrome)).toBe("chrome")
    expect(detectBrowser(UA.androidChrome)).toBe("chrome")
  })

  it("recognises the desktop browsers", () => {
    expect(detectBrowser(UA.macSafari)).toBe("safari")
    expect(detectBrowser(UA.desktopFirefox)).toBe("firefox")
  })

  it("falls back rather than guessing", () => {
    expect(detectBrowser("curl/8.4.0")).toBe("other")
    expect(detectBrowser("")).toBe("other")
  })
})
