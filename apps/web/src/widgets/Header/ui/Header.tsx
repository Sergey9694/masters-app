import { Suspense } from "react";
import Link from "next/link";
import { Sparkles, Heart } from "lucide-react";

import { getCurrentUser } from "@/shared/lib/get-user";
import { chatService } from "@/services/chat.service";
import { NotificationBellClient } from "@/features/chat/ui/NotificationBellClient";

import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { HeaderSearch } from "./HeaderSearch";
import { HeaderUserMenu } from "./HeaderUserMenu";
import { HeaderCatalogLinks } from "./HeaderCatalogLinks";

export async function Header() {
  const user = await getCurrentUser();
  const botId = process.env.TELEGRAM_BOT_ID;
  const unreadCount = user ? await chatService.getUnreadCount(user.id) : 0;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg backdrop-saturate-150">
      <div className="flex h-16 items-center gap-0">
          {/* Лого — ширина совпадает с сайдбаром (w-60) на lg+ */}
          <div className="flex shrink-0 items-center px-4 sm:px-6 lg:w-60">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold tracking-tight transition-opacity hover:opacity-80"
            >
              <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Sparkles className="size-4" />
              </span>
              <span className="text-[15px]">УслугиРядом</span>
            </Link>
          </div>

          {/* Поиск — начинается вровень с границей сайдбара */}
          <div className="hidden flex-1 pl-2 pr-4 md:block">
            <HeaderSearch />
          </div>

          {/* Ссылки каталогов */}
          <HeaderCatalogLinks />

          {/* Правый блок */}
          <div className="ml-auto flex items-center gap-2 pr-4 sm:pr-6">
            {user && (
              <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-muted/40 p-1">
                <NotificationBellClient initialUnread={unreadCount} />
                <Link
                  href="/favorites"
                  aria-label="Избранное"
                  className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground hover:shadow-sm"
                >
                  <Heart className="size-3.5" />
                </Link>
              </div>
            )}
            <ThemeToggle className="rounded-xl border border-border/60 bg-muted/40 hover:bg-muted hover:shadow-sm" />
            <Suspense fallback={null}>
              <HeaderUserMenu
                botId={botId}
                user={
                  user
                    ? {
                        id: user.id,
                        firstName: user.firstName,
                        avatar: user.avatar,
                        role: user.role,
                      }
                    : null
                }
              />
            </Suspense>
          </div>
      </div>
    </header>
  );
}
