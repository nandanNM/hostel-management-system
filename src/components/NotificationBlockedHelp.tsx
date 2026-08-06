"use client"

import { type ReactNode } from "react"
import {
  AppleLogo,
  Bell,
  CaretLeft,
  CaretRight,
  GearSix,
  Lock,
  Star,
} from "@phosphor-icons/react"
import { motion } from "motion/react"

import { usePlatformContext } from "@/hooks/use-platform-context"

// A generic, browser-agnostic walkthrough: click the site-info icon next to
// the address bar, find Notifications in the dropdown, flip it to Allow.
// Exact icon/position differs per browser, so this stays illustrative.
//
// Every coordinate below is derived from ONE fixed-size mock (288×160px) so
// the cursor's target always lines up with where the icon is actually
// drawn — no more guessing flex-computed positions separately from the
// cursor path.
const W = 288
const TITLEBAR_H = 28
const TOOLBAR_H = 36
const LOCK = { x: 60, y: TITLEBAR_H + TOOLBAR_H / 2 } // 60, 46
const PANEL = { top: TITLEBAR_H + TOOLBAR_H + 4, left: 24, right: 24 } // top 68
const PANEL_WIDTH = W - PANEL.left - PANEL.right // 240
const TOGGLE = {
  x: PANEL.left + PANEL_WIDTH - 22,
  y: PANEL.top + 24 + 15,
} // 242, 107

const PURPLE = "#a855f7"
const PURPLE_SOFT = "rgba(168, 85, 247, 0.18)"
const OFF_COLOR = "var(--muted-foreground)"

// times: 0=idle 1=cursor-in 2=at-lock 3=lock-press 4=panel-open+move-away
// 5=at-toggle 6=toggle-press 7=toggle-on 8=hold 9=fade-out 10=loop
const TIMES = [0, 0.06, 0.12, 0.16, 0.2, 0.46, 0.5, 0.54, 0.8, 0.92, 1]
const LOOP = {
  duration: 7,
  repeat: Infinity,
  times: TIMES,
  ease: "easeInOut" as const,
}

