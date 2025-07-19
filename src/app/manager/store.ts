import { create } from "zustand";
import { DailyMealActivity } from "@/generated/prisma";
import { tryCatch } from "@/hooks/try-catch";
import kyInstance from "@/lib/ky";
import { toast } from "sonner";
interface MealStore {
  getMealData: () => Promise<void>;
  mealData: DailyMealActivity | null;
  loading: boolean;
  setMealData: (data: DailyMealActivity) => void;
  clearMealData: () => void;
}

export const useMealStore = create<MealStore>((set) => ({
  mealData: null,
  loading: true,
  getMealData: async () => {
    set({ loading: true });
    const { data: result, error } = await tryCatch(
      kyInstance.get("/api/manager/meal").json<DailyMealActivity>(),
    );
    if (!error && result) {
      toast.success("Successfully fetched today's meal data.");
      set({ mealData: result });
    }
    set({ loading: false });
  },

  setMealData: (data) => set({ mealData: data }),

  clearMealData: () => set({ mealData: null }),
}));
