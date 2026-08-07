"use client"

import { useEffect } from "react"

import { fireConfetti } from "@/lib/confetti"
import { haptic } from "@/lib/haptic"
import { toast } from "@/lib/toast"

/** Fires once, the moment a freshly-transferred alumnus lands here. */
export function AlumniCelebration() {
  useEffect(() => {
    fireConfetti()
    haptic()
    toast.success("Congratulations on graduating! 🎓")
  }, [])

  return null
}
