import {
  Cow as Beef,
  Circle as CircleIcon,
  Egg,
  Fish,
  X,
} from "@phosphor-icons/react/ssr"
import {
  CheckCircledIcon,
  CrossCircledIcon,
  QuestionMarkCircledIcon,
  StopwatchIcon,
} from "@radix-ui/react-icons"

import { MealStatusType, NonVegType } from "@/lib/generated/prisma"

export function getNonVegTypeIcon(type: NonVegType) {
  const iconMap = {
    [NonVegType.NONE]: X,
    [NonVegType.CHICKEN]: Beef,
    [NonVegType.MUTTON]: Beef,
    [NonVegType.FISH]: Fish,
    [NonVegType.EGG]: Egg,
  }

  return iconMap[type] || CircleIcon
}

export function getMealStatusIcon(status: MealStatusType) {
  const iconMap = {
    [MealStatusType.ACTIVE]: CheckCircledIcon,
    [MealStatusType.INACTIVE]: CrossCircledIcon,
    [MealStatusType.SUSPENDED]: QuestionMarkCircledIcon,
    [MealStatusType.MAINTENANCE]: StopwatchIcon,
  }
  return iconMap[status] || CircleIcon
}
