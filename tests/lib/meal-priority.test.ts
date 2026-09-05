import { describe, expect, it } from "vitest"

import {
  assignBucket,
  bucketsForOffers,
  describeOffers,
  getAllowedGuestTypes,
  NON_VEG_PRIORITY,
  offersForRecord,
  resolveOffers,
  suggestOffersFromName,
  type BoarderMealPreference,
} from "@/lib/meal-priority"

const dish = (...offers: BoarderMealPreference["nonVegType"][]) => ({ offers })

// The library as this hostel actually has it.
const CHICKEN = dish("CHICKEN", "FISH", "EGG")
const FISH = dish("FISH", "EGG")
const EGG = dish("EGG")
const MUTTON = dish("MUTTON", "CHICKEN", "FISH", "EGG")
const VEG = dish()
/** The dish that started all this: a bread the prefect tags themselves. */
const ROTI = dish("CHICKEN", "EGG")

const nonVeg = (
  disliked: BoarderMealPreference["dislikedNonVegTypes"] = []
): BoarderMealPreference => ({
  type: "NON_VEG",
  nonVegType: "CHICKEN",
  dislikedNonVegTypes: disliked,
})

const vegBoarder: BoarderMealPreference = {
  type: "VEG",
  nonVegType: "NONE",
  dislikedNonVegTypes: [],
}

describe("resolveOffers", () => {
  it("unions what every scheduled dish offers", () => {
    expect(resolveOffers([FISH, EGG])).toEqual(["FISH", "EGG"])
    expect(resolveOffers([ROTI, FISH])).toEqual(["CHICKEN", "FISH", "EGG"])
  })

  it("orders by the priority chain, not by schedule order", () => {
    expect(resolveOffers([EGG, MUTTON])).toEqual([
      "MUTTON",
      "CHICKEN",
      "FISH",
      "EGG",
    ])
  })

  it("follows a reordered chain", () => {
    const chain = ["EGG", "CHICKEN", "FISH", "MUTTON", "NONE"] as const
    expect(resolveOffers([CHICKEN], [...chain])).toEqual([
      "EGG",
      "CHICKEN",
      "FISH",
    ])
  })

  it("keeps a tier the prefect reordered out of the chain entirely", () => {
    // It is still being cooked, so it must not silently vanish.
    expect(resolveOffers([MUTTON], ["CHICKEN", "FISH", "EGG"])).toContain(
      "MUTTON"
    )
  })

  it("treats a veg-only menu as offering nothing", () => {
    expect(resolveOffers([VEG])).toEqual([])
    expect(resolveOffers([])).toEqual([])
  })

  it("does not let a staple mask what else is scheduled", () => {
    // Roti next to Fish must not drop fish off the offer.
    expect(resolveOffers([ROTI, FISH])).toContain("FISH")
  })
})

describe("assignBucket", () => {
  it("gives a veg boarder veg, whatever is cooking", () => {
    expect(assignBucket(vegBoarder, ["MUTTON", "CHICKEN"])).toBe("VEG")
  })

  it("counts mutton in its own bucket", () => {
    // Mutton had no counter: its boarders were added to total_veg.
    expect(assignBucket(nonVeg(), resolveOffers([MUTTON]))).toBe("MUTTON")
  })

  it("steps past what a boarder dislikes", () => {
    expect(assignBucket(nonVeg(["CHICKEN"]), resolveOffers([CHICKEN]))).toBe(
      "FISH"
    )
    expect(
      assignBucket(nonVeg(["CHICKEN", "FISH"]), resolveOffers([CHICKEN]))
    ).toBe("EGG")
  })

  it("keeps a chicken-eater on chicken when they only dislike fish", () => {
    expect(assignBucket(nonVeg(["FISH"]), resolveOffers([CHICKEN]))).toBe(
      "CHICKEN"
    )
  })

  it("never offers what is not being cooked", () => {
    // The whole point of ticking per dish: a roti night serving chicken and
    // egg must send a chicken-disliker to EGG, not to fish nobody cooked.
    expect(assignBucket(nonVeg(["CHICKEN"]), resolveOffers([ROTI]))).toBe("EGG")
  })

  it("falls back to veg only when the boarder rules out everything offered", () => {
    expect(
      assignBucket(nonVeg(["CHICKEN", "EGG"]), resolveOffers([ROTI]))
    ).toBe("VEG")
  })

  it("makes a veg-only day veg for everyone", () => {
    expect(assignBucket(nonVeg(), resolveOffers([VEG]))).toBe("VEG")
  })

  it("no longer turns a roti night into a veg day", () => {
    // The original bug: "Roti" matched no keyword, so the day resolved to no
    // offering and all 27 boarders were counted vegetarian.
    const offers = resolveOffers([ROTI])
    expect(offers.length).toBeGreaterThan(0)
    expect(assignBucket(nonVeg(), offers)).toBe("CHICKEN")
  })
})

