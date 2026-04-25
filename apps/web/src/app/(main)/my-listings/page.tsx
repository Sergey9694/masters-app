import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Inbox } from "lucide-react";

import { getCurrentUser } from "@/shared/lib/get-user";
import { listingService } from "@/services/listing.service";
import { ListingCard } from "@/entities/listing";
import { cn } from "@/shared/lib/cn";
import { DEFAULT_PAGE_SIZE } from "@/shared/lib/constants";
import { ListingActions } from "./ListingActions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Мои объявления — УслугиРядом",
};

type Tab = "active" | "paused" | "archived";

const TABS: { key: Tab; label: string; statuses: string[] }[] = [
  { key: "active", label: "Активные", statuses: ["ACTIVE", "MODERATION"] },
  { key: "paused", label: "Приостановлены", statuses: ["PAUSED"] },
  { key: "archived", label: "Архив", statuses: ["ARCHIVED", "REJECTED"] },
];

interface MyListingsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function MyListingsPage({ searchParams }: MyListingsPageProps) {
  const { tab: tabParam } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (!user.providerProfile) redirect("/become-provider");

  const activeTab: Tab =
    tabParam === "paused" || tabParam === "archived" ? tabParam : "active";

  const statuses = TABS.find((t) => t.key === activeTab)!.statuses;

  const { listings } = await listingService.getByUser(user.id, DEFAULT_PAGE_SIZE * 2);
  const filtered = listings.filter((l) => statuses.includes(l.status));

  return (
    <div className="flex flex-col gap-6">
      <div className="page-section flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Мои объявления</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Управляйте своими услугами и привлекайте клиентов
          </p>
        </div>
        <Link
          href="/my-listings/new"
          className="inline-flex h-10 items-center gap-2 self-start rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110"
        >
          <Plus className="size-4" />
          Новое объявление
        </Link>
      </div>

      <div className="page-section flex items-center gap-1 rounded-xl border border-border/60 bg-surface p-1">
        {TABS.map((t) => {
          const active = t.key === activeTab;
          const count = listings.filter((l) => t.statuses.includes(l.status)).length;
          return (
            <Link
              key={t.key}
              href={t.key === "active" ? "/my-listings" : `/my-listings?tab=${t.key}`}
              className={cn(
                "flex-1 rounded-lg px-4 py-2 text-center text-sm font-semibold transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
              {count > 0 && (
                <span
                  className={cn(
                    "ml-2 rounded-full px-2 py-0.5 text-xs",
                    active ? "bg-primary-foreground/20" : "bg-muted text-foreground"
                  )}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <div className="page-section flex flex-col gap-4">
          {filtered.map((listing, i) => (
            <div key={listing.id} className="list-card" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex flex-col gap-2">
                <ListingCard
                  listing={listing as Parameters<typeof ListingCard>[0]["listing"]}
                  showStatus
                />
                <ListingActions
                  id={listing.id}
                  status={listing.status as "ACTIVE" | "PAUSED"}
                  slug={listing.slug ?? listing.id}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const messages: Record<Tab, { title: string; hint: string }> = {
    active: { title: "Нет активных объявлений", hint: "Создайте объявление, чтобы привлечь клиентов" },
    paused: { title: "Нет приостановленных", hint: "Здесь будут объявления, которые вы приостановили" },
    archived: { title: "Архив пуст", hint: "Удалённые и отклонённые объявления" },
  };
  const m = messages[tab];

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-surface px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="size-6" />
      </span>
      <div>
        <p className="text-base font-semibold">{m.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{m.hint}</p>
      </div>
      {tab === "active" && (
        <Link
          href="/my-listings/new"
          className="mt-2 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
        >
          <Plus className="size-4" />
          Создать объявление
        </Link>
      )}
    </div>
  );
}
