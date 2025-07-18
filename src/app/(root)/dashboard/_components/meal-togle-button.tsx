"use client";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { tryCatch } from "@/hooks/try-catch";
import kyInstance from "@/lib/ky";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { toggleMealStatus } from "../action";
import z from "zod";
import { MealStatusType } from "@/generated/prisma";
import { cn } from "@/lib/utils";

const toggleMealStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});
type ToggleMealStatusForm = z.infer<typeof toggleMealStatusSchema>;

export default function MealToggleButton() {
  const [isPending, startTransition] = useTransition();
  const [isSwitching, setIsSwitching] = useState(false);
  const id = useId();

  const form = useForm<ToggleMealStatusForm>({
    resolver: zodResolver(toggleMealStatusSchema),
    defaultValues: { status: "INACTIVE" },
  });

  const { watch, register, setValue } = form;
  const currentStatus = watch("status");

  useEffect(() => {
    startTransition(async () => {
      const { data, error } = await tryCatch(
        kyInstance
          .get("/api/user/meal/status", {
            retry: { limit: 2 },
          })
          .json<{ status: MealStatusType }>(),
      );

      if (error) {
        toast.error(
          error.name === "TimeoutError"
            ? "Request timed out. Please try again."
            : "An unexpected error occurred. Please try again later.",
        );
        return;
      }

      setValue("status", data.status);
    });
  }, [setValue]);

  const handleSwitchChange = async () => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setIsSwitching(true);
    const { data: result, error } = await tryCatch(toggleMealStatus(newStatus));
    setIsSwitching(false);
    if (error) {
      toast.error("Failed to update meal status.");
      return;
    }

    if (result.status === "success") {
      setValue("status", newStatus);
      toast.success(
        `Meal status turned ${newStatus === "ACTIVE" ? "ON" : "OFF"}.`,
      );
    } else if (result.status === "error") {
      toast.error(result.message);
    }
  };

  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="inline-flex items-center gap-2 [--primary:var(--color-indigo-500)] [--ring:var(--color-indigo-300)] in-[.dark]:[--primary:var(--color-indigo-500)] in-[.dark]:[--ring:var(--color-indigo-900)]">
        <Switch
          id={id}
          {...register("status")}
          checked={currentStatus === "ACTIVE"}
          onCheckedChange={handleSwitchChange}
          disabled={isSwitching || isPending || currentStatus === "SUSPENDED"}
          className="cursor-pointer"
        />
        <Label htmlFor={id} className="sr-only">
          Meal status toggle
        </Label>
      </div>

      <span
        className={cn(
          "ml-2 rounded px-2 py-1 text-sm font-medium transition-colors",
          {
            "bg-green-100 text-green-800": currentStatus === "ACTIVE",
            "bg-red-100 text-red-800": currentStatus === "INACTIVE",
            "bg-yellow-100 text-yellow-800": currentStatus === "SUSPENDED",
          },
        )}
      >
        {currentStatus === "SUSPENDED"
          ? "Meal status: Suspended "
          : `Meal status: ${currentStatus === "ACTIVE" ? "ON" : "OFF"}`}
      </span>
    </div>
  );
}
