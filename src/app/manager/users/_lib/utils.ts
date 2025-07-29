import { MealStatusType, NonVegType } from "@/generated/prisma"
import {
  CheckCircledIcon,
  CrossCircledIcon,
  QuestionMarkCircledIcon,
  StopwatchIcon,
} from "@radix-ui/react-icons"
import { Beef, CircleIcon, Egg, Fish, X } from "lucide-react"

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
