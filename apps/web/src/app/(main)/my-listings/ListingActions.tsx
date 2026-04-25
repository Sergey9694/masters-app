"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Pause, Play, Trash2, Pencil } from "lucide-react";
import { toggleListingStatusAction, deleteListingAction } from "@/features/listing-management";

interface ListingActionsProps {
  id: string;
  status: "ACTIVE" | "PAUSED" | string;
  slug: string;
}

export function ListingActions({ id, status, slug }: ListingActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    if (status !== "ACTIVE" && status !== "PAUSED") return;
    startTransition(async () => {
      await toggleListingStatusAction({ id, currentStatus: status as "ACTIVE" | "PAUSED" });
    });
  };

  const handleDelete = () => {
    if (!confirm("Удалить объявление? Оно переместится в архив.")) return;
    startTransition(async () => {
      await deleteListingAction({ id });
    });
  };

  return (
    <div className="flex items-center gap-2 px-1">
      <Link
        href={`/my-listings/${slug}/edit`}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/60 bg-surface px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <Pencil className="size-3.5" />
        Редактировать
      </Link>

      {(status === "ACTIVE" || status === "PAUSED") && (
        <button
          onClick={handleToggle}
          disabled={isPending}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/60 bg-surface px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
        >
          {status === "ACTIVE" ? (
            <><Pause className="size-3.5" /> Приостановить</>
          ) : (
            <><Play className="size-3.5" /> Возобновить</>
          )}
        </button>
      )}

      <button
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/60 bg-surface px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive disabled:opacity-50"
      >
        <Trash2 className="size-3.5" />
        Удалить
      </button>
    </div>
  );
}
