export type HindiQuote = { text: string; meaning: string }
export type EnglishQuote = { text: string; author: string }

export const HINDI_QUOTES: HindiQuote[] = [
  { text: "कर्म ही पूजा है।", meaning: "Work is worship." },
  {
    text: "जहाँ चाह, वहाँ राह।",
    meaning: "Where there is a will, there is a way.",
  },
  {
    text: "मन के हारे हार है, मन के जीते जीत।",
    meaning: "Defeat and victory both begin in the mind.",
  },
  {
    text: "अभ्यास ही सफलता की कुंजी है।",
    meaning: "Practice is the key to success.",
  },
  {
    text: "बूँद-बूँद से घड़ा भरता है।",
    meaning: "Drop by drop the pitcher fills.",
  },
  {
    text: "जो होता है, अच्छे के लिए होता है।",
    meaning: "Whatever happens, happens for the good.",
  },
  {
    text: "परिश्रम का फल हमेशा मीठा होता है।",
    meaning: "The fruit of hard work is always sweet.",
  },
]

export const ENGLISH_FALLBACK: EnglishQuote[] = [
  {
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
  },
  { text: "Well done is better than well said.", author: "Benjamin Franklin" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
]

export function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T
}
