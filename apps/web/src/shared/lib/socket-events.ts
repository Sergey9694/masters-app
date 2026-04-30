import type { MessageDTO } from "@uslugi/shared-types";
export type { MessageDTO };

export interface NotificationDTO {
  id: string;
  type: string;
  title: string;
  body: string;
  createdAt: string;
}

// Server → Client
export interface ServerToClientEvents {
  "new:message": (data: { conversationId: string; message: MessageDTO }) => void;
  "new:notification": (data: { notification: NotificationDTO }) => void;
  "new:proposal": (data: { orderId: string }) => void;
  "new:order": (data: { orderId: string }) => void;
  "typing:start": (data: { conversationId: string; userId: string; userName: string }) => void;
  "typing:stop": (data: { conversationId: string; userId: string }) => void;
  "message:deleted": (data: { conversationId: string; messageId: string }) => void;
  "user:blocked": (data: { blockerId: string; blockedId: string; conversationId?: string }) => void;
  "conversation:update": (data: { conversationId: string }) => void;
  "user:status": (data: { userId: string; status: "online" | "offline"; lastSeenAt: string }) => void;
}

// Client → Server
export interface ClientToServerEvents {
  "join:conversation": (conversationId: string) => void;
  "leave:conversation": (conversationId: string) => void;
  "typing:start": (conversationId: string) => void;
  "typing:stop": (conversationId: string) => void;
}

export interface SocketData {
  userId: string;
  userName: string;
}
