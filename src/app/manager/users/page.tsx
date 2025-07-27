"use client";
import { DataTable } from "@/components/table/data-table";
import { useUserMealListStore } from "./store";
import { useEffect, useMemo } from "react";
import { createMealColumns } from "./columns";
import { GetMealWithUser } from "@/types/prisma.type";
import { P } from "@/components/custom/p";
import { Loader2 } from "lucide-react";

export default function UsersPage() {
  const { meals, loading, fetchMeals, updateMealStatus, error } =
    useUserMealListStore();
  useEffect(() => {
    if (meals.length === 0) {
      fetchMeals();
    }
  }, [fetchMeals, meals.length]);
  const columns = useMemo(() => {
    return createMealColumns({
      updateMealStatus,
      onViewProfile: (meal: GetMealWithUser) => {
        console.log("Viewing profile for:", meal.user.name);
      },
    });
  }, [updateMealStatus]);

  return (
    <div className="">
      <div className="mb-4 rounded-md">
        <h2 className="font-semibold">All Users</h2>
      </div>
      {error && <P variant="error">{error}</P>}
      {loading && !error && meals.length === 0 ? (
        <div className="flex justify-center">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <DataTable columns={columns} data={meals} />
      )}
    </div>
  );
}
