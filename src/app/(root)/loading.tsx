import { Loader } from "@/components/ui/loader"

export default function Loading() {
  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center">
      <Loader variant="spinner" size={28} />
    </div>
  )
}
