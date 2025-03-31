import React from "react";
import { P } from "@/components/custom/p";
import { cn } from "@/lib/utils";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex h-screen w-full items-center justify-center">
      <div className="bg-primary hidden h-full w-full flex-1 items-center justify-center p-6 md:flex">
        <div>
          <h1 className={cn("tracking-wider text-white")}>PG1</h1>
          <P className="text-white">
            The only solution you ever need for secure files storage.
          </P>
        </div>
      </div>

      <div className="flex h-full w-full flex-1 items-center justify-center p-4">
        {children}
      </div>
    </main>
  );
}
