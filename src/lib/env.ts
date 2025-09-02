import { z, ZodError } from "zod"

const envSchema = z.object({
  AUTH_GOOGLE_SECRET: z.string().min(1),
  AUTH_GOOGLE_ID: z.string().min(1),
  DATABASE_URL: z.string().min(1),
})

try {
  envSchema.parse(process.env)
} catch (e) {
  if (e instanceof ZodError) {
    console.error("Environment validation error:", e.errors)
  }
}

export default envSchema.parse(process.env)
