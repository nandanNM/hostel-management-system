"use client";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { tryCatch } from "@/hooks/try-catch";
import kyInstance from "@/lib/ky";
import { toggleMealStatusSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { toggleMealStatus } from "../action";

export default function MealTogleButton() {
  const [isPending, startTransition] = useTransition();
  const [isSwitching, setIsSwitching] = useState<boolean>(false);
  const id = useId();
  const form = useForm({
    resolver: zodResolver(toggleMealStatusSchema),
    defaultValues: { isActive: false },
  });
  const { watch, register, setValue } = form;
  const isActive = watch("isActive");
  useEffect(() => {
    startTransition(async () => {
      const { data, error } = await tryCatch(
        kyInstance
          .get("/api/user/meal/status", {
            retry: {
              limit: 2,
            },
          })
          .json<{ isActive: boolean }>(),
      );
      if (error) {
        toast.error(
          error.name === "TimeoutError"
            ? "Request timed out. Please try again."
            : "A Unexpected error occurred. Please try again later.",
        );
        return;
      }
      setValue("isActive", data.isActive);
    });
  }, [setValue]);

  const handleSwitchChange = async () => {
    setIsSwitching(true);
    const { data: result, error } = await tryCatch(toggleMealStatus(!isActive));
    setIsSwitching(false);
    if (error) {
      toast.error("Failed to update meal status.");
      return;
    }
    if (result.status === "success") {
      setValue("isActive", !isActive);
      toast.success(`Meal status turned ${!isActive ? "On" : "Off"}.`);
    } else if (result.status === "error") {
      toast.error(result.message);
    }
  };

  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="inline-flex items-center gap-2 [--primary:var(--color-indigo-500)] [--ring:var(--color-indigo-300)] in-[.dark]:[--primary:var(--color-indigo-500)] in-[.dark]:[--ring:var(--color-indigo-900)]">
        <Switch
          id={id}
          {...register("isActive")}
          checked={isActive}
          onCheckedChange={handleSwitchChange}
          disabled={isSwitching || isPending}
          className="cursor-pointer"
        />
        <Label htmlFor={id} className="sr-only">
          Colored switch
        </Label>
      </div>
      <span className="ml-2">Meal status: {isActive ? "On" : "Off"}</span>
    </div>
  );
}
