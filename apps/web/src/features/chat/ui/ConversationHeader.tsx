"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";
import { formatSmartDate } from "@/shared/lib/date";
import { cn } from "@/shared/lib/cn";
import { BlockUserButton } from "@/features/trust/ui/BlockUserButton";
import { ReportModal } from "@/features/trust/ui/ReportModal";
import type { BlockStateDTO } from "@uslugi/shared-types";

interface Props {
  otherUser: { 
    id: string; 
    firstName: string; 
    lastName: string | null; 
    avatar: string | null;
    lastSeenAt?: string | null;
  };
  context: { 
    orderId: string | null; 
    orderSlug?: string | null;
    categorySlug?: string | null;
    citySlug?: string | null;
    listingId: string | null; 
    listingSlug?: string | null;
  };
  showBack?: boolean;
  status?: "online" | "offline";
  lastSeenAt?: string | null;
  conversationId: string;
  blockState: BlockStateDTO;
  onBlockStateChange?: (state: BlockStateDTO) => void;
}

export function ConversationHeader({
  otherUser,
  context,
  showBack,
  status,
  lastSeenAt,
  conversationId,
  blockState,
  onBlockStateChange,
}: Props) {
  const contextLink = (context.orderId && context.orderSlug && context.citySlug && context.categorySlug)
    ? { href: `/orders/${context.citySlug}/${context.categorySlug}/${context.orderSlug}`, label: "Перейти к заказу" }
    : (context.listingId && context.listingSlug)
    ? { href: `/listings/${context.listingSlug}`, label: "Перейти к объявлению" }
    : null;

  const isOnline = status === "online";

  return (
    <div className="flex items-center gap-3 border-b border-border px-3 py-3 bg-surface sm:px-4">
      {showBack && (
        <Link href="/chat" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
      )}
      <div className="relative">
        <Avatar size="default">
          {otherUser.avatar && <AvatarImage src={otherUser.avatar} alt={`${otherUser.firstName} ${otherUser.lastName || ""}`} />}
          <AvatarFallback delay={600}>{otherUser.firstName[0]}</AvatarFallback>
        </Avatar>
        {isOnline && (
          <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-surface" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="min-w-0 sm:flex sm:items-center sm:gap-2">
          <p className="truncate text-sm font-medium leading-tight sm:min-w-0">
            {otherUser.firstName} {otherUser.lastName || ""}
          </p>
          <p className={cn(
            "mt-0.5 truncate text-[11px] leading-tight sm:mt-0 sm:shrink-0 sm:text-[10px]",
            isOnline ? "font-medium text-green-500" : "text-muted-foreground"
          )}>
            {isOnline ? "в сети" : lastSeenAt ? `был(а) в сети ${formatSmartDate(lastSeenAt)}` : "был(а) в сети недавно"}
          </p>
        </div>
        {contextLink && (
          <Link href={contextLink.href} className="mt-0.5 block truncate text-xs text-primary hover:underline">
            {contextLink.label}
          </Link>
        )}
      </div>
      <div className="-mr-1 ml-auto flex shrink-0 items-center gap-0 self-start sm:self-center">
        <ReportModal
          targetType="USER"
          targetId={otherUser.id}
          targetUserId={otherUser.id}
          conversationId={conversationId}
          orderId={context.orderId}
          triggerClassName="size-9 text-muted-foreground hover:text-foreground"
        />
        <BlockUserButton
          blockedId={otherUser.id}
          conversationId={conversationId}
          blockState={blockState}
          onChanged={onBlockStateChange}
          className="size-9"
        />
      </div>
    </div>
  );
}
