import { MEAL_TIME_OPTIONS } from "@/constants/form.constants"
import z from "zod"

export const mealMessageSchema = z.object({
  mealTime: z.enum(MEAL_TIME_OPTIONS),
  date: z.date({ required_error: "Date is required" }),
  message: z.string().min(1, { message: "Message is required" }),
  type: z.enum(["REQUEST", "STAFF_NOTE", "OTHER"]).optional(),
})

export type MealMessage = z.infer<typeof mealMessageSchema>