describe("getAllowedGuestTypes", () => {
  it("lets a guest book what is cooked, plus veg", () => {
    expect(getAllowedGuestTypes(resolveOffers([ROTI]))).toEqual([
      "CHICKEN",
      "EGG",
      "NONE",
    ])
  })

  it("stops a guest booking above the menu", () => {
    // Booking ₹130 mutton on a roti night made the kitchen buy mutton for one.
    const allowed = getAllowedGuestTypes(resolveOffers([ROTI]))
    expect(allowed).not.toContain("MUTTON")
    expect(allowed).not.toContain("FISH")
  })

  it("leaves veg bookable on a veg-only day", () => {
    expect(getAllowedGuestTypes(resolveOffers([VEG]))).toEqual(["NONE"])
  })
})

describe("bucketsForOffers", () => {
  it("lists exactly the buckets a day could produce, richest first", () => {
    expect(bucketsForOffers(resolveOffers([MUTTON]))).toEqual([
      "MUTTON",
      "CHICKEN",
      "FISH",
      "EGG",
      "VEG",
    ])
    expect(bucketsForOffers(resolveOffers([ROTI]))).toEqual([
      "CHICKEN",
      "EGG",
      "VEG",
    ])
  })

  it("shows veg alone on a veg-only day", () => {
    expect(bucketsForOffers([])).toEqual(["VEG"])
  })
})

describe("suggestOffersFromName (form hint only)", () => {
  it("suggests something sensible for the obvious names", () => {
    expect(suggestOffersFromName("Chicken kosha")).toEqual([
      "CHICKEN",
      "FISH",
      "EGG",
    ])
    expect(suggestOffersFromName("Rui fish curry")).toEqual(["FISH", "EGG"])
    expect(suggestOffersFromName("Aloo posto veg")).toEqual([])
  })

  it("suggests nothing for a name it cannot read", () => {
    // Precisely why the count may never call this: these are chicken, egg,
    // fish and mutton dishes that all read as veg.
    for (const name of [
      "Roti",
      "Dim curry",
      "Rui machh",
      "Kosha mangsho",
      "Murgir jhol",
    ]) {
      expect(suggestOffersFromName(name)).toEqual([])
    }
  })
})

describe("describeOffers", () => {
  it("spells out the fallback order for the prefect", () => {
    expect(describeOffers(resolveOffers([ROTI]))).toBe("Chicken → Egg")
    expect(describeOffers([])).toBe("Veg only")
  })
})

describe("NON_VEG_PRIORITY", () => {
  it("still terminates in veg, so a boarder always ends up somewhere", () => {
    expect(NON_VEG_PRIORITY.at(-1)).toBe("NONE")
  })
})

describe("offersForRecord (reading rows written before this change)", () => {
  it("uses the recorded offer when the row has one", () => {
    expect(offersForRecord(["CHICKEN", "EGG"], "CHICKEN")).toEqual([
      "CHICKEN",
      "EGG",
    ])
  })

  it("rebuilds the whole chain from a legacy row's single tier", () => {
    // Regression: reading the tier alone put every boarder on a historic fish
    // night into VEG, because assignBucket got an empty offer. Back then
    // everything below the tier was implicitly available, so the chain from
    // it is what reproduces the numbers the row actually stored.
    expect(offersForRecord([], "FISH")).toEqual(["FISH", "EGG"])
    expect(offersForRecord([], "CHICKEN")).toEqual(["CHICKEN", "FISH", "EGG"])
    expect(offersForRecord([], "MUTTON")).toEqual([
      "MUTTON",
      "CHICKEN",
      "FISH",
      "EGG",
    ])
  })

  it("keeps a historic fish night off the veg pile", () => {
    const offers = offersForRecord([], "FISH")!
    expect(assignBucket(nonVeg(), offers)).toBe("FISH")
    expect(assignBucket(nonVeg(["FISH"]), offers)).toBe("EGG")
  })

  it("reads a recorded veg day as veg", () => {
    expect(offersForRecord([], "NONE")).toEqual([])
  })

  it("admits when a legacy row cannot say what was served", () => {
    // An unscheduled slot and a veg menu both stored null back then, so the
    // caller has to fall back to the old single generic bucket.
    expect(offersForRecord([], null)).toBeNull()
  })
})
