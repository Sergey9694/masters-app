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
    <div className="flex w-full border-r border-border">
      <aside className="w-80 shrink-0 border-r border-border overflow-y-auto flex flex-col">
        <div className="px-4 py-3 border-b border-border">
          <h1 className="font-semibold text-base">Сообщения</h1>
        </div>
        <ConversationList conversations={conversations} currentUserId={user.id} />
      </aside>

      <div className="flex-1 hidden md:flex">
        <ChatEmpty
          title="Выберите диалог"
          description="Нажмите на собеседника слева чтобы открыть переписку"
        />
      </div>
    </div>
  );
}
