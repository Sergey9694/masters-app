"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/shared/lib/cn";
import { NAV_MAIN, NAV_USER, type NavItem } from "@/shared/config/navigation";
import { logoutAction } from "@/features/auth/model/actions";
import { LogOut } from "lucide-react";

interface SidebarNavProps {
  isAuth: boolean;
  isProvider: boolean;
}

export function SidebarNav({ isAuth, isProvider }: SidebarNavProps) {
  const pathname = usePathname();

  const userItems = NAV_USER.filter((item) => {
    if (item.authRequired && !isAuth) return false;
    if (item.providerOnly && !isProvider) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <NavList items={NAV_MAIN} pathname={pathname} />
      {userItems.length > 0 && (
        <div className="space-y-2">
          <p className="px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Личное
          </p>
          <NavList items={userItems} pathname={pathname} />
        </div>
      )}

      {isAuth && (
        <div className="mt-auto pt-6 border-t border-border/40">
          <button
            onClick={() => logoutAction()}
            className="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-red-500/5 hover:text-red-500"
          >
            <LogOut className="size-4 transition-colors group-hover:text-red-500" />
            <span>Выйти</span>
          </button>
        </div>
      )}
    </div>
  );
}

function NavList({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/" ? pathname === "/" : pathname.startsWith(href);

        return (
          <li key={href}>
            <Link
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-subtle text-foreground"
                  : "text-muted-foreground hover:bg-subtle hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "size-4 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
