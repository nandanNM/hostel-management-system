"use client";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { hostelSchema } from "@/lib/validations";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HOSTAL_ID, HOSTAL_TAG } from "@/constants/form.constants";
import { useOnboardingStore } from "@/app/(root)/onboarding/store";
import { useEffect } from "react";
import { useHydration } from "@/hooks/use-hydration";

type OnboardingHostelFormValues = z.infer<typeof hostelSchema>;
export default function OnboardingHostelForm() {
  const router = useRouter();
  const isHydrated = useHydration();
  const degree = useOnboardingStore((state) => state.education?.degree);
  const admissionYear = useOnboardingStore(
    (state) => state.education?.admissionYear,
  );
  const passingYear = useOnboardingStore(
    (state) => state.education?.passingYear,
  );
  const institute = useOnboardingStore((state) => state.education?.institute);
  const setData = useOnboardingStore((state) => state.setData);
  const form = useForm<OnboardingHostelFormValues>({
    resolver: zodResolver(hostelSchema),
    defaultValues: {
      hostelName: "",
      hostelTag: "",
      hostelId: "",
      roomNo: "",
    },
  });
  function onSubmit(values: OnboardingHostelFormValues) {
    setData({
      hostel: values,
    });
    router.push("/onboarding/meal");
  }
  useEffect(() => {
    if (!isHydrated || !useOnboardingStore.persist.hasHydrated) return;
    if (!degree || !admissionYear || !passingYear || !institute) {
      router.push("/onboarding/identity");
    }
  }, [isHydrated, degree, admissionYear, passingYear, institute, router]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto max-w-3xl space-y-6 py-5"
      >
        <FormField
          control={form.control}
          name="hostelName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hostel Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter hostel full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-wrap gap-4">
          <FormField
            control={form.control}
            name="hostelTag"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hostel Tag</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        className="w-full"
                        placeholder="Select your hostel tag"
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {HOSTAL_TAG.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
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
            name="hostelId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hostel ID</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        className="w-full"
                        placeholder="Select your hostel id"
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {HOSTAL_ID.map((id) => (
                      <SelectItem key={id} value={id}>
                        {id}
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
          name="roomNo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Room Number</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter room number"
                  {...field}
                />
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
