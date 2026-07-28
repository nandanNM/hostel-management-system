import {
  ENGLISH_FALLBACK,
  HINDI_QUOTES,
  pickRandom,
} from "@/lib/widgets/quotes"

export const dynamic = "force-dynamic"

export async function GET() {
  const hindi = pickRandom(HINDI_QUOTES)
  let english = pickRandom(ENGLISH_FALLBACK)

  try {
    const res = await fetch("https://zenquotes.io/api/random", {
      cache: "no-store",
    })
    if (res.ok) {
      const data = await res.json()
      const quote = Array.isArray(data) ? data[0] : null
      if (quote?.q && quote?.a) {
        english = { text: quote.q, author: quote.a }
      }
    }
  } catch {}

  return Response.json({ hindi, english })
}
