import { MealTimeType, NonVegType } from "@/lib/generated/prisma"

export const getNonVegTypeFromItemName = (itemName: string): NonVegType => {
  const lowerCaseItem = itemName.toLowerCase()
  if (lowerCaseItem.includes("chicken")) {
    return NonVegType.CHICKEN
  }
  if (lowerCaseItem.includes("fish")) {
    return NonVegType.FISH
  }
  if (lowerCaseItem.includes("egg")) {
    return NonVegType.EGG
  }
  // You can add more mappings here if needed
  return NonVegType.NONE
}
export const calculateActualNonVegMeal = (
  userPrimaryPreference: NonVegType,
  userDislikedNonVegs: NonVegType[],
  hostelDailyOffering?: NonVegType | null
): NonVegType => {
  // Fixed priority chain: MUTTON → CHICKEN → FISH → EGG → VEG
  const PRIORITY_CHAIN: NonVegType[] = [
    NonVegType.MUTTON,
    NonVegType.CHICKEN,
    NonVegType.FISH,
    NonVegType.EGG,
    NonVegType.NONE,
  ]

  // If user is strictly vegetarian → always VEG
  if (userPrimaryPreference === NonVegType.NONE) return NonVegType.NONE

  // If hostel is not serving any valid non-veg today → VEG
  if (!hostelDailyOffering || hostelDailyOffering === NonVegType.NONE)
    return NonVegType.NONE

  // Get the index where today's offering sits in the chain
  const startIndex = PRIORITY_CHAIN.indexOf(hostelDailyOffering)
  if (startIndex === -1) return NonVegType.NONE

  // From hostel’s offering downward in priority, find the first option the user accepts
  return (
    PRIORITY_CHAIN.slice(startIndex).find(
      (option) => !userDislikedNonVegs.includes(option)
    ) ?? NonVegType.NONE
  )
}

export interface MealAttendanceToCreate {
  hostelId: string
  userId: string
  mealId: string
  mealTime: MealTimeType
  date: Date
}
