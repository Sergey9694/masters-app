export interface MessageDTO {
  id: string;
  text: string;
  attachments: string[];
  senderId: string;
  sender: { 
    id: string; 
    firstName: string; 
    lastName?: string | null;
    avatar: string | null 
  };
  createdAt: string; // ISO string
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface BlockStateDTO {
  blockedByMe: boolean;
  blockedMe: boolean;
  isBlocked: boolean;
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
    lastName?: string | null;
    avatar: string | null;
    lastSeenAt?: string | null;
    isOnline?: boolean;
  };
  blockState: BlockStateDTO;
  updatedAt: string; // ISO string
}
