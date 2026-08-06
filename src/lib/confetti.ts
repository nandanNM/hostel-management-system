import confetti from "canvas-confetti"

const COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6"]

export function fireConfetti() {
  if (typeof window === "undefined") return

  const end = Date.now() + 700

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      startVelocity: 55,
      origin: { x: 0, y: 0.8 },
      colors: COLORS,
    })
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      startVelocity: 55,
      origin: { x: 1, y: 0.8 },
      colors: COLORS,
    })
    if (Date.now() < end) requestAnimationFrame(frame)
  }

  frame()
}
