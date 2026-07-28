import {
  ENGLISH_FALLBACK,
  HINDI_QUOTES,
  pickRandom,
} from "@/lib/widgets/quotes"

export const dynamic = "force-dynamic"

export async function GET() {
  return Response.json({
    hindi: pickRandom(HINDI_QUOTES),
    english: pickRandom(ENGLISH_FALLBACK),
  })
}
