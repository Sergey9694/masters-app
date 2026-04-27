"use client";

import { cn } from "@/shared/lib/cn";
import { motion } from "framer-motion";
import type { MessageDTO } from "@uslugi/shared-types";

import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";

interface Props {
  message: MessageDTO;
  isOwn: boolean;
}

function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("ru-RU", { 
    hour: "2-digit", 
    minute: "2-digit" 
  });
}

export function MessageBubble({ message, isOwn }: Props) {
  const isDeleted = !!message.deletedAt;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "flex gap-3 max-w-[85%] sm:max-w-[75%]", 
        isOwn ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {!isOwn && (
        <Avatar size="default" className="mt-1 ring-2 ring-background">
          {message.sender.avatar && (
            <AvatarImage src={message.sender.avatar} alt={message.sender.firstName} />
          )}
          <AvatarFallback>{message.sender.firstName[0]}</AvatarFallback>
        </Avatar>
      )}
      
      <div className="flex flex-col gap-1 min-w-0">
        <div
          className={cn(
            "relative px-4 py-2.5 text-sm shadow-sm transition-all",
            isOwn
              ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
              : "bg-surface-elevated/80 backdrop-blur-sm border border-border/40 text-foreground rounded-2xl rounded-tl-sm",
            isDeleted && "opacity-60 grayscale-[0.5]"
          )}
        >
          {!isOwn && !isDeleted && (
            <span className="block text-[10px] font-bold uppercase tracking-wider text-primary/80 mb-1">
              {message.sender.firstName}
            </span>
          )}
          
          <p className={cn(
            "whitespace-pre-wrap break-words leading-relaxed",
            isDeleted && "italic text-muted-foreground"
          )}>
            {message.text}
          </p>

          <div className={cn(
            "flex items-center gap-1 mt-1 justify-end",
            isOwn ? "text-primary-foreground/60" : "text-muted-foreground/60"
          )}>
            <span className="text-[10px] font-medium">
              {formatTime(message.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
