import CreateGuestMealForm from "@/components/forms/create-guest-meal-form";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Create Guest Meal",
};
export default function Page() {
  return <CreateGuestMealForm />;
}
