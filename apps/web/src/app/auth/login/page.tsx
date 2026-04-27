import { LoginForm } from "@/features/auth/ui/LoginForm";
import { Container } from "@/shared/ui/container";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Вход | УслугиРядом",
  description: "Войдите в свой аккаунт, чтобы управлять заказами и сообщениями.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12">
      <Container size="sm">
        <div className="flex flex-col gap-8 rounded-3xl border border-border bg-surface p-8 shadow-sm">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight">С возвращением</h1>
            <p className="text-sm text-muted-foreground">
              Войдите в аккаунт, чтобы продолжить работу
            </p>
          </div>

          <LoginForm />
        </div>
      </Container>
    </div>
  );
}
