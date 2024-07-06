/**
 * Admin Audit Log interface.
 * Represents a single security or activity event in the platform.
 */
export interface AuditLog {
    id: string;
    user_id: string;
    admin_id: string | null;
    action: string;
    entity_type: string | null;
    entity_id: string | null;
    metadata: any;
    ip_address: string;
    user_agent: string;
    created_at: string;
    profiles: {
        username: string | null;
        avatar_url: string | null;
        id: string;
    };
    admin_profile?: {
        username: string | null;
        avatar_url: string | null;
    };
}

/**
 * Admin User interface.
 */
export interface AdminUser {
    id: string;
    username: string | null;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: string | null;
    created_at: string;
    avatar_url: string | null;
    xp: number;
    level: number;
}

/**
 * Inactive User interface.
 */
export interface InactiveUser {
    id: string;
    username: string;
    email: string;
    last_interaction_at: string;
    created_at: string;
    remind_email_count: number;
    remind_email_sent_at: string;
}

/**
 * Engagement Log interface.
 */
export interface EngagementLog {
    id: string;
    created_at: string;
    matched: number;
    sent: number;
    failed: number;
    results: any[];
}

/**
 * Email Template interface.
 */
export interface EmailTemplate {
    id: string;
    subject: string;
    html: string;
}

/**
 * Auto Delete Stats interface.
 */
export interface AutoDeleteStats {
    active: number;
    warned: number;
    scheduled: number;
    grace_period: number;
    deleted: number;
}

/**
 * User At Risk of Deletion interface.
 */
export interface UserAtRisk {
    id: string;
    username: string;
    email: string;
    account_status: string;
    xp: number;
    last_interaction_at: string;
    deletion_scheduled_at: string | null;
    deletion_warning_sent_at: string | null;
}

/**
 * Category interface.
 */
export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
}

/**
 * Category with Statistics interface.
 */
export interface CategoryWithStats extends Category {
    seriesCount: number;
}

/**
 * Publication interface for Admin.
 */
export interface Publication {
    id: string;
    title: string;
    author_username: string;
    author_name: string;
    author_email: string;
    view_count: number;
    is_completed: boolean;
    is_archived: boolean;
    is_draft: boolean;
    created_at: string;
    genre?: string;
    cover_url?: string | null;
    chapter_count?: number;
    slug?: string;
}

/**
 * Suggestion interface for Admin.
 */
export interface Suggestion {
    id: string;
    email: string;
    message: string;
    image_url?: string;
    is_read: boolean;
    created_at: string;
    user_id?: string | null;
}

/**
 * Conversation interface for Admin monitoring.
 */
export interface AdminConversation {
    id: string;
    user1_id: string;
    user2_id: string;
    created_at: string;
    updated_at: string;
    last_message: string | null;
    last_message_at: string | null;
    user1: {
        id: string;
        username: string;
        first_name: string | null;
        avatar_url: string | null;
    };
    user2: {
        id: string;
        username: string;
        first_name: string | null;
        avatar_url: string | null;
    };
    unread_count: number;
}

/**
 * Message interface for Admin monitoring.
 */
export interface AdminMessage {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
}
