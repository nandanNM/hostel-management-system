import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { User } from "@/lib/validations"

type OnboardingState = Partial<User> & {
  setData: (data: Partial<User>) => void
  clearData: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      setData: (data) => set(data),
      clearData: () => {
        set({})
        localStorage.removeItem("onboarding-storage")
      },
    }),
    {
      name: "onboarding-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
