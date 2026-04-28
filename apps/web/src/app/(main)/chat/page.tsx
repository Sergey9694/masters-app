import { redirect } from "next/navigation";
import { getCurrentUser } from "@/shared/lib/get-user";
import { chatService } from "@/services/chat.service";
import { ConversationList } from "@/features/chat/ui/ConversationList";
import { ChatEmpty } from "@/features/chat/ui/ChatEmpty";

export const dynamic = "force-dynamic";
export const metadata = { 
  title: "Сообщения — УслугиРядом",
  robots: "noindex, nofollow"
};

export default async function ChatPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const conversations = await chatService.getConversations(user.id);

  return (
    <div className="flex w-full h-[calc(100vh-220px)] lg:h-[calc(100vh-180px)] overflow-hidden bg-background/30 rounded-2xl border border-border/50 shadow-xl">
      <aside className="w-full md:w-80 shrink-0 border-r border-border/60 flex flex-col bg-surface/30 backdrop-blur-md">
        <div className="px-5 py-4 border-b border-border/60 bg-background/40">
          <h1 className="font-bold text-lg tracking-tight">Сообщения</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList conversations={conversations} currentUserId={user.id} />
        </div>
      </aside>

      <div className="flex-1 hidden md:flex items-center justify-center bg-background/20">
        <ChatEmpty
          title="Выберите диалог"
          description="Нажмите на собеседника слева чтобы открыть переписку"
        />
      </div>
    </div>
  );
}
