"use client";

import Link from "next/link";
import Image from "next/image";
import { User, LogOut, LayoutDashboard, UserCircle } from "lucide-react";
import type { Role } from "@prisma/client";
import { signOut } from "next-auth/react";

import { cn } from "@/shared/lib/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

interface HeaderUserMenuProps {
  user: {
    id: string;
    firstName: string | null;
    avatar: string | null;
    role: Role;
  } | null;
}

/**
 * Меню пользователя в шапке.
 * Незалогинен: ссылки Войти / Регистрация.
 * Залогинен: выпадающее меню (Профиль, Админка, Выход).
 */
export function HeaderUserMenu({ user }: HeaderUserMenuProps) {
  if (!user) {
    return (
      <div className="flex items-center gap-1">
        <Link
          href="/auth/login"
          className="hidden sm:inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-subtle hover:text-foreground"
        >
          Войти
        </Link>
        <Link
          href="/auth/register"
          className="inline-flex h-9 items-center rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          Регистрация
        </Link>
      </div>
    );
  }

  const initial = user.firstName?.[0]?.toUpperCase() ?? "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "relative inline-flex size-9 items-center justify-center overflow-hidden rounded-full outline-none",
            "bg-muted text-foreground transition-all hover:ring-2 hover:ring-ring/40 focus-visible:ring-2 focus-visible:ring-ring/40"
          )}
        >
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={user.firstName ?? "Профиль"}
              fill
              sizes="36px"
              className="object-cover"
            />
          ) : (
            <span className="text-sm font-medium">
              {initial === "?" ? <User className="size-4" /> : initial}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.firstName || "Пользователь"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.role === "ADMIN" ? "Администратор" : "Пользователь"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer w-full flex items-center">
            <UserCircle className="mr-2 h-4 w-4" />
            <span>Профиль</span>
          </Link>
        </DropdownMenuItem>

        {user.role === "ADMIN" && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="cursor-pointer w-full flex items-center">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Админ-панель</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="text-destructive focus:text-destructive cursor-pointer"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Выйти</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

