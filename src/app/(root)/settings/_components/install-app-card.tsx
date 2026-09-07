"use client"

import { useEffect, useState, type ReactNode } from "react"
import {
  AppleLogo,
  Browser,
  DotsThree,
  DownloadSimple,
  Export,
  PlusSquare,
} from "@phosphor-icons/react"

import {
  usePlatformContext,
  type BrowserName,
  type PlatformContext,
} from "@/hooks/use-platform-context"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/** Chrome's install event; non-standard, so not in lib.dom. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

type Guide = {
  steps: { icon: ReactNode; text: ReactNode }[]
  note?: ReactNode
}

const share = <Export className="size-4" />
const menu = <DotsThree weight="bold" className="size-4" />
const add = <PlusSquare className="size-4" />

const IOS_NOTE = (
  <>
    Apple allows this only through the Share menu — no website can install
    itself on iPhone or iPad.
  </>
)

/**
 * Where the Add to Home Screen control lives differs per browser, and every
 * iOS browser is WebKit underneath, so the OS alone cannot pick the right
 * wording.
 */
function iosGuide(browser: BrowserName): Guide {
  const opener: Record<BrowserName, { icon: ReactNode; text: ReactNode }> = {
    safari: {
      icon: share,
      text: (
        <>
          Tap the <strong>Share</strong> button in Safari&apos;s bottom bar.
        </>
      ),
    },
    chrome: {
      icon: share,
      text: (
        <>
          Tap the <strong>Share</strong> icon beside the address bar in Chrome.
        </>
      ),
    },
    edge: {
      icon: menu,
      text: (
        <>
          Tap the <strong>•••</strong> menu in Edge, then <strong>Share</strong>
          .
        </>
      ),
    },
    firefox: {
      icon: menu,
      text: (
        <>
          Tap the <strong>•••</strong> menu in Firefox, then{" "}
          <strong>Share</strong>.
        </>
      ),
    },
    other: {
      icon: menu,
      text: (
        <>
          Open your browser&apos;s menu and choose <strong>Share</strong>.
        </>
      ),
    },
  }

  return {
    steps: [
      opener[browser],
      {
        icon: add,
        text: (
          <>
            Choose <strong>Add to Home Screen</strong>.
          </>
        ),
      },
      {
        icon: <AppleLogo weight="fill" className="size-4" />,
        text: (
          <>
            Tap <strong>Add</strong>, then open the app from your home screen.
          </>
        ),
      },
    ],
    note: IOS_NOTE,
  }
}

function desktopGuide(browser: BrowserName): Guide {
  if (browser === "safari") {
    return {
      steps: [
        {
          icon: <AppleLogo weight="fill" className="size-4" />,
          text: (
            <>
              Open the <strong>File</strong> menu in Safari.
            </>
          ),
        },
        {
          icon: add,
          text: (
            <>
              Choose <strong>Add to Dock</strong>.
            </>
          ),
        },
      ],
      note: <>Safari 17 or newer is needed for this.</>,
    }
  }

  if (browser === "firefox") {
    return {
      steps: [
        {
          icon: <Browser className="size-4" />,
          text: (
            <>
              Firefox on desktop cannot install web apps. Open this page in{" "}
              <strong>Chrome</strong>, <strong>Edge</strong> or{" "}
              <strong>Safari</strong> to install it.
            </>
          ),
        },
      ],
    }
  }

  return {
    steps: [
      {
        icon: menu,
        text: (
          <>
            Open your browser&apos;s menu and choose{" "}
            <strong>Install app</strong> or <strong>Add to Home screen</strong>.
          </>
        ),
      },
    ],
    note: <>If you can&apos;t find it, the app may already be installed.</>,
  }
}

function guideFor({ os, browser }: Pick<PlatformContext, "os" | "browser">) {
  return os === "ios" ? iosGuide(browser) : desktopGuide(browser)
}

function Step({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="bg-muted text-muted-foreground mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md">
        {icon}
      </span>
      <span className="text-sm">{children}</span>
    </li>
  )
}

/**
 * Only Chromium fires `beforeinstallprompt`, so a real Install button is shown
 * wherever that event arrives and written steps everywhere else.
 */
export default function InstallAppCard() {
  const { isStandalone, os, browser } = usePlatformContext()
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      // Cancels Chrome's own mini-infobar so the button below owns the prompt.
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setInstallPrompt(null)

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  if (isStandalone) return null

  const install = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === "accepted") setInstallPrompt(null)
  }

  const guide = guideFor({ os, browser })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DownloadSimple weight="duotone" className="size-5" />
          Install the app
        </CardTitle>
        <CardDescription>
          Add D.L Bhawan to your home screen — it opens full screen, without the
          browser bar, and is the only way to receive meal notifications on
          iPhone and iPad.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {installPrompt ? (
          <Button type="button" onClick={install}>
            <DownloadSimple weight="bold" />
            Install
          </Button>
        ) : (
          <>
            <ol className="space-y-3">
              {guide.steps.map((step, index) => (
                <Step key={index} icon={step.icon}>
                  {step.text}
                </Step>
              ))}
            </ol>
            {guide.note && (
              <p className="text-muted-foreground pt-3 text-xs">{guide.note}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
