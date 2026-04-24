export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/features/auth/ui/LoginForm";
import { Header } from "@/widgets/Header/ui/Header";

export const metadata: Metadata = {
  title: "Вход — УслугиРядом",
};

export default function LoginPage() {
  const botId = process.env.TELEGRAM_BOT_ID || process.env.NEXT_PUBLIC_BOT_ID;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <AuthLayout
        title="Добро пожаловать"
        subtitle="Войдите, чтобы найти исполнителя или откликаться на заказы"
      >
        <Suspense>
          <LoginForm botId={botId} initialMode="social" />
        </Suspense>
      </AuthLayout>
    </div>
  );
}

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
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
  );
}
