import { MealType, NonVegType } from "@/lib/generated/prisma"

/**
 * Richest to leanest. This is the *ordering* authority only — it decides which
 * of the things on offer a boarder is given first, and the prefect can
 * reorder it. What is on offer at all comes from the scheduled dishes.
 */
export const NON_VEG_PRIORITY: NonVegType[] = [
  NonVegType.MUTTON,
  NonVegType.CHICKEN,
  NonVegType.FISH,
  NonVegType.EGG,
  NonVegType.NONE,
]

/** Every tier a dish can offer. Veg is not listed: it is always available. */
export const OFFERABLE_TYPES: NonVegType[] = [
  NonVegType.MUTTON,
  NonVegType.CHICKEN,
  NonVegType.FISH,
  NonVegType.EGG,
]

/** The buckets a generated count splits into. One per tier, plus veg. */
export type MealBucket = "VEG" | "MUTTON" | "CHICKEN" | "FISH" | "EGG"

export const BUCKET_LABELS: Record<MealBucket, string> = {
  VEG: "Vegetarian",
  MUTTON: "Mutton",
  CHICKEN: "Chicken",
  FISH: "Fish",
  EGG: "Egg",
}

/** A scheduled dish, as far as counting cares: only what it can provide. */
export type OfferingDish = { offers: NonVegType[] }

/**
 * Suggest what a dish probably offers, from its name.
 *
 * Only for pre-filling the prefect's Add-Dish form. Nothing that counts meals
 * or prices a booking may call this: "Roti" carries no keyword, and neither do
 * "Dim curry", "Rui machh" or "Kosha mangsho", so guessing turned all of them
 * into veg days.
 */
export function suggestOffersFromName(itemName: string): NonVegType[] {
  const name = itemName.toLowerCase()
  if (name.includes("mutton")) return [...OFFERABLE_TYPES]
  if (name.includes("chicken"))
    return [NonVegType.CHICKEN, NonVegType.FISH, NonVegType.EGG]
  if (name.includes("fish")) return [NonVegType.FISH, NonVegType.EGG]
  if (name.includes("egg")) return [NonVegType.EGG]
  if (name.includes("veg")) return []
  return []
}

/**
 * Everything a slot can provide, richest first.
 *
 * The union of what each scheduled dish offers, ordered by the prefect's
 * priority list. An empty result is a genuine veg-only slot.
 */
export function resolveOffers(
  dishes: OfferingDish[],
  priority: NonVegType[] = NON_VEG_PRIORITY
): NonVegType[] {
  const chain = priority.length > 0 ? priority : NON_VEG_PRIORITY
  const available = new Set(dishes.flatMap((dish) => dish.offers))
  available.delete(NonVegType.NONE)

  const ordered = chain.filter((tier) => available.has(tier))

  // A tier the prefect reordered out of the priority list is still being
  // cooked, so it must not silently vanish from the offer.
  const missing = [...available].filter((tier) => !ordered.includes(tier))
  return [...ordered, ...missing]
}

/**
 * The choices a guest may book: whatever is on offer, plus veg.
 *
 * Veg is always bookable. Nothing above the offer is, because the kitchen has
 * not bought it — booking mutton on a roti night was possible before, and made
 * the kitchen buy a leg of mutton for one guest.
 */
export function getAllowedGuestTypes(offers: NonVegType[]): NonVegType[] {
  return [...offers.filter((t) => t !== NonVegType.NONE), NonVegType.NONE]
}

export type BoarderMealPreference = {
  type: MealType
  nonVegType: NonVegType
  dislikedNonVegTypes: NonVegType[]
}

/**
 * What one boarder is actually given: the first thing on offer they have not
 * marked as disliked, and veg if they have ruled out everything.
 *
 * The count screen and the drill-down both go through here. They used to
 * re-implement it separately and test different conditions — generation on
 * "does a schedule row exist", the drill-down on "was a tier found" — so a
 * roti night put the same boarder in VEG on one screen and CHICKEN on the
 * other. One function, one answer.
 */
export function assignBucket(
  meal: BoarderMealPreference,
  offers: NonVegType[]
): MealBucket {
  if (meal.type === MealType.VEG) return "VEG"

  const given = offers.find(
    (tier) =>
      tier !== NonVegType.NONE && !meal.dislikedNonVegTypes.includes(tier)
  )

  return (given as Exclude<MealBucket, "VEG"> | undefined) ?? "VEG"
}

/**
 * What a stored count was generated from, or `null` when the row predates the
 * offer being recorded and cannot say.
 *
 * Rows written before `offeredTypes` existed kept only the single richest
 * tier. Back then everything below that tier was implicitly available too, so
 * reconstructing the chain from it — not just the tier alone — is what
 * reproduces the numbers those rows actually stored.
 */
export function offersForRecord(
  offeredTypes: NonVegType[],
  actualNonVegServed: NonVegType | null,
  priority: NonVegType[] = NON_VEG_PRIORITY
): NonVegType[] | null {
  if (offeredTypes.length > 0) return offeredTypes

  // A legacy row that recorded no tier is genuinely ambiguous: an unscheduled
  // slot and a veg-only menu both stored null.
  if (actualNonVegServed === null) return null
  if (actualNonVegServed === NonVegType.NONE) return []

  const chain = priority.length > 0 ? priority : NON_VEG_PRIORITY
  const startIndex = chain.indexOf(actualNonVegServed)
  const reachable =
    startIndex === -1 ? [actualNonVegServed] : chain.slice(startIndex)

  return reachable.filter((tier) => tier !== NonVegType.NONE)
}

/**
 * Which buckets a day could have produced, richest first — the cards to show
 * and the drill-downs to link. Follows the offer, so mutton finally has
 * somewhere to appear and a fish night stops advertising chicken.
 */
export function bucketsForOffers(offers: NonVegType[]): MealBucket[] {
  const tiers = offers.filter(
    (tier): tier is Exclude<MealBucket, "VEG"> => tier !== NonVegType.NONE
  )
  return [...tiers, "VEG"]
}

/** Human summary of an offer, for the schedule screen and the count card. */
export function describeOffers(offers: NonVegType[]): string {
  const tiers = offers.filter((t) => t !== NonVegType.NONE)
  if (tiers.length === 0) return "Veg only"
  return tiers.map((t) => BUCKET_LABELS[t as MealBucket]).join(" → ")
}
