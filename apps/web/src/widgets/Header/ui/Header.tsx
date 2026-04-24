import { Suspense } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { getCurrentUser } from "@/shared/lib/get-user";
import { Container } from "@/shared/ui/container";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { HeaderSearch } from "./HeaderSearch";
import { HeaderUserMenu } from "./HeaderUserMenu";

export async function Header() {
  const user = await getCurrentUser();
  const botId = process.env.TELEGRAM_BOT_ID || process.env.NEXT_PUBLIC_BOT_ID;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg backdrop-saturate-150">
      <Container size="2xl">
        <div className="flex h-16 items-center gap-4">
          {/* Лого */}
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight transition-opacity hover:opacity-80"
          >
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="text-[15px]">УслугиРядом</span>
          </Link>

          {/* Поиск — только на md+ */}
          <div className="ml-4 hidden flex-1 md:block max-w-xl">
            <HeaderSearch />
          </div>

          {/* Правый блок */}
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
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
      </Container>
    </header>
  );
}
