import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, User2, KeyRound, Briefcase } from "lucide-react";

import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { BasicInfoForm } from "@/features/user-profile/ui/BasicInfoForm";
import { ChangePasswordForm } from "@/features/user-profile/ui/ChangePasswordForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Настройки — УслугиРядом",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const [userFull, cities] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id },
      select: {
        firstName: true,
        lastName: true,
        displayName: true,
        phone: true,
        cityId: true,
        passwordHash: true,
      },
    }),
    db.city.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!userFull) redirect("/auth/login");

  const canChangePassword = !!userFull.passwordHash;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          К профилю
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Настройки
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Управляйте основной информацией и безопасностью аккаунта
        </p>
      </div>

      <Section
        icon={<User2 className="size-4" />}
        title="Основная информация"
        description="Как вас видят другие пользователи сервиса"
      >
        <BasicInfoForm
          defaultValues={{
            firstName: userFull.firstName,
            lastName: userFull.lastName ?? "",
            displayName: userFull.displayName ?? "",
            phone: userFull.phone ?? "",
            cityId: userFull.cityId ?? "",
          }}
          cities={cities}
        />
      </Section>

      <Section
        icon={<Briefcase className="size-4" />}
        title="Профиль исполнителя"
        description="Специализации, опыт и портфолио для откликов на заказы"
      >
        <Link
          href="/become-provider"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold transition-colors hover:border-primary/60 hover:text-primary"
        >
          Открыть редактор исполнителя
        </Link>
      </Section>

      <Section
        icon={<KeyRound className="size-4" />}
        title="Смена пароля"
        description={
          canChangePassword
            ? "Используйте надёжный пароль не короче 8 символов"
            : "У аккаунта не установлен пароль (вход через внешний провайдер)"
        }
      >
        {canChangePassword ? (
          <ChangePasswordForm />
        ) : (
          <p className="text-sm text-muted-foreground">
            Смена пароля недоступна для аккаунтов, созданных через Telegram
            или Google.
          </p>
        )}
      </Section>
    </div>
  );
}

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-surface p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
