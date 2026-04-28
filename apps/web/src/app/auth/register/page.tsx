import { RegisterForm } from "@/features/auth/ui/RegisterForm";
import { Container } from "@/shared/ui/container";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Регистрация | УслугиРядом",
  description: "Создайте аккаунт, чтобы находить мастеров или предлагать свои услуги.",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12">
      <Container size="sm">
        <div className="flex flex-col gap-8 rounded-3xl border border-border bg-surface p-8 shadow-sm">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Создать аккаунт</h1>
            <p className="text-sm text-muted-foreground">
              Присоединяйтесь к сообществу мастеров и заказчиков
            </p>
          </div>

          <RegisterForm />
        </div>
      </Container>
    </div>
  );
}
