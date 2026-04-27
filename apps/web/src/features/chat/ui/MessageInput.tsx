"use client";

import { useState, useRef } from "react";
import { Send } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useTyping } from "@/shared/hooks/use-typing";

interface Props {
  conversationId: string;
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
}

export function MessageInput({ conversationId, onSend, disabled }: Props) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const { handleInput } = useTyping(conversationId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-border bg-card px-4 py-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleInput();
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Написать сообщение..."
          disabled={disabled || sending}
          rows={1}
          className={cn(
            "flex-1 resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm",
            "focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10",
            "disabled:opacity-60 disabled:cursor-not-allowed max-h-[120px]"
          )}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending || disabled}
          className="shrink-0 rounded-xl bg-primary p-2.5 text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
        >
          <Send className="size-4" />
        </button>
      </div>
    </div>
  );
}
