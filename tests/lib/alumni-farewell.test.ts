import { describe, expect, it } from "vitest"

import {
  alumniFarewellEmail,
  type AlumniFarewellStats,
} from "@/lib/email/emails/alumni-farewell"

const base: AlumniFarewellStats = {
  name: "Suvadip Mahato",
  department: "Computer Science",
  year: "2026",
  roomNo: "B-204",
  daysStayed: 847,
  mealsShared: 1420,
  guestsHosted: 12,
}

describe("alumniFarewellEmail", () => {
  it("greets by first name only", () => {
    expect(alumniFarewellEmail(base).subject).toContain("Suvadip")
    expect(alumniFarewellEmail(base).html).toContain("Dear Suvadip,")
  })

  it("reads a day count as years and months, keeping the exact figure", () => {
    const { html } = alumniFarewellEmail(base)
    expect(html).toContain("2 years, 3 months")
    expect(html).toContain("847 days")
  })

  it("handles a short stay without saying '0 years'", () => {
    const { html } = alumniFarewellEmail({ ...base, daysStayed: 12 })
    expect(html).toContain("12 days")
    expect(html).not.toContain("0 year")
    expect(html).not.toContain("0 month")
  })

  it("uses singular units for exactly one year", () => {
    const { html } = alumniFarewellEmail({ ...base, daysStayed: 365 })
    expect(html).toContain("1 year")
    expect(html).not.toContain("1 years")
  })

  it("omits a stat rather than inventing a zero", () => {
    // "0 meals shared" would be a worse send-off than saying nothing.
    const { html } = alumniFarewellEmail({
      ...base,
      mealsShared: 0,
      guestsHosted: 0,
      roomNo: null,
      daysStayed: null,
    })
    expect(html).not.toContain("Meals shared")
    expect(html).not.toContain("Guests you brought")
    expect(html).not.toContain("Your room")
    expect(html).not.toContain("Time with us")
    // What the prefect typed on the form is always known, so it always shows.
    expect(html).toContain("Computer Science")
    expect(html).toContain("2026")
  })

  it("falls back to a neutral greeting when the name is missing", () => {
    const { html, subject } = alumniFarewellEmail({ ...base, name: null })
    expect(html).toContain("Dear there,")
    expect(subject).toContain("Thank you, there")
  })

  it("groups large numbers the Indian way", () => {
    const { html } = alumniFarewellEmail({ ...base, mealsShared: 123456 })
    expect(html).toContain("1,23,456")
  })
})
