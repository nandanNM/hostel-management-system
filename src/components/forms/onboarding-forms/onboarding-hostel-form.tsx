"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { HOSTAL_ID } from "@/constants/form.constants"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { onboardingBaseSchema } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useOnboardingStore } from "@/app/(root)/onboarding/store"

const hostelSchema = onboardingBaseSchema.pick({
  hostelId: true,
})
type OnboardingHostelFormValues = z.infer<typeof hostelSchema>
export default function OnboardingHostelForm() {
  const router = useRouter()
  const degree = useOnboardingStore((state) => state.education?.degree)
  const admissionYear = useOnboardingStore(
    (state) => state.education?.admissionYear
  )
  const passingYear = useOnboardingStore(
    (state) => state.education?.passingYear
  )
  const institute = useOnboardingStore((state) => state.education?.institute)
  const setData = useOnboardingStore((state) => state.setData)
  const form = useForm<OnboardingHostelFormValues>({
    resolver: zodResolver(hostelSchema),
    defaultValues: {
      hostelId: "",
    },
  })
  function onSubmit(values: OnboardingHostelFormValues) {
    setData({
      hostelId: values.hostelId,
    })
    router.push("/onboarding/meal")
  }
  useEffect(() => {
    if (!useOnboardingStore.persist.hasHydrated) return
    if (!degree || !admissionYear || !passingYear || !institute) {
      router.push("/onboarding/identity")
    }
  }, [degree, admissionYear, passingYear, institute, router])

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto max-w-3xl space-y-6 py-5"
      >
        <FormField
          control={form.control}
          name="hostelId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hostel ID</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      className="w-full"
                      placeholder="Select your hostel ID"
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {HOSTAL_ID.map((tag) => (
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
  )
}
