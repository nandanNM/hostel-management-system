import { describe, expect, it } from "vitest"

import {
  calculateActualNonVegMeal,
  getAllowedNonVegTypes,
  getNonVegTypeFromItemName,
  NON_VEG_PRIORITY,
  resolveOffering,
} from "./meal-priority"

describe("getNonVegTypeFromItemName", () => {
  it("maps every non-veg kind, including mutton", () => {
    expect(getNonVegTypeFromItemName("Mutton curry")).toBe("MUTTON")
    expect(getNonVegTypeFromItemName("Chicken kosha")).toBe("CHICKEN")
    expect(getNonVegTypeFromItemName("Rui fish curry")).toBe("FISH")
    expect(getNonVegTypeFromItemName("Egg bhurji")).toBe("EGG")
    expect(getNonVegTypeFromItemName("Aloo posto")).toBe("NONE")
  })

  it("is case insensitive", () => {
    expect(getNonVegTypeFromItemName("MUTTON CURRY")).toBe("MUTTON")
  })
})

describe("resolveOffering", () => {
  it("returns null when the menu has no non-veg", () => {
    expect(resolveOffering(["Rice", "Dal", "Aloo posto"])).toBeNull()
  })

  it("picks the richest item when several are listed", () => {
    expect(resolveOffering(["Egg curry", "Chicken curry", "Rice"])).toBe(
      "CHICKEN"
    )
  })

  it("honours a reordered chain", () => {
    // Prefect decides egg outranks chicken
    const chain = ["EGG", "CHICKEN", "FISH", "MUTTON", "NONE"] as const
    expect(resolveOffering(["Chicken curry", "Egg curry"], [...chain])).toBe(
      "EGG"
    )
  })
})

describe("getAllowedNonVegTypes", () => {
  it("allows the scheduled item and everything leaner", () => {
    expect(getAllowedNonVegTypes("FISH")).toEqual(["FISH", "EGG", "NONE"])
    expect(getAllowedNonVegTypes("CHICKEN")).toEqual([
      "CHICKEN",
      "FISH",
      "EGG",
      "NONE",
    ])
  })

  it("never allows something richer than the menu", () => {
    const allowed = getAllowedNonVegTypes("FISH")
    expect(allowed).not.toContain("CHICKEN")
    expect(allowed).not.toContain("MUTTON")
  })

  it("keeps every option open when nothing is scheduled", () => {
    expect(getAllowedNonVegTypes(null)).toEqual(NON_VEG_PRIORITY)
  })

  it("follows a reordered chain", () => {
    const chain = ["EGG", "FISH", "CHICKEN", "MUTTON", "NONE"] as const
    expect(getAllowedNonVegTypes("FISH", [...chain])).toEqual([
      "FISH",
      "CHICKEN",
      "MUTTON",
      "NONE",
    ])
  })

  it("always leaves veg bookable, even if reordered away", () => {
    const chain = ["MUTTON", "NONE", "CHICKEN", "FISH", "EGG"] as const
    expect(getAllowedNonVegTypes("CHICKEN", [...chain])).toContain("NONE")
  })

  it("falls back to the default chain when given an empty one", () => {
    expect(getAllowedNonVegTypes("FISH", [])).toEqual(["FISH", "EGG", "NONE"])
  })
})

describe("calculateActualNonVegMeal", () => {
  it("serves a strict vegetarian veg regardless of the menu", () => {
    expect(calculateActualNonVegMeal("NONE", [], "CHICKEN")).toBe("NONE")
  })

  it("serves veg when the hostel offers no non-veg", () => {
    expect(calculateActualNonVegMeal("CHICKEN", [], null)).toBe("NONE")
  })

  it("steps down the chain past disliked items", () => {
    expect(calculateActualNonVegMeal("CHICKEN", ["FISH"], "FISH")).toBe("EGG")
    expect(calculateActualNonVegMeal("CHICKEN", ["FISH", "EGG"], "FISH")).toBe(
      "NONE"
    )
  })

  it("never serves richer than the offering", () => {
    expect(calculateActualNonVegMeal("MUTTON", [], "FISH")).toBe("FISH")
  })

  it("follows a reordered chain", () => {
    const chain = ["EGG", "FISH", "CHICKEN", "MUTTON", "NONE"] as const
    expect(calculateActualNonVegMeal("EGG", ["EGG"], "EGG", [...chain])).toBe(
      "FISH"
    )
  })
})
