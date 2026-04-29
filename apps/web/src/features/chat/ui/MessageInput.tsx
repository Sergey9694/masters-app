"use client";

import { useState, useRef } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/cn";
import { useTyping } from "@/shared/hooks/use-typing";

interface Props {
  conversationId: string;
  userId?: string;
  onSend: (text: string) => Promise<void>;
  onFocus?: () => void;
  disabled?: boolean;
}

export function MessageInput({ conversationId, userId, onSend, onFocus, disabled }: Props) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const { handleInput } = useTyping(conversationId, userId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    
    // Захватываем текст и сразу очищаем поле для мгновенного отклика
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }

    setSending(true);
    try {
      await onSend(trimmed);
    } catch (error) {
      // Если ошибка — возвращаем текст (опционально, но лучше для UX)
      setText(trimmed);
      toast.error("Ошибка при отправке");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex items-end gap-2.5">
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={text}
          onFocus={onFocus}
          onClick={onFocus}
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
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 w-full resize-none rounded-2xl border border-border/40 bg-background/50 px-4 py-[11px] text-sm transition-all",
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
          "shrink-0 flex items-center justify-center size-[44px] rounded-2xl bg-primary text-primary-foreground transition-all duration-200 active:scale-95 shadow-md",
          "hover:shadow-primary/20 hover:brightness-110 disabled:opacity-40 disabled:scale-100 disabled:shadow-none"
        )}
      >
        <Send className="size-5 translate-x-[1px] -translate-y-[0.5px]" />
      </button>
    </div>
  );
}
