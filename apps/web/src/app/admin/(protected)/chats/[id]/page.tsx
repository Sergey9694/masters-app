export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { db } from "@/shared/lib/db";
import { decryptText } from "@/shared/lib/crypto";
import { AdminChatActions } from "@/features/chat/ui/AdminChatActions";
import { AdminDeleteMessageButton } from "@/features/chat/ui/AdminDeleteMessageButton";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AdminChatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const conversation = await db.conversation.findUnique({
    where: { id },
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
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { id: true, firstName: true } },
        },
      },
    },
  });

  if (!conversation) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back link */}
      <Link
        href="/admin/chats"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Все диалоги
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">
          {conversation.participants.map((p) => p.user.firstName).join(" ↔ ")}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {conversation.messages.length} сообщений ·{" "}
          {new Date(conversation.createdAt).toLocaleDateString("ru-RU")}
        </p>
      </div>

      {/* Participant actions */}
      <div className="flex flex-wrap gap-3">
        {conversation.participants.map((p) => (
          <AdminChatActions
            key={p.userId}
            userId={p.userId}
            userName={p.user.firstName}
            isBlocked={!!p.user.chatBlockedAt}
            conversationId={id}
          />
        ))}
      </div>

      {/* Messages */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Сообщения
        </h2>

        {conversation.messages.length === 0 ? (
          <p className="text-sm text-slate-600 py-6 text-center">
            Сообщений нет
          </p>
        ) : (
          <div className="bg-[#16162a] rounded-2xl border border-white/5 overflow-hidden">
            {conversation.messages.map((msg, idx) => {
              let text: string;
              try {
                text = decryptText(msg.text);
              } catch {
                text = "[зашифровано]";
              }

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 px-4 py-3 ${
                    idx < conversation.messages.length - 1
                      ? "border-b border-white/5"
                      : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-sm text-white">
                        {msg.sender.firstName}
                      </span>
                      <span className="text-xs text-slate-600">
                        {new Date(msg.createdAt).toLocaleString("ru-RU")}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 break-words">{text}</p>
                  </div>
                  <AdminDeleteMessageButton messageId={msg.id} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
