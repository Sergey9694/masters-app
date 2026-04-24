export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { Metadata } from "next";
import { LoginForm } from "@/features/auth/ui/LoginForm";
import { Header } from "@/widgets/Header/ui/Header";
import { AuthLayout } from "../login/page";

export const metadata: Metadata = {
  title: "Регистрация — УслугиРядом",
};

export default function RegisterPage() {
  const botId = process.env.TELEGRAM_BOT_ID || process.env.NEXT_PUBLIC_BOT_ID;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <AuthLayout
        title="Создать аккаунт"
        subtitle="Зарегистрируйтесь, чтобы размещать заказы или стать исполнителем"
      >
        <Suspense>
          <LoginForm botId={botId} initialMode="register" />
        </Suspense>
      </AuthLayout>
    </div>
  );
}
