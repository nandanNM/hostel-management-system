import { requireUser } from "@/lib/require-user";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();
  if (session.user.onboarding) return redirect("/");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="text-center">
        <h2 className="text-neutral-600">Onboarding</h2>
      </div>
      <div>{children}</div>
    </div>
  );
}
