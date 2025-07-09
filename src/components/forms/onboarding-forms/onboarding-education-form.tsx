"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { educationSchema } from "@/lib/validations";
import { useOnboardingStore } from "@/app/(root)/onboarding/store";
import { useEffect } from "react";
import { useHydration } from "@/hooks/use-hydration";

type EducationFormValues = z.infer<typeof educationSchema>;
export default function OnboardingEducationForm() {
  const router = useRouter();
  const isHydrated = useHydration();
  const name = useOnboardingStore((state) => state.name);
  const phone = useOnboardingStore((state) => state.selfPhNo);
  const dob = useOnboardingStore((state) => state.dob);
  const address = useOnboardingStore((state) => state.address);
  const setData = useOnboardingStore((state) => state.setData);
  const form = useForm<EducationFormValues>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      degree: "",
      admissionYear: new Date().getFullYear(),
      passingYear: new Date().getFullYear() + 4,
      institute: "",
    },
  });

  function onSubmit(values: EducationFormValues) {
    setData({
      education: values,
    });
    router.push("/onboarding/hostel");
  }
  useEffect(() => {
    if (!isHydrated || !useOnboardingStore.persist.hasHydrated) return;
    if (!name || !phone || !dob || !address) {
      router.push("/onboarding/identity");
    }
  }, [isHydrated, name, phone, dob, address, router]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto max-w-3xl space-y-6 py-5"
      >
        <FormField
          control={form.control}
          name="degree"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Degree</FormLabel>
              <FormControl>
                <Input placeholder="e.g. B.Tech, M.Sc" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-4 md:flex-row">
          <FormField
            control={form.control}
            name="admissionYear"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Admission Year</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g. 2020"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="passingYear"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Passing Year</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g. 2024"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="institute"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Institute</FormLabel>
              <FormControl>
                <Input placeholder="Your college or university" {...field} />
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
          <Button type="submit">
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