function BrowserTabAnimation() {
  return (
    <div className="relative mx-auto" style={{ width: W, height: 160 }}>
      {/* browser window */}
      <div
        className="bg-card absolute inset-x-0 top-0 overflow-hidden rounded-lg border shadow-sm"
        style={{ height: TITLEBAR_H + TOOLBAR_H }}
      >
        {/* title bar */}
        <div
          className="flex items-center gap-1.5 border-b px-3"
          style={{ height: TITLEBAR_H }}
        >
          <span className="size-2 rounded-full bg-red-400/70" />
          <span className="size-2 rounded-full bg-yellow-400/70" />
          <span className="size-2 rounded-full bg-green-400/70" />
        </div>
        {/* toolbar */}
        <div
          className="relative flex items-center gap-2 px-2.5"
          style={{ height: TOOLBAR_H }}
        >
          <CaretLeft
            size={12}
            weight="bold"
            className="text-muted-foreground/50"
          />
          <CaretRight
            size={12}
            weight="bold"
            className="text-muted-foreground/30"
          />
          <div className="bg-muted relative h-6 flex-1 rounded-full">
            <span
              className="text-muted-foreground/70 absolute truncate text-[10px]"
              style={{ left: 30, top: 6 }}
            >
              pghall1.in
            </span>
            <Star
              size={10}
              weight="regular"
              className="text-muted-foreground/30 absolute top-1.5 right-2"
            />
          </div>
        </div>
      </div>

      {/* lock icon — absolutely placed at LOCK so it matches the cursor path exactly */}
      <motion.span
        className="absolute z-10 flex items-center justify-center rounded-full"
        style={{
          left: LOCK.x - 9,
          top: LOCK.y - 9,
          width: 18,
          height: 18,
        }}
        animate={{
          color: [
            OFF_COLOR,
            OFF_COLOR,
            OFF_COLOR,
            PURPLE,
            PURPLE,
            OFF_COLOR,
            OFF_COLOR,
            OFF_COLOR,
            OFF_COLOR,
            OFF_COLOR,
            OFF_COLOR,
          ],
          backgroundColor: [
            "transparent",
            "transparent",
            "transparent",
            PURPLE_SOFT,
            PURPLE_SOFT,
            "transparent",
            "transparent",
            "transparent",
            "transparent",
            "transparent",
            "transparent",
          ],
        }}
        transition={LOOP}
      >
        <Lock size={12} weight="bold" />
      </motion.span>

      {/* site-info dropdown */}
      <motion.div
        className="bg-popover text-popover-foreground absolute z-10 origin-top-left rounded-lg border shadow-lg"
        style={{ top: PANEL.top, left: PANEL.left, width: PANEL_WIDTH }}
        animate={{
          opacity: [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0],
          scale: [0.94, 0.94, 0.94, 0.94, 1, 1, 1, 1, 1, 0.96, 0.94],
          y: [-4, -4, -4, -4, 0, 0, 0, 0, 0, -2, -4],
        }}
        transition={LOOP}
      >
        <div className="flex items-center gap-1.5 border-b px-2.5 py-1.5">
          <Lock size={11} weight="bold" className="text-muted-foreground" />
          <span className="text-[10px] font-medium">Site settings</span>
        </div>
        <div className="flex items-center justify-between gap-3 px-2.5 py-2.5">
          <span className="flex items-center gap-1.5 text-[10px] font-medium">
            <Bell size={12} />
            Notifications
          </span>
          {/* placeholder to reserve layout space; the real, click-aligned
              toggle is the absolutely-positioned one below */}
          <span className="h-3.5 w-6 shrink-0" />
        </div>
      </motion.div>

      {/* toggle switch — absolutely placed at TOGGLE, matching the cursor path */}
      <motion.span
        className="absolute z-20 inline-flex h-3.5 w-6 items-center rounded-full"
        style={{ left: TOGGLE.x - 12, top: TOGGLE.y - 7 }}
        animate={{
          opacity: [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0],
          backgroundColor: [
            OFF_COLOR,
            OFF_COLOR,
            OFF_COLOR,
            OFF_COLOR,
            OFF_COLOR,
            OFF_COLOR,
            OFF_COLOR,
            PURPLE,
            PURPLE,
            PURPLE,
            OFF_COLOR,
          ],
        }}
        transition={LOOP}
      >
        <motion.span
          className="absolute size-2.5 rounded-full bg-white shadow-sm"
          animate={{
            left: [
              "1.5px",
              "1.5px",
              "1.5px",
              "1.5px",
              "1.5px",
              "1.5px",
              "1.5px",
              "11px",
              "11px",
              "11px",
              "1.5px",
            ],
          }}
          transition={LOOP}
        />
      </motion.span>

      {/* cursor + click ripple — travels LOCK → TOGGLE using the exact same coordinates */}
      <motion.div
        className="pointer-events-none absolute z-30"
        style={{ marginLeft: -7, marginTop: -7 }}
        animate={{
          left: [
            LOCK.x,
            LOCK.x,
            LOCK.x,
            LOCK.x,
            LOCK.x,
            TOGGLE.x,
            TOGGLE.x,
            TOGGLE.x,
            TOGGLE.x,
            TOGGLE.x,
            LOCK.x,
          ],
          top: [
            LOCK.y,
            LOCK.y,
            LOCK.y,
            LOCK.y,
            LOCK.y,
            TOGGLE.y,
            TOGGLE.y,
            TOGGLE.y,
            TOGGLE.y,
            TOGGLE.y,
            LOCK.y,
          ],
          opacity: [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        }}
        transition={LOOP}
      >
        <motion.span
          className="border-foreground/70 bg-background/80 block size-3.5 rounded-full border-2 shadow-sm"
          animate={{
            scale: [1, 1, 1, 0.6, 1, 1, 0.6, 1, 1, 1, 1],
          }}
          transition={LOOP}
        />
        <motion.span
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: PURPLE }}
          animate={{
            scale: [1, 1, 1, 1, 2.4, 1, 1, 2.4, 1, 1, 1],
            opacity: [0, 0, 0, 0.7, 0, 0, 0.7, 0, 0, 0, 0],
          }}
          transition={LOOP}
        />
      </motion.div>
    </div>
  )
}

// Android walkthrough: long-press the home-screen icon → tap "App info" in
// the context menu → flip the Notifications toggle. Two scenes (home screen,
// then the app-info screen) crossfade; every coordinate is fixed so the
// cursor always lands on the thing it's supposedly clicking.
const ICON = { x: 115, y: 45 }
const APP_INFO = { x: 140, y: 83 }
const TOGGLE2 = { x: 262, y: 56 }
const MENU = { top: 70, left: 70, width: 140 }

