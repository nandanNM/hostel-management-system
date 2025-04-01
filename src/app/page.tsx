import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  return (
    <div>
      <p>
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Magnam
        quibusdam, rem facilis ullam aut molestias, esse natus enim provident
        temporibus, sunt architecto non quis harum! Itaque deserunt vel
        molestias dolorum. Lorem ipsum dolor sit amet consectetur, adipisicing
        elit. Quis est tenetur veniam. Obcaecati, fugiat cupiditate perspiciatis
        cum veritatis non sed aliquam culpa error commodi alias tenetur a, unde
        sapiente quisquam?
      </p>
      <p>{session?.user.name}</p>
      <p>{session?.user.role}</p>
      <p>{session?.user.email}</p>
    </div>
  );
}
