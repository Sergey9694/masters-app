import Link from "next/link";
import { redirect } from "next/navigation";
import {
  MapPin,
  Mail,
  Phone,
  Settings as SettingsIcon,
  ShieldCheck,
  Star,
  Briefcase,
} from "lucide-react";

import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { cn } from "@/shared/lib/cn";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Мой профиль — УслугиРядом",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const [city, userFull] = await Promise.all([
    user.cityId
      ? db.city.findUnique({
          where: { id: user.cityId },
          select: { name: true },
        })
      : Promise.resolve(null),
    db.user.findUnique({
      where: { id: user.id },
      select: { displayName: true, email: true },
    }),
  ]);

  const provider = user.providerProfile;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const displayName = userFull?.displayName || fullName;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar src={user.avatar} name={displayName} />
          <div>
            <h1 className="text-2xl font-semibold leading-tight">
              {displayName}
            </h1>
            {fullName !== displayName && (
              <p className="mt-0.5 text-sm text-muted-foreground">{fullName}</p>
            )}
            {provider?.isVerified && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                <ShieldCheck className="size-3" />
                Проверенный исполнитель
              </span>
            )}
          </div>
        </div>

        <Link
          href="/settings"
          className={cn(
            "inline-flex h-10 items-center gap-2 self-start rounded-xl border border-border bg-background px-4 text-sm font-semibold",
            "transition-colors hover:border-primary/60 hover:text-primary"
          )}
        >
          <SettingsIcon className="size-4" />
          Редактировать
        </Link>
      </div>

      <section className="rounded-2xl border border-border/60 bg-surface p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Контакты
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <InfoRow
            icon={<Mail className="size-4" />}
            label="Email"
            value={userFull?.email || "не указан"}
          />
          <InfoRow
            icon={<Phone className="size-4" />}
            label="Телефон"
            value={user.phone || "не указан"}
          />
          <InfoRow
            icon={<MapPin className="size-4" />}
            label="Город"
            value={city?.name || "не указан"}
          />
        </dl>
      </section>

      {provider && (
        <section className="rounded-2xl border border-border/60 bg-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Профиль исполнителя
            </h2>
            <Link
              href="/settings"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Управление
            </Link>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Stat
              icon={<Star className="size-4 text-amber-500" />}
              label="Рейтинг"
              value={provider.rating ? provider.rating.toFixed(1) : "—"}
            />
            <Stat
              icon={<Briefcase className="size-4 text-primary" />}
              label="Опыт"
              value={
                provider.experienceYears
                  ? `${provider.experienceYears} ${pluralYears(provider.experienceYears)}`
                  : "—"
              }
            />
            <Stat
              icon={<Briefcase className="size-4 text-primary" />}
              label="Категорий"
              value={String(provider.categories.length)}
            />
          </div>

          {provider.bio && (
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
              {provider.bio}
            </p>
          )}
        </section>
      )}

      {!provider && (
        <section className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6">
          <h2 className="text-base font-semibold">Станьте исполнителем</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Добавьте специализацию, чтобы откликаться на заказы и зарабатывать
          </p>
          <Link
            href="/settings"
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
          >
            Начать
          </Link>
        </section>
      )}
    </div>
  );
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  const initial = name.charAt(0).toUpperCase() || "?";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        className="size-16 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
      {initial}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/60 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function pluralYears(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "год";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "года";
  return "лет";
}