// times: 0=idle 1=cursor-in 2=long-press-hold 3=press-release/menu-opens
// 4=move-to-app-info 5=at-app-info 6=tap-app-info 7=scene2-in-at-toggle
// 8=toggle-press 9=toggle-on 10=hold 11=loop
const TIMES2 = [0, 0.05, 0.1, 0.16, 0.22, 0.42, 0.48, 0.52, 0.58, 0.62, 0.85, 1]
const LOOP2 = {
  duration: 8,
  repeat: Infinity,
  times: TIMES2,
  ease: "easeInOut" as const,
}

function AndroidAppAnimation() {
  return (
    <div className="relative mx-auto" style={{ width: W, height: 160 }}>
      {/* scene 1: home screen */}
      <motion.div
        className="bg-card absolute inset-0 overflow-hidden rounded-lg border shadow-sm"
        animate={{ opacity: [0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0] }}
        transition={LOOP2}
      >
        <div className="flex items-center gap-2 px-3 pt-2">
          {[40, 100, 160, 220].map((x) => (
            <span
              key={x}
              className="bg-muted absolute size-8 rounded-lg"
              style={{ left: x, top: 30 }}
            />
          ))}
          <span
            className="bg-primary/15 text-primary absolute flex size-8 items-center justify-center rounded-lg text-[9px] font-bold"
            style={{ left: ICON.x - 15, top: ICON.y - 15 }}
          >
            DL
          </span>
        </div>

        {/* long-press ring around the icon */}
        <motion.span
          className="absolute rounded-full border-2"
          style={{
            left: ICON.x - 20,
            top: ICON.y - 20,
            width: 40,
            height: 40,
            borderColor: PURPLE,
          }}
          animate={{
            opacity: [0, 0, 0.6, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            scale: [1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1],
          }}
          transition={LOOP2}
        />

        {/* context menu */}
        <motion.div
          className="bg-popover text-popover-foreground absolute rounded-md border shadow-lg"
          style={{ top: MENU.top, left: MENU.left, width: MENU.width }}
          animate={{
            opacity: [0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0],
            scale: [0.92, 0.92, 0.92, 1, 1, 1, 1, 0.96, 0.92, 0.92, 0.92, 0.92],
          }}
          transition={LOOP2}
        >
          <div className="px-3 py-1.5 text-[10px] font-medium">App info</div>
          <div className="text-muted-foreground border-t px-3 py-1.5 text-[10px]">
            Uninstall
          </div>
        </motion.div>
      </motion.div>

      {/* scene 2: app-info / notification settings */}
      <motion.div
        className="bg-card absolute inset-0 overflow-hidden rounded-lg border shadow-sm"
        animate={{ opacity: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0] }}
        transition={LOOP2}
      >
        <div className="flex items-center gap-2 border-b px-3 py-1.5">
          <CaretLeft
            size={12}
            weight="bold"
            className="text-muted-foreground"
          />
          <span className="text-[10px] font-medium">D.L Bhawan</span>
        </div>
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="flex items-center gap-1.5 text-[10px] font-medium">
            <Bell size={12} />
            Notifications
          </span>
          <span className="h-3.5 w-6 shrink-0" />
        </div>

        <motion.span
          className="absolute z-20 inline-flex h-3.5 w-6 items-center rounded-full"
          style={{ left: TOGGLE2.x - 12, top: TOGGLE2.y - 7 }}
          animate={{
            backgroundColor: [
              OFF_COLOR,
              OFF_COLOR,
              OFF_COLOR,
              OFF_COLOR,
              OFF_COLOR,
              OFF_COLOR,
              OFF_COLOR,
              OFF_COLOR,
              OFF_COLOR,
              PURPLE,
              PURPLE,
              OFF_COLOR,
            ],
          }}
          transition={LOOP2}
        >
          <motion.span
            className="absolute size-2.5 rounded-full bg-white shadow-sm"
            animate={{
              left: [
                "1.5px",
                "1.5px",
                "1.5px",
                "1.5px",
                "1.5px",
                "1.5px",
                "1.5px",
                "1.5px",
                "1.5px",
                "11px",
                "11px",
                "1.5px",
              ],
            }}
            transition={LOOP2}
          />
        </motion.span>
      </motion.div>

      {/* cursor + click ripple — glides ICON → APP_INFO → TOGGLE2 */}
      <motion.div
        className="pointer-events-none absolute z-30"
        style={{ marginLeft: -7, marginTop: -7 }}
        animate={{
          left: [
            ICON.x,
            ICON.x,
            ICON.x,
            ICON.x,
            ICON.x,
            APP_INFO.x,
            APP_INFO.x,
            TOGGLE2.x,
            TOGGLE2.x,
            TOGGLE2.x,
            TOGGLE2.x,
            ICON.x,
          ],
          top: [
            ICON.y,
            ICON.y,
            ICON.y,
            ICON.y,
            ICON.y,
            APP_INFO.y,
            APP_INFO.y,
            TOGGLE2.y,
            TOGGLE2.y,
            TOGGLE2.y,
            TOGGLE2.y,
            ICON.y,
          ],
          opacity: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        }}
        transition={LOOP2}
      >
        <motion.span
          className="border-foreground/70 bg-background/80 block size-3.5 rounded-full border-2 shadow-sm"
          animate={{
            scale: [1, 1, 0.6, 1, 1, 1, 0.6, 1, 0.6, 1, 1, 1],
          }}
          transition={LOOP2}
        />
        <motion.span
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: PURPLE }}
          animate={{
            scale: [1, 1, 1, 1, 1, 1, 1, 2.2, 1, 2.2, 1, 1],
            opacity: [0, 0, 0, 0, 0, 0, 0.7, 0, 0.7, 0, 0, 0],
          }}
          transition={LOOP2}
        />
      </motion.div>
    </div>
  )
}

