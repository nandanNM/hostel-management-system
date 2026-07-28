import { Metadata } from "next"
import { Info as InfoIcon } from "@phosphor-icons/react/ssr"

import { BirthdayAnnouncements } from "./_components/birthday-announcements"
import { HomeWidgets } from "./_components/home-widgets"

export const metadata: Metadata = {
  title: "Home",
}
export default async function Home() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border px-4 py-3">
        <p className="text-sm">
          <InfoIcon
            className="me-3 -mt-0.5 inline-flex text-blue-500"
            size={16}
            aria-hidden="true"
          />
          This is a testing environment for D.L Bhawan (PG1). For any issues or
          feedback, please contact support at:{" "}
          <span className="font-bold">+91 8509736585</span>.
        </p>
      </div>

      <div className="from-primary/10 rounded-xl border bg-linear-to-br to-transparent p-6 text-center">
        <p className="text-primary text-3xl font-extrabold tracking-tight">
          PG1 No.1 🔥
        </p>
        <p className="text-foreground mt-1 text-sm font-medium">
          D.L Bhawan ka apna mess — sabse alag, sabse best.
        </p>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Roz fresh khana, roz full attendance. PG1 zindabad! 🍽️
        </p>
      </div>

      <BirthdayAnnouncements />

      <HomeWidgets />

      <div className="mt-8 flex flex-col items-center justify-center gap-2 text-center">
        <p className="text-muted-foreground text-sm font-medium">
          🚀 Built with 💖 by{" "}
          <a
            href="https://codernandan.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:underline"
          >
            codernandan
          </a>
        </p>
        <p className="text-muted-foreground text-xs">
          🛠️ Maintained by{" "}
          <span className="text-foreground font-semibold">Suvadip Mahato</span>
        </p>
      </div>
    </div>
  )
}
