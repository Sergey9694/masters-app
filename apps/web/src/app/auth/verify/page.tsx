export const dynamic = "force-dynamic";

import { verifyEmailAction } from "@/features/auth/model/actions";
import { CheckCircle2, XCircle } from "lucide-react";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <VerifyLayout icon="error" title="Ошибка" message="Токен подтверждения отсутствует." />
    );
  }

  // При успехе signIn внутри action сразу редиректит на /orders —
  // код ниже выполняется только при ошибке.
  const result = await verifyEmailAction({ token });

  return (
    <VerifyLayout
      icon="error"
      title="Ссылка недействительна"
      message={result?.serverError ?? "Токен истёк или уже был использован."}
    />
  );
}

function VerifyLayout({
  icon,
  title,
  message,
}: {
  icon: "success" | "error";
  title: string;
  message: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center">
          {icon === "success" ? (
            <CheckCircle2 className="size-14 text-success" />
          ) : (
            <XCircle className="size-14 text-destructive" />
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        {icon === "error" && (
          <p className="mt-6 text-xs text-muted-foreground">
            Вернитесь на главную и войдите в аккаунт вручную.
          </p>
        )}
      </div>
    </div>
  );
}
