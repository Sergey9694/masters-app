"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@/shared/lib/socket-events";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let _socket: AppSocket | null = null;

function getSocket(): AppSocket {
  if (!_socket) {
    _socket = io({ path: "/socket.io", autoConnect: true, withCredentials: true });
  }
  return _socket;
}

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socket = getSocket();

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket]);

  return { socket, connected };
}
