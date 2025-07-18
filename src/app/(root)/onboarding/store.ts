import { User } from "@/lib/validations";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type OnboardingState = Partial<User> & {
  setData: (data: Partial<User>) => void;
  clearData: () => void;
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      setData: (data) => set(data),
      clearData: () => {
        set({});
        localStorage.removeItem("onboarding-storage");
      },
    }),
    {
      name: "onboarding-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
