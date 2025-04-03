import AuthProvider from "@/context/AuthProvider";
import NavBar from "@/components/NavBar";
import SideNav from "@/components/SideNav";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <NavBar />
      <div className="flex">
        <SideNav />
        <div className="w-full overflow-x-auto">
          <div className="overflow-auto sm:h-[calc(99vh-60px)]">
            <div className="h-[calc(100vh - 120px)] relative mx-auto flex w-full justify-center overflow-auto overflow-y-auto">
              <div className="w-full md:max-w-7xl">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
