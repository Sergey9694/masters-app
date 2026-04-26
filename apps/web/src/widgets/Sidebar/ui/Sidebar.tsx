import { getCurrentUser } from "@/shared/lib/get-user";
import { SidebarNav } from "./SidebarNav";

export async function Sidebar() {
  const user = await getCurrentUser();
  const isAuth = Boolean(user);
  const isProvider = user?.role === "PROVIDER" || Boolean(user?.providerProfile);

  return (
    <aside className="fixed top-16 left-0 hidden h-[calc(100vh-4rem)] w-60 shrink-0 border-r border-border/60 bg-background lg:block">
      <nav className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-6">
        <SidebarNav isAuth={isAuth} isProvider={isProvider} />
      </nav>
    </aside>
  );
}
