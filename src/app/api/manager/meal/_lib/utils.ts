import { MealTimeType, NonVegType } from "@/generated/prisma"

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
  hostelDailyOffering: NonVegType
): NonVegType => {
  // If the user's primary preference is NONE, they are always vegetarian.
  if (userPrimaryPreference === NonVegType.NONE) {
    return NonVegType.NONE
  }

  // Define the fallback priority chain for non-veg items.
  const nonVegPriority = [NonVegType.CHICKEN, NonVegType.FISH, NonVegType.EGG]

  // The simplified logic is based on what is being offered today.
  switch (hostelDailyOffering) {
    case NonVegType.CHICKEN:
      // On Chicken day, the only option is Chicken, or Veg if it's disliked.
      if (!userDislikedNonVegs.includes(NonVegType.CHICKEN)) {
        return NonVegType.CHICKEN
      }
      break

    case NonVegType.FISH:
      // On Fish day, a user who prefers Chicken and dislikes Fish will get Egg.
      if (
        userPrimaryPreference === NonVegType.CHICKEN &&
        userDislikedNonVegs.includes(NonVegType.FISH)
      ) {
        if (!userDislikedNonVegs.includes(NonVegType.EGG)) {
          return NonVegType.EGG
        }
      } else {
        // For all other cases on Fish day, if they don't dislike Fish, they get it.
        if (!userDislikedNonVegs.includes(NonVegType.FISH)) {
          return NonVegType.FISH
        }
      }
      break

    case NonVegType.EGG:
      // On Egg day, if they don't dislike Egg, they get it.
      if (!userDislikedNonVegs.includes(NonVegType.EGG)) {
        return NonVegType.EGG
      }
      break

    default:
      // If no specific non-veg is offered, try to fall back to their preference
      // from the general priority list, assuming these are always available as alternatives.
      for (const option of nonVegPriority) {
        if (
          userPrimaryPreference === option &&
          !userDislikedNonVegs.includes(option)
        ) {
          return option
        }
      }
      break
  }

  // If no suitable non-veg option was found, the final fallback is always Vegetarian.
  return NonVegType.NONE
}

export interface MealAttendanceToCreate {
  hostelId: string
  userId: string
  mealId: string
  mealTime: MealTimeType
  date: Date
}
