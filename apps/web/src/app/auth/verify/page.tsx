export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { XCircle } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  no_token: "Токен подтверждения отсутствует.",
  invalid_token: "Токен истёк или уже был использован.",
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  if (error) {
    return (
      <VerifyLayout
        title="Ссылка недействительна"
        message={ERROR_MESSAGES[error] ?? "Произошла ошибка."}
      />
    );
  }

  if (!token) {
    return <VerifyLayout title="Ошибка" message="Токен подтверждения отсутствует." />;
  }

  redirect(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
}

function VerifyLayout({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center">
          <XCircle className="size-14 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <p className="mt-6 text-xs text-muted-foreground">
          Вернитесь на главную и войдите в аккаунт вручную.
        </p>
      </div>
    </div>
  );
}
