import { requireUser } from "@/lib/require-user"

export default async function Home() {
  await requireUser()
  return (
    <div className="">
      <p>
        {" "}
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Quae ea
        veritatis unde, dignissimos hic cupiditate obcaecati ad dolore, quasi
        mollitia nihil delectus ex corrupti quisquam suscipit, harum cum maxime
        aliquam?{" "}
      </p>
    </div>
  )
}
