import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function Page() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-4">
      <div className="bg-primary-foreground rounded-lg p-4 lg:col-span-2 xl:col-span-1 2xl:col-span-2">
        Test
      </div>
      <div className="bg-primary-foreground rounded-lg p-4">Test</div>
      <div className="bg-primary-foreground rounded-lg p-4">Test</div>
      <div className="bg-primary-foreground rounded-lg p-4">Test</div>
      <div className="bg-primary-foreground rounded-lg p-4 lg:col-span-2 xl:col-span-1 2xl:col-span-2">
        Test
      </div>
      <div className="bg-primary-foreground rounded-lg p-4">Test</div>
    </div>
  );
}
