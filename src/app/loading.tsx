import { Loader } from "@/components/ui/loader"

export default function Loading() {
  return (
    <div className="m-auto mt-5 w-full">
      <Loader variant="comet" size={28} />
    </div>
  )
}
