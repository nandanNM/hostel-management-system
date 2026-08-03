import { NonVegType } from "@/lib/generated/prisma"

/**
 * Richest to leanest. A boarder or guest may take the item the hostel is
 * serving, or anything *below* it — never anything above it, because the
 * kitchen has not bought it. Veg is always available, so it terminates the
 * chain.
 */
export const NON_VEG_PRIORITY: NonVegType[] = [
  NonVegType.MUTTON,
  NonVegType.CHICKEN,
  NonVegType.FISH,
  NonVegType.EGG,
  NonVegType.NONE,
]

/**
 * Map a menu item's name to the kind of non-veg it is.
 *
 * Order matters: "mutton" is checked before the rest so an item named
 * "Mutton curry" is not missed.
 */
export function getNonVegTypeFromItemName(itemName: string): NonVegType {
  const name = itemName.toLowerCase()
  if (name.includes("mutton")) return NonVegType.MUTTON
  if (name.includes("chicken")) return NonVegType.CHICKEN
  if (name.includes("fish")) return NonVegType.FISH
  if (name.includes("egg")) return NonVegType.EGG
  return NonVegType.NONE
}

/**
 * The single non-veg item a schedule entry offers, or null when it offers none.
 *
 * When an entry lists several non-veg items, the highest-priority one wins —
 * that is what the kitchen leads with.
 */
export function resolveOffering(
  menuItemNames: string[],
  priority: NonVegType[] = NON_VEG_PRIORITY
): NonVegType | null {
  const chain = priority.length > 0 ? priority : NON_VEG_PRIORITY
  const offered = new Set(menuItemNames.map(getNonVegTypeFromItemName))
  offered.delete(NonVegType.NONE)

  if (offered.size === 0) return null

  return chain.find((type) => offered.has(type)) ?? null
}

/**
 * The non-veg choices a guest meal may be booked with for a given offering.
 *
 * Fish day → FISH, EGG, NONE. Chicken day → CHICKEN, FISH, EGG, NONE. Booking
 * chicken on a fish day would make the kitchen buy something for one guest.
 *
 * A null offering means the prefect has not scheduled that slot yet; every
 * option stays open rather than blocking bookings.
 */
export function getAllowedNonVegTypes(
  offering: NonVegType | null,
  priority: NonVegType[] = NON_VEG_PRIORITY
): NonVegType[] {
  const chain = priority.length > 0 ? priority : NON_VEG_PRIORITY
  if (!offering || offering === NonVegType.NONE) return [...chain]

  const startIndex = chain.indexOf(offering)
  if (startIndex === -1) return [...chain]

  const allowed = chain.slice(startIndex)
  // Veg is always bookable, even if the prefect reorders it out of the tail.
  return allowed.includes(NonVegType.NONE)
    ? allowed
    : [...allowed, NonVegType.NONE]
}

/**
 * What a boarder actually gets served: starting at today's offering, the first
 * option they have not marked as disliked.
 */
export function calculateActualNonVegMeal(
  userPrimaryPreference: NonVegType,
  userDislikedNonVegs: NonVegType[],
  hostelDailyOffering?: NonVegType | null,
  priority: NonVegType[] = NON_VEG_PRIORITY
): NonVegType {
  const chain = priority.length > 0 ? priority : NON_VEG_PRIORITY

  if (userPrimaryPreference === NonVegType.NONE) return NonVegType.NONE

  if (!hostelDailyOffering || hostelDailyOffering === NonVegType.NONE)
    return NonVegType.NONE

  const startIndex = chain.indexOf(hostelDailyOffering)
  if (startIndex === -1) return NonVegType.NONE

  return (
    chain
      .slice(startIndex)
      .find((option) => !userDislikedNonVegs.includes(option)) ??
    NonVegType.NONE
  )
}
