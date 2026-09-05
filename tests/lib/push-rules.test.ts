import { describe, expect, it } from "vitest"

import { decidePushPrompt } from "@/lib/push-rules"

const LAPTOP = "https://fcm.googleapis.com/fcm/send/laptop-abc"
const PHONE = "https://fcm.googleapis.com/fcm/send/phone-xyz"

const ask = (
  endpoint: string | null,
  endpoints: string[],
  extra: { skipped?: boolean; remindAt?: Date | null } = {}
) =>
  decidePushPrompt({
    endpoint,
    endpoints,
    skipped: extra.skipped ?? false,
    remindAt: extra.remindAt ?? null,
    now: new Date("2026-09-05T00:00:00Z"),
  })

describe("decidePushPrompt", () => {
  it("prompts a device that has never subscribed", () => {
    expect(ask(null, []).shouldPrompt).toBe(true)
    expect(ask(null, []).enabledHere).toBe(false)
  })

  it("leaves a subscribed device alone", () => {
    const state = ask(LAPTOP, [LAPTOP])
    expect(state.shouldPrompt).toBe(false)
    expect(state.enabledHere).toBe(true)
    expect(state.otherDevices).toBe(0)
  })

  it("still prompts the phone when the laptop is already subscribed", () => {
    // The regression: this used to read an account-wide flag, see it set by
    // the laptop, and never prompt the phone - which therefore never created
    // a subscription and never received a single notification.
    const state = ask(null, [LAPTOP])
    expect(state.shouldPrompt).toBe(true)
    expect(state.enabledHere).toBe(false)
    expect(state.otherDevices).toBe(1)
  })

  it("reports each device's own state, not the account's", () => {
    expect(ask(LAPTOP, [LAPTOP, PHONE]).enabledHere).toBe(true)
    expect(ask(PHONE, [LAPTOP, PHONE]).enabledHere).toBe(true)
    // A third device sees both others, and itself as off.
    const tablet = ask(null, [LAPTOP, PHONE])
    expect(tablet.enabledHere).toBe(false)
    expect(tablet.otherDevices).toBe(2)
  })

  it("does not count the asking device among the others", () => {
    expect(ask(LAPTOP, [LAPTOP, PHONE]).otherDevices).toBe(1)
  })

  it("treats an endpoint the server does not know as not subscribed", () => {
    // Browser kept a subscription the server lost; the UI must offer to fix
    // it rather than claim push is on.
    expect(ask(PHONE, [LAPTOP]).enabledHere).toBe(false)
    expect(ask(PHONE, [LAPTOP]).shouldPrompt).toBe(true)
  })

  it("respects skip and snooze account-wide", () => {
    expect(ask(null, [LAPTOP], { skipped: true }).shouldPrompt).toBe(false)
    expect(
      ask(null, [LAPTOP], { remindAt: new Date("2026-09-08T00:00:00Z") })
        .shouldPrompt
    ).toBe(false)
  })

  it("prompts again once the snooze has passed", () => {
    expect(
      ask(null, [], { remindAt: new Date("2026-09-01T00:00:00Z") }).shouldPrompt
    ).toBe(true)
  })
})
