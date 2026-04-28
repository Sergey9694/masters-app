export interface MessageDTO {
  id: string;
  text: string;
  attachments: string[];
  senderId: string;
  sender: { 
    id: string; 
    firstName: string; 
    avatar: string | null 
  };
  createdAt: string; // ISO string
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface ConversationPreview {
  id: string;
  orderId: string | null;
  listingId: string | null;
  lastMessage: MessageDTO | null;
  unreadCount: number;
  otherUser: { 
    id: string; 
    firstName: string; 
    avatar: string | null;
    lastSeenAt?: string | null;
    isOnline?: boolean;
  };
  updatedAt: string; // ISO string
}
