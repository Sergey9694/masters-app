import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/shared/lib/get-user";
import { chatService } from "@/services/chat.service";
import { db } from "@/shared/lib/db";
import { ConversationList } from "@/features/chat/ui/ConversationList";
import { ChatWindow } from "@/features/chat/ui/ChatWindow";

export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const [conversations, messages, conversation] = await Promise.all([
    chatService.getConversations(user.id),
    chatService.getMessages(id, user.id).catch(() => null),
    db.conversation.findUnique({
      where: { id },
      include: {
        participants: {
          include: { user: { select: { id: true, firstName: true, avatar: true } } },
        },
      },
    }),
  ]);

  if (!conversation || !messages) notFound();

  const otherParticipant = conversation.participants.find(
    (p: typeof conversation.participants[number]) => p.userId !== user.id
  );
  if (!otherParticipant) notFound();

  return (
    <div className="flex w-full">
      <aside className="hidden md:flex w-80 shrink-0 border-r border-border flex-col overflow-y-auto">
        <div className="px-4 py-3 border-b border-border">
          <h1 className="font-semibold text-base">Сообщения</h1>
        </div>
        <ConversationList
          conversations={conversations}
          activeId={id}
          currentUserId={user.id}
        />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <ChatWindow
          conversationId={id}
          currentUserId={user.id}
          otherUser={otherParticipant.user}
          context={{
            orderId: conversation.orderId,
            listingId: conversation.listingId,
          }}
          initialMessages={messages}
          showBack={true}
        />
      </div>
    </div>
  );
}
