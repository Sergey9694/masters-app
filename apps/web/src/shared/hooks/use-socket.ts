"use client";

import { useEffect, useState, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@/shared/lib/socket-events";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let _socket: AppSocket | null = null;

function getSocket(): AppSocket {
  if (!_socket) {
    _socket = io({
      path: "/socket.io",
      autoConnect: true,
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
  }
  return _socket;
}

export function useSocket(userId?: string) {
  const [connected, setConnected] = useState(false);
  const socket = getSocket();
  const prevUserIdRef = useRef<string | undefined>(userId);

  useEffect(() => {
    if (userId && prevUserIdRef.current !== userId) {
      console.log(`[Socket] User ID changed from ${prevUserIdRef.current} to ${userId}. Reconnecting...`);
      socket.disconnect();
      socket.connect();
      prevUserIdRef.current = userId;
    }
  }, [socket, userId]);

  useEffect(() => {
    const onConnect = () => {
      console.log("[Socket] Connected to server. ID:", socket.id);
      setConnected(true);
    };
    const onDisconnect = (reason: string) => {
      console.warn("[Socket] Disconnected from server. Reason:", reason);
      setConnected(false);
    };
    const onConnectError = (error: Error) => {
      console.error("[Socket] Connection error:", error.message);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    if (socket.connected) {
      setConnected(true);
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
    };
  }, [socket]);

  return { socket, connected };
}
