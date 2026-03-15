import { Suspense } from "react";
import { auth } from "@/auth";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import ChatFab from "@/components/chat/ChatFab";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userName = session?.user?.name ?? "User";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar userName={userName} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header userName={userName} />
        <Suspense>
          <div className="flex-1 overflow-auto pb-20 md:pb-0">
            {children}
          </div>
        </Suspense>
      </div>
      <ChatFab />
      <MobileBottomNav />
    </div>
  );
}