// src/components/providers/RealtimeProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { useAuth } from "@/components/providers/AuthProvider";
import { toast } from "@/lib/toast";

interface RealtimeContextValue {
    unreadMessagesCount: number;
    unreadNotificationsCount: number;
    unreadSuggestionsCount: number;
    isAdmin: boolean;
    refreshUnreadCounts: () => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function useRealtime() {
    const context = useContext(RealtimeContext);
    if (!context) {
        throw new Error("useRealtime must be used within a RealtimeProvider");
    }
    return context;
}

interface RealtimeProviderProps {
    children: ReactNode;
}

export default function RealtimeProvider({ children }: RealtimeProviderProps) {
    const supabase = createBrowserClient();
    const { user } = useAuth();
    const [userId, setUserId] = useState<string | null>(null);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
    const [unreadSuggestionsCount, setUnreadSuggestionsCount] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);

    // Sync userId with global AuthContext
    useEffect(() => {
        if (user) {
            setUserId(user.id);
        } else {
            setUserId(null);
            setUnreadMessagesCount(0);
            setUnreadNotificationsCount(0);
            setUnreadSuggestionsCount(0);
            setIsAdmin(false);
        }
    }, [user]);

    // Fetch unread counts
    const refreshUnreadCounts = useCallback(async () => {
        if (!userId) return;

        try {
            // Check if Admin
            const { data: profile } = await (supabase
                .from("profiles")
                .select("role")
                .eq("id", userId)
                .single() as any);

            const userIsAdmin = profile?.role === "admin";
            setIsAdmin(userIsAdmin);

            // Fetch unread messages count (ONLY personal messages)
            const { count: msgCount } = await supabase
                .from("messages")
                .select("*, conversations!inner(id)", { count: "exact", head: true })
                .eq("is_read", false)
                .neq("sender_id", userId)
                .or(`user1_id.eq.${userId},user2_id.eq.${userId}`, { foreignTable: "conversations" });

            setUnreadMessagesCount(msgCount || 0);

            // Fetch unread notifications count
            const { count: notifCount } = await supabase
                .from("notifications")
                .select("*", { count: "exact", head: true })
                .eq("target_user_id", userId)
                .eq("is_read", false);

            setUnreadNotificationsCount(notifCount || 0);

            // Fetch unread suggestions if admin
            if (userIsAdmin) {
                const { count: sugCount } = await (supabase as any).from("suggestions")
                    .select("*", { count: "exact", head: true })
                    .eq("is_read", false);
                setUnreadSuggestionsCount(sugCount || 0);
            }
        } catch (error) {
            console.error("[RealtimeProvider] Error fetching unread counts:", error);
        }
    }, [supabase, userId]);

    // Fetch counts when userId changes
    useEffect(() => {
        if (userId) {
            refreshUnreadCounts();
        }
    }, [userId, refreshUnreadCounts]);

    // Subscribe to realtime events
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel("global_realtime")
            // Listen for new messages
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "messages",
            }, (payload) => {
                const newMessage = payload.new as any;
                // Update: Always refresh from server to ensure filter correctness
                if (newMessage.sender_id !== userId) {
                    refreshUnreadCounts();
                    // Only show personal toast if NOT admin
                    if (!isAdmin) {
                        toast.info("Nova mensagem recebida!", {
                            onClick: () => window.location.href = "/messages"
                        });
                    }
                }
            })
            // Listen for new notifications
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "notifications",
            }, (payload) => {
                const newNotif = payload.new as any;
                if (newNotif.target_user_id === userId) {
                    setUnreadNotificationsCount(prev => prev + 1);

                    // Map types to human-friendly messages
                    const typeMessages: Record<string, string> = {
                        'post_like': 'Alguém curtiu sua publicação! ❤️',
                        'post_repost': 'Alguém repostou sua publicação! 🔁',
                        'post_reply': 'Alguém respondeu sua publicação! 💬',
                        'comment': 'Novo comentário em sua história! 📖',
                        'series_comment': 'Novo comentário em sua série! 📚',
                        'reply': 'Alguém respondeu seu comentário! 💬',
                        'like': 'Alguém curtiu sua história! ❤️',
                        'series_like': 'Alguém curtiu sua série! ❤️',
                        'follow': 'Você tem um novo seguidor! 👋',
                        'new_chapter': 'Novo capítulo em uma série que você segue! 🚀',
                        'mention': 'Você foi mencionado em uma publicação! @',
                    };

                    const message = typeMessages[newNotif.type] || 'Você recebeu uma nova notificação! 🔔';

                    toast.info(message, {
                        onClick: () => {
                            const type = newNotif.type;
                            const data = newNotif.additional_data;

                            if (type === "suggestion") {
                                window.location.href = "/admin/inbox?tab=suggestions";
                            } else if (type === "playlist_add") {
                                window.location.href = data?.playlist_is_private ? "/" : (data?.playlist_id ? `/playlists/${data.playlist_id}` : "/");
                            } else if (data?.story_id) {
                                window.location.href = `/historia/${data.story_id}`;
                            } else if (data?.series_id) {
                                window.location.href = `/series/${data.series_id}`;
                            } else if (data?.chapter_id) {
                                window.location.href = `/capitulo/${data.chapter_id}`;
                            } else if (type.startsWith("post_") && newNotif.related_id) {
                                window.location.href = `/post/${newNotif.related_id}${type === "post_reply" ? `#comment-${newNotif.id}` : ""}`;
                            } else if (type === "follow") {
                                window.location.href = '/notifications';
                            } else if (newNotif.related_id) {
                                window.location.href = `/capitulo/${newNotif.related_id}`;
                            } else {
                                window.location.href = '/notifications';
                            }
                        }
                    });
                }
            })
            // Listen for read status updates on messages
            .on("postgres_changes", {
                event: "UPDATE",
                schema: "public",
                table: "messages",
                filter: `is_read=eq.true`
            }, () => {
                // Refresh counts when messages are marked as read
                refreshUnreadCounts();
            })
            // Listen for changes in suggestions (for admins)
            .on("postgres_changes", {
                event: "*",
                schema: "public",
                table: "suggestions"
            }, () => {
                refreshUnreadCounts();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, userId, refreshUnreadCounts]);

    const contextValue = useMemo(() => ({
        unreadMessagesCount,
        unreadNotificationsCount,
        unreadSuggestionsCount,
        isAdmin,
        refreshUnreadCounts,
    }), [unreadMessagesCount, unreadNotificationsCount, unreadSuggestionsCount, isAdmin, refreshUnreadCounts]);

    return (
        <RealtimeContext.Provider value={contextValue}>
            {children}
        </RealtimeContext.Provider>
    );
}

