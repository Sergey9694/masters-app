"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSocket } from "./use-socket";

export function useTyping(conversationId: string) {
  const { socket } = useSocket();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const stopTyping = useCallback(() => {
    if (isTypingRef.current) {
      socket.emit("typing:stop", conversationId);
      isTypingRef.current = false;
    }
  }, [socket, conversationId]);

  const handleInput = useCallback(() => {
    if (!isTypingRef.current) {
      socket.emit("typing:start", conversationId);
      isTypingRef.current = true;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(stopTyping, 2000);
  }, [socket, conversationId, stopTyping]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    stopTyping();
  }, [stopTyping]);

  return { handleInput };
}
