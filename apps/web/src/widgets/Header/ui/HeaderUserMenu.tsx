"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { User } from "lucide-react";
import type { Role } from "@prisma/client";

import { cn } from "@/shared/lib/cn";
import { AuthModal } from "@/features/auth/ui/AuthModal";

interface HeaderUserMenuProps {
  user: {
    id: string;
    firstName: string | null;
    avatar: string | null;
    role: Role;
  } | null;
  botId?: string;
}

export function HeaderUserMenu({ user, botId }: HeaderUserMenuProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"social" | "register">("social");

  if (!user) {
    return (
      <>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => { setModalMode("social"); setModalOpen(true); }}
            className="hidden sm:inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-subtle hover:text-foreground"
          >
            Войти
          </button>
          <button
            type="button"
            onClick={() => { setModalMode("register"); setModalOpen(true); }}
            className="inline-flex h-9 items-center rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            Регистрация
          </button>
        </div>

        <AuthModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          initialMode={modalMode}
          botId={botId}
        />
      </>
    );
  }

  const initial = user.firstName?.[0]?.toUpperCase() ?? "?";

  return (
    <Link
      href="/profile"
      aria-label="Профиль"
      className={cn(
        "relative inline-flex size-9 items-center justify-center overflow-hidden rounded-full",
        "bg-muted text-foreground transition-all hover:ring-2 hover:ring-ring/40"
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
    </Link>
  );
}
