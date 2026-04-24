export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { Metadata } from "next";
import { LoginForm } from "@/features/auth/ui/LoginForm";
import { AuthLayout } from "../login/page";

export const metadata: Metadata = {
  title: "Регистрация — УслугиРядом",
};

export default function RegisterPage() {
  const botId = process.env.TELEGRAM_BOT_ID || process.env.NEXT_PUBLIC_BOT_ID;

  return (
    <AuthLayout
      title="Создать аккаунт"
      subtitle="Зарегистрируйтесь, чтобы размещать заказы или стать исполнителем"
      altText="Уже есть аккаунт?"
      altLinkText="Войти"
      altLinkHref="/auth/login"
    >
      <Suspense>
        <LoginForm botId={botId} initialMode="register" />
      </Suspense>
    </AuthLayout>
  );
}
