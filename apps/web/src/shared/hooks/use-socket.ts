"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@/shared/lib/socket-events";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let _socket: AppSocket | null = null;
let _socketUserId: string | null = null;

function getSocket(): AppSocket {
  if (!_socket) {
    _socket = io({
      path: "/socket.io",
      addTrailingSlash: false,
      autoConnect: false,
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
  }
  return _socket;
}

export function useSocket(userId?: string) {
  const [connected, setConnected] = useState(false);
  const socket = getSocket();

  useEffect(() => {
    if (!userId) {
      if (_socketUserId !== null) {
        _socketUserId = null;
        socket.disconnect();
      }
      setConnected(false);
      return;
    }

    const userChanged = _socketUserId !== null && _socketUserId !== userId;
    if (userChanged) {
      console.log(`[Socket] User ID changed from ${_socketUserId} to ${userId}. Reconnecting...`);
      socket.disconnect();
    }

    _socketUserId = userId;

    if (!socket.connected) {
      socket.connect();
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
