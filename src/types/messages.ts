// src/types/messages.ts
// Tipos compartilhados entre page.tsx, ChatConversationList e ChatMessageWindow

export interface OtherUser {
    id: string;
    username: string;
    first_name: string | null;
    avatar_url: string | null;
    role?: string | null;
}

export interface Conversation {
    id: string;
    user1_id: string;
    user2_id: string;
    last_message: string | null;
    last_message_at: string | null;
    updated_at: string;
    other_user: OtherUser;
    unread_count: number;
    is_draft?: boolean;
}

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
}