type Step = { icon: ReactNode; text: ReactNode }

function StepList({ steps }: { steps: Step[] }) {
  return (
    <div className="bg-card mx-auto flex w-full max-w-sm flex-col divide-y rounded-lg border shadow-sm">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <span className="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
            {step.icon}
          </span>
          <span className="text-xs leading-snug">{step.text}</span>
        </div>
      ))}
    </div>
  )
}

function InstalledIOSSteps() {
  return (
    <StepList
      steps={[
        {
          icon: <AppleLogo size={13} weight="fill" />,
          text: (
            <>
              Open the iPhone/iPad <strong>Settings</strong> app
            </>
          ),
        },
        {
          icon: <Bell size={13} />,
          text: (
            <>
              Scroll down to <strong>Notifications</strong>
            </>
          ),
        },
        {
          icon: "3",
          text: (
            <>
              Find <strong>D.L Bhawan</strong> in the app list and tap it
            </>
          ),
        },
        {
          icon: "4",
          text: (
            <>
              Turn on <strong>Allow Notifications</strong>
            </>
          ),
        },
      ]}
    />
  )
}

function InstalledDesktopSteps() {
  return (
    <StepList
      steps={[
        {
          icon: <Lock size={13} weight="bold" />,
          text: (
            <>
              Look for a lock/site-info icon in this app&apos;s own title bar —
              click it and allow Notifications
            </>
          ),
        },
        {
          icon: <GearSix size={13} />,
          text: (
            <>
              If there&apos;s none, open your OS notification settings (Windows:{" "}
              <strong>Settings → Notifications</strong>; macOS:{" "}
              <strong>System Settings → Notifications</strong>) and allow this
              app
            </>
          ),
        },
      ]}
    />
  )
}

export default function NotificationBlockedHelp() {
  const { isStandalone, os } = usePlatformContext()
  const isAndroidApp = isStandalone && os === "android"

  return (
    <div className="bg-muted/40 overflow-hidden rounded-lg border p-4">
      {!isStandalone && <BrowserTabAnimation />}
      {isStandalone && os === "ios" && <InstalledIOSSteps />}
      {isAndroidApp && <AndroidAppAnimation />}
      {isStandalone && os === "desktop" && <InstalledDesktopSteps />}

      <p className="text-muted-foreground mt-3 text-center text-xs">
        {!isStandalone &&
          "Tap the lock/info icon next to the address bar → find Notifications → switch it to Allow → reload this page."}
        {isAndroidApp &&
          "Long-press the app icon → App info → Notifications → turn it on."}
        {isStandalone &&
          os !== "android" &&
          "You've installed the app, so notification permission is managed by your device, not by this page."}
      </p>
    </div>
  )
}
