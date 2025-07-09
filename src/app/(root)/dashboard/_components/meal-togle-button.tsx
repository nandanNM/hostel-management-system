"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useId } from "react";

export default function MealTogleButton({ status }: { status: boolean }) {
  const id = useId();
  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="inline-flex items-center gap-2 [--primary:var(--color-indigo-500)] [--ring:var(--color-indigo-300)] in-[.dark]:[--primary:var(--color-indigo-500)] in-[.dark]:[--ring:var(--color-indigo-900)]">
        <Switch id={id} className="cursor-pointer" checked={status} />
        <Label htmlFor={id} className="sr-only">
          Colored switch
        </Label>
      </div>
      <span className="ml-2">Meal status: {status ? "On" : "Off"}</span>
    </div>
  );
}
