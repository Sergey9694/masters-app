import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";
import { formatSmartDate } from "@/shared/lib/date";
import { cn } from "@/shared/lib/cn";

interface Props {
  otherUser: { id: string; firstName: string; avatar: string | null };
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
}

export function ConversationHeader({ otherUser, context, showBack, status, lastSeenAt }: Props) {
  const contextLink = (context.orderId && context.orderSlug && context.citySlug && context.categorySlug)
    ? { href: `/orders/${context.citySlug}/${context.categorySlug}/${context.orderSlug}`, label: "Перейти к заказу" }
    : (context.listingId && context.listingSlug)
    ? { href: `/listings/${context.listingSlug}`, label: "Перейти к объявлению" }
    : null;

  const isOnline = status === "online";

  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-surface">
      {showBack && (
        <Link href="/chat" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
      )}
      <div className="relative">
        <Avatar size="default">
          {otherUser.avatar && <AvatarImage src={otherUser.avatar} alt={`${otherUser.firstName} ${otherUser.lastName || ""}`} />}
          <AvatarFallback>{otherUser.firstName[0]}</AvatarFallback>
        </Avatar>
        {isOnline && (
          <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-surface" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate leading-tight">
            {otherUser.firstName} {otherUser.lastName || ""}
          </p>
          <p className={cn(
            "text-[10px] leading-tight shrink-0",
            isOnline ? "text-green-500 font-medium" : "text-muted-foreground"
          )}>
            {isOnline ? "в сети" : lastSeenAt ? `был(а) в сети ${formatSmartDate(lastSeenAt)}` : "был(а) в сети недавно"}
          </p>
        </div>
        {contextLink && (
          <Link href={contextLink.href} className="text-xs text-primary hover:underline truncate block">
            {contextLink.label}
          </Link>
        )}
      </div>
    </div>
  );
}
