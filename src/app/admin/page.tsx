import { requireUser } from "@/lib/require-user";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function Page() {
  const session = await requireUser();

  if (session.user.role !== "admin") {
    return redirect("/not-admin");
  }

  return (
    <main className="mx-auto my-10 space-y-3">
      <h1 className="text-center text-xl font-bold">Admin Page</h1>
      <p className="text-center">Welcome, admin!</p>
    </main>
  );
}
