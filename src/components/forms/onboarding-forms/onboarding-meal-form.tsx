"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createMealSchema,
  CreateMealValues as CreateMealFormValues,
} from "@/lib/validations";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  MEAL_TIME_OPTIONS,
  MEAL_TYPE_OPTIONS,
  NON_VEG_OPTIONS,
} from "@/constants/form.constants";
import { ArrowLeft } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useOnboardingStore } from "@/app/(root)/onboarding/store";
import { useEffect, useTransition } from "react";
import { tryCatch } from "@/hooks/try-catch";
import { CreateUserOnboarding } from "./action";
import { toast } from "sonner";
import LoadingButton from "@/components/LoadingButton";

export default function OnboardingMealForm() {
  const router = useRouter();
  const [isPanding, startTransition] = useTransition();
  const name = useOnboardingStore((state) => state.name);
  const selfPhNo = useOnboardingStore((state) => state.selfPhNo);
  const dob = useOnboardingStore((state) => state.dob);
  const gender = useOnboardingStore((state) => state.gender);
  const religion = useOnboardingStore((state) => state.religion);
  const address = useOnboardingStore((state) => state.address);
  const hostel = useOnboardingStore((state) => state.hostel);
  const education = useOnboardingStore((state) => state.education);
  const form = useForm<CreateMealFormValues>({
    resolver: zodResolver(createMealSchema),
    defaultValues: {
      mealType: "non-veg",
      nonVegType: "none",
      mealTime: "both",
      mealMassage: "",
    },
  });

  function onSubmit(values: CreateMealFormValues) {
    startTransition(async () => {
      if (
        name &&
        gender &&
        religion &&
        dob &&
        selfPhNo &&
        address &&
        hostel &&
        education
      ) {
        const { data: result, error } = await tryCatch(
          CreateUserOnboarding({
            name,
            gender,
            religion,
            dob,
            selfPhNo,
            address,
            hostel,
            education,
            meal: values,
          }),
        );
        if (error) {
          toast.error("A Unexpected error occurred. Please try again later.");
          return;
        }
        if (result.status === "success") {
          useOnboardingStore.persist.clearStorage();
          toast.success(result.message);
          redirect("/dashboard");
        }
      } else {
        toast.error("Please fill all the fields");
      }
    });
  }

  useEffect(() => {
    if (!useOnboardingStore.persist.hasHydrated) return;
    if (!hostel) {
      router.push("/onboarding/identity");
    }
  }, [name, selfPhNo, dob, address, hostel, education, router]);
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto max-w-xl space-y-6"
      >
        <div className="flex flex-wrap gap-4">
          <FormField
            control={form.control}
            name="mealType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meal Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select meal type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MEAL_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nonVegType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Non-Veg Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value ?? "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select non-veg type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {NON_VEG_OPTIONS.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mealTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meal Time</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select meal time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MEAL_TIME_OPTIONS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="mealMassage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meal Message</FormLabel>
              <FormControl>
                <Input placeholder="Optional message..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex w-full justify-end gap-3 p-4">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <LoadingButton loading={isPanding} type="submit">
            Submit
          </LoadingButton>
        </div>
      </form>
    </Form>
  );
}
