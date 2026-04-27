import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";

interface Props {
  otherUser: { id: string; firstName: string; avatar: string | null };
  context: { 
    orderId: string | null; 
    orderSlug?: string | null;
    citySlug?: string | null;
    listingId: string | null; 
    listingSlug?: string | null;
  };
  showBack?: boolean;
}

export function ConversationHeader({ otherUser, context, showBack }: Props) {
  const contextLink = (context.orderId && context.orderSlug && context.citySlug)
    ? { href: `/orders/${context.citySlug}/${context.orderSlug}`, label: "Перейти к заказу" }
    : (context.listingId && context.listingSlug)
    ? { href: `/listings/${context.listingSlug}`, label: "Перейти к объявлению" }
    : null;

  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-surface">
      {showBack && (
        <Link href="/chat" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
      )}
      <Avatar size="default">
        {otherUser.avatar && <AvatarImage src={otherUser.avatar} alt={otherUser.firstName} />}
        <AvatarFallback>{otherUser.firstName[0]}</AvatarFallback>
      </Avatar>
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
