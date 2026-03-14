import { Bell, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/auth";
import HeaderTitle from "@/components/layout/HeaderTitle";

type HeaderProps = {
  userName: string;
};

export default function Header({ userName }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
      <HeaderTitle />

      <div className="flex items-center gap-2">
        <Button size="icon" variant="ghost" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700 sm:block">
          {userName}
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button size="sm" variant="outline" type="submit" className="border-slate-300 bg-white">
            <Wallet className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
