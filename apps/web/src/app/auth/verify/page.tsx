export const dynamic = "force-dynamic";

import { verifyEmailAction } from "@/features/auth/model/actions";
import { CheckCircle2, XCircle, Mail } from "lucide-react";
import Link from "next/link";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <VerifyLayout icon="error" title="Ошибка" message="Токен подтверждения отсутствует." />;
  }

  const result = await verifyEmailAction({ token });

  if (result?.serverError || !result?.data?.success) {
    return (
      <VerifyLayout
        icon="error"
        title="Ссылка недействительна"
        message={result?.serverError ?? "Токен истёк или уже был использован. Запросите новое письмо."}
      />
    );
  }

  return (
    <VerifyLayout
      icon="success"
      title="Email подтверждён!"
      message="Отлично! Теперь войдите в аккаунт, чтобы начать пользоваться сервисом."
      cta={{ href: "/auth/login?verified=1", label: "Войти в аккаунт" }}
    />
  );
}

function VerifyLayout({
  icon,
  title,
  message,
  cta,
}: {
  icon: "success" | "error";
  title: string;
  message: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full">
          {icon === "success" ? (
            <CheckCircle2 className="size-14 text-success" />
          ) : (
            <XCircle className="size-14 text-destructive" />
          )}
        </div>

        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>

        <div className="mt-8 flex flex-col gap-3">
          {cta && (
            <Link
              href={cta.href}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110"
            >
              {cta.label}
            </Link>
          )}
          {!cta && (
            <Link
              href="/auth/login"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-6 text-sm font-medium transition-colors hover:border-primary/60 hover:text-primary"
            >
              На страницу входа
            </Link>
          )}
        </div>

        {icon === "error" && (
          <p className="mt-4 text-xs text-muted-foreground">
            Не получили письмо?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Войдите
            </Link>{" "}
            и запросите повторную отправку
          </p>
        )}
      </div>
    </div>
  );
}
