export interface MessageDTO {
  id: string;
  text: string;
  attachments: string[];
  senderId: string;
  sender: { id: string; firstName: string; avatar: string | null };
  createdAt: string; // ISO
}

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
  "user:blocked": () => void;
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
