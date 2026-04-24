export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { LoginForm } from "@/features/auth/ui/LoginForm";

export const metadata: Metadata = {
  title: "Вход — УслугиРядом",
};

export default function LoginPage() {
  const botId = process.env.TELEGRAM_BOT_ID || process.env.NEXT_PUBLIC_BOT_ID;

  return (
    <AuthLayout
      title="Добро пожаловать"
      subtitle="Войдите, чтобы найти исполнителя или откликаться на заказы"
      altText="Нет аккаунта?"
      altLinkText="Зарегистрироваться"
      altLinkHref="/auth/register"
    >
      <Suspense>
        <LoginForm botId={botId} initialMode="social" />
      </Suspense>
    </AuthLayout>
  );
}

export function AuthLayout({
  title,
  subtitle,
  altText,
  altLinkText,
  altLinkHref,
  children,
}: {
  title: string;
  subtitle: string;
  altText: string;
  altLinkText: string;
  altLinkHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <div className="flex h-16 items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight transition-opacity hover:opacity-80"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="size-3.5" />
          </span>
          <span className="text-[15px]">УслугиРядом</span>
        </Link>
        <Link
          href={altLinkHref}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {altText}{" "}
          <span className="font-semibold text-primary">{altLinkText}</span>
        </Link>
      </div>

      {/* Center card */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-100">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-surface p-6 shadow-sm">
            {children}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Продолжая, вы соглашаетесь с{" "}
            <Link href="/docs/terms" className="text-primary hover:underline">
              условиями использования
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
