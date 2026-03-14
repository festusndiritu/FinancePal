import { auth } from "@/auth";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import Sidebar from "@/components/layout/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userName = session?.user?.name ?? "User";

  return (
    <div className="h-screen overflow-hidden">
      <div className="flex h-full w-full">
        <Sidebar userName={userName} />

        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-white">
          <Header userName={userName} />
          <div className="px-6 py-4 md:hidden">
            <MobileNav userName={userName} />
          </div>
          <div className="flex-1 overflow-auto p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
