import { create } from "zustand";
import { DailyMealActivity, GuestMeal } from "@/generated/prisma";
import { tryCatch } from "@/hooks/try-catch";
import kyInstance from "@/lib/ky";
import { toast } from "sonner";
import { approveGuestMealRequest, declineGuestMealRequest } from "./action";
interface MealStore {
  getMealData: () => Promise<void>;
  mealData: DailyMealActivity | null;
  loading: boolean;
  setMealData: (data: DailyMealActivity) => void;
  clearMealData: () => void;
  guestRequests: GuestMeal[] | [];
  errorOnGetGuestRequests: string | null;
  approveGuestRequest: (requestId: string) => Promise<void>;
  declineGuestRequest: (requestId: string) => Promise<void>;
  getGuestMealRequests: () => Promise<void>;
}

export const useMealStore = create<MealStore>((set) => ({
  mealData: null,
  loading: true,
  guestRequests: [],
  errorOnGetGuestRequests: null,
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

  getGuestMealRequests: async () => {
    const { data: result, error } = await tryCatch(
      kyInstance
        .get("/api/manager/meal/panding-gurst-meals")
        .json<GuestMeal[]>(),
    );
    if (!error && result) {
      set({ guestRequests: result, errorOnGetGuestRequests: null });
    }
    if (error) {
      set({ errorOnGetGuestRequests: error.message });
    }
  },
  approveGuestRequest: async (requestId) => {
    toast.promise(approveGuestMealRequest(requestId), {
      loading: "Approving guest meal request...",
      success: "Guest meal request approved successfully",
      error: (err) =>
        `Error: ${err.message || "An unexpected error occurred. Please try again later."}`,
    });
  },

  declineGuestRequest: async (requestId) => {
    toast.promise(declineGuestMealRequest(requestId), {
      loading: "Declining guest meal request...",
      success: "Guest meal request declined successfully",
      error: (err) =>
        `Error: ${err.message || "An unexpected error occurred. Please try again later."}`,
    });
  },
}));
