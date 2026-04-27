import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  otherUser: { id: string; firstName: string; avatar: string | null };
  context: { orderId: string | null; listingId: string | null };
  showBack?: boolean;
}

export function ConversationHeader({ otherUser, context, showBack }: Props) {
  const contextLink = context.orderId
    ? { href: `/orders/${context.orderId}`, label: "Перейти к заказу" }
    : context.listingId
    ? { href: `/listings/${context.listingId}`, label: "Перейти к объявлению" }
    : null;

  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-surface">
      {showBack && (
        <Link href="/chat" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
      )}
      <img
        src={otherUser.avatar ?? "/default-avatar.png"}
        alt={otherUser.firstName}
        className="size-9 rounded-full"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{otherUser.firstName}</p>
        {contextLink && (
          <Link href={contextLink.href} className="text-xs text-primary hover:underline truncate block">
            {contextLink.label}
          </Link>
        )}
      </div>
    </div>
  );
}
