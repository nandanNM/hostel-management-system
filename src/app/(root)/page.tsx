import { Metadata } from "next"
import { InfoIcon } from "lucide-react"

export const metadata: Metadata = {
  title: "Home",
}
export default async function Home() {
  return (
    <div className="">
      <div className="rounded-md border px-4 py-3">
        <p className="text-sm">
          <InfoIcon
            className="me-3 -mt-0.5 inline-flex text-blue-500"
            size={16}
            aria-hidden="true"
          />
          This is a testing environment for the Hostel Management System. For
          any issues or feedback, please contact support at:{" "}
          <span className="font-bold">+91 8509736585</span>.
        </p>
      </div>

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
          <span className="text-foreground font-semibold">
            Suvadip Mahato
          </span>
        </p>
      </div>
    </div>
  )
}
