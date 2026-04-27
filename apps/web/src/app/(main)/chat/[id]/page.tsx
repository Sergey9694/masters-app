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
    <div className="flex w-full h-[calc(100vh-120px)] lg:h-[calc(100vh-40px)] overflow-hidden bg-background/30 rounded-2xl border border-border/50 shadow-xl">
      <aside className="hidden md:flex w-80 shrink-0 border-r border-border/60 flex-col bg-surface/30 backdrop-blur-md">
        <div className="px-5 py-4 border-b border-border/60 bg-background/40">
          <h1 className="font-bold text-lg tracking-tight">Сообщения</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList
            conversations={conversations}
            activeId={id}
            currentUserId={user.id}
          />
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-background/20">
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
      </main>
    </div>
  );
}
