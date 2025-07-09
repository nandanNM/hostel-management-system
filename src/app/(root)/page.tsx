import getSession from "@/lib/getSession";
export default async function Home() {
  const session = await getSession();
  return (
    <div className="">
      <p>
        {" "}
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur ab
        incidunt dolorem molestiae nihil ad quos nemo, illo, alias accusantium,
        sint blanditiis unde. Tempora dolor ab quos illum in dignissimos
        laudantium, doloremque delectus nam repellendus ex perspiciatis
        consequatur accusamus incidunt cumque ad doloribus voluptatibus aut!
      </p>
      <p>{session?.user.name}</p>
      <p>{session?.user.role}</p>
      <p>{session?.user.id}</p>
      <p>{session?.user.image}</p>
    </div>
  );
}
