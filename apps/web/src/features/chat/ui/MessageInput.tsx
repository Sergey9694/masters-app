"use client";

import { useState, useRef } from "react";
import { Send } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useTyping } from "@/shared/hooks/use-typing";

interface Props {
  conversationId: string;
  userId?: string;
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
}

export function MessageInput({ conversationId, userId, onSend, disabled }: Props) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const { handleInput } = useTyping(conversationId, userId);
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
    <div className="flex items-end gap-3">
      <div className="relative flex-1">
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
          placeholder="Сообщение..."
          disabled={disabled || sending}
          rows={1}
          className={cn(
            "flex-1 w-full resize-none rounded-2xl border border-border/40 bg-background/50 px-4 py-3 text-sm transition-all",
            "focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10",
            "placeholder:text-muted-foreground/60 scrollbar-none",
            "disabled:opacity-60 disabled:cursor-not-allowed max-h-[120px]"
          )}
        />
      </div>
      
      <button
        onClick={handleSend}
        disabled={!text.trim() || sending || disabled}
        className={cn(
          "shrink-0 rounded-2xl bg-primary p-3 text-primary-foreground transition-all duration-200 active:scale-95 shadow-md",
          "hover:shadow-primary/20 hover:brightness-110 disabled:opacity-40 disabled:scale-100 disabled:shadow-none"
        )}
      >
        <Send className={cn("size-5 transition-transform", !text.trim() ? "translate-x-0" : "translate-x-0.5 -translate-y-0.5")} />
      </button>
    </div>
  );
}
