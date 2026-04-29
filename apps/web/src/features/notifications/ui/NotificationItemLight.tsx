"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  CheckCheck,
  Briefcase,
  XCircle,
  Star,
  PlusCircle,
} from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { formatSmartDate } from "@/shared/lib/date";
import { markReadAction } from "../api/actions";

interface NotificationItemLightProps {
  notification: {
    id: string;
    type: string;
    title: string;
    body: string;
    referenceId: string | null;
    read: boolean;
    createdAt: Date;
  };
}

const TYPE_CONFIG: Record<
  string,
  { icon: React.ReactNode; cls: string }
> = {
  NEW_PROPOSAL: {
    icon: <MessageSquare className="size-4" />,
    cls: "bg-primary/10 text-primary",
  },
  PROPOSAL_ACCEPTED: {
    icon: <CheckCheck className="size-4" />,
    cls: "bg-success/15 text-success",
  },
  ORDER_COMPLETED: {
    icon: <Briefcase className="size-4" />,
    cls: "bg-success/15 text-success",
  },
  ORDER_CANCELED: {
    icon: <XCircle className="size-4" />,
    cls: "bg-destructive/15 text-destructive",
  },
  NEW_REVIEW: {
    icon: <Star className="size-4" />,
    cls: "bg-warning/15 text-warning",
  },
  NEW_ORDER: {
    icon: <PlusCircle className="size-4" />,
    cls: "bg-primary/10 text-primary",
  },
};

export function NotificationItemLight({
  notification: n,
}: NotificationItemLightProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    if (!n.read) {
      startTransition(async () => {
        await markReadAction(n.id);
      });
    }
    if (n.referenceId) {
      router.push(`/orders/v/${n.referenceId}`);
    }
  };

  const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.NEW_ORDER;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border bg-surface p-4 text-left transition-all",
        "hover:border-primary/40 hover:shadow-md",
        n.read ? "border-border/60" : "border-primary/30 bg-primary/[0.03]",
        isPending && "opacity-70"
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          cfg.cls
        )}
      >
        {cfg.icon}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm leading-tight",
              n.read ? "font-medium text-foreground/80" : "font-semibold"
            )}
          >
            {n.title}
          </p>
          {!n.read && (
            <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        <p className="mt-1 text-sm leading-snug text-muted-foreground">
          {n.body}
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground/80">
          {formatSmartDate(n.createdAt)}
        </p>
      </div>
    </button>
  );
}
