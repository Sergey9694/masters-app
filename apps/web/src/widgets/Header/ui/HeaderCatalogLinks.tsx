"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Briefcase } from "lucide-react";
import { cn } from "@/shared/lib/cn";

const LINKS = [
  { href: "/providers", label: "Найти специалиста", icon: Users },
  { href: "/listings", label: "Найти услугу", icon: Briefcase },
];

export function HeaderCatalogLinks() {
  const pathname = usePathname();

  return (
    <div className="hidden items-center gap-1 lg:flex">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
              isActive
                ? "text-primary underline underline-offset-4 decoration-primary decoration-2"
                : "text-primary underline underline-offset-4 decoration-primary/40 decoration-1 hover:decoration-primary hover:decoration-2"
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
