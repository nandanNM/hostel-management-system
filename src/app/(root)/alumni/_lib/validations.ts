import { z } from "zod"

export const alumniSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  department: z.string().trim().min(1, "Department is required").max(100),
  mobileNumber: z.string().trim().min(1, "Mobile number is required").max(20),
  email: z.string().trim().email("Enter a valid email").max(120),
  year: z.string().trim().min(1, "Year is required").max(20),
})

export type AlumniInput = z.infer<typeof alumniSchema>
