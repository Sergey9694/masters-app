export const dynamic = "force-dynamic";

import { db } from "@/shared/lib/db";
import Link from "next/link";
import { decryptText } from "@/shared/lib/crypto";
import { MessageSquare } from "lucide-react";

export const metadata = { title: "Чаты — Админ" };

export default async function AdminChatsPage() {
  const conversations = await db.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, firstName: true, chatBlockedAt: true },
          },
        },
      },
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Все диалоги</h1>
        <p className="text-slate-500 mt-1">Всего: {conversations.length}</p>
      </div>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-600">
          <MessageSquare className="w-12 h-12 mb-3" />
          <p className="text-sm">Диалогов пока нет</p>
        </div>
      ) : (
        <div className="bg-[#16162a] rounded-2xl border border-white/5 overflow-hidden">
          {conversations.map((conv, idx) => {
            const lastMsg = conv.messages[0];
            let preview = "Нет сообщений";
            if (lastMsg?.text) {
              try {
                preview = decryptText(lastMsg.text).slice(0, 60);
              } catch {
                preview = "[зашифровано]";
              }
            }

            const blockedParticipants = conv.participants.filter(
              (p) => p.user.chatBlockedAt,
            );

            return (
              <Link
                key={conv.id}
                href={`/admin/chats/${conv.id}`}
                className={`flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors ${
                  idx < conversations.length - 1 ? "border-b border-white/5" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-white">
                      {conv.participants
                        .map((p) => p.user.firstName)
                        .join(" ↔ ")}
                    </p>
                    {blockedParticipants.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400">
                        Заблокирован
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {preview}
                  </p>
                </div>
                <span className="text-xs text-slate-600 shrink-0 ml-4">
                  {new Date(conv.updatedAt).toLocaleDateString("ru-RU")}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
