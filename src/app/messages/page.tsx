"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";
import ChatConversationList from "@/components/messages/ChatConversationList";
import ChatMessageWindow from "@/components/messages/ChatMessageWindow";
import type { Conversation, Message, OtherUser } from "@/types/messages";
import { useRealtime } from "@/components/providers/RealtimeProvider";
import { toast } from "@/lib/toast";

export default function MessagesPage() {
    const searchParams = useSearchParams();
    const targetUsername = searchParams.get("user");
    const supabase = createBrowserClient();
    const router = useRouter();
    const { refreshUnreadCounts } = useRealtime();

    const [user, setUser] = useState<User | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [mobileView, setMobileView] = useState<"list" | "chat">("list");
    const [isOtherTyping, setIsOtherTyping] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // ─── Fetch conversations (optimized: 2 queries instead of N+1) ──────────
    const fetchConversations = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from("conversations" as any)
                .select(`
                    *,
                    user1:user1_id(id, username, first_name, avatar_url, role),
                    user2:user2_id(id, username, first_name, avatar_url, role)
                `)
                .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
                .order("updated_at", { ascending: false });

            if (error) throw error;
            const convList = (data || []) as any[];

            // Filter only conversations with at least one message
            const withMessages = convList.filter((c: any) => c.last_message);
            if (withMessages.length === 0) {
                setConversations([]);
                return;
            }

            // Batch fetch all unread counts in a single query (2 queries total instead of N+1)
            const convIds = withMessages.map((c: any) => c.id);
            const { data: unreadMsgs } = await supabase
                .from("messages" as any)
                .select("conversation_id")
                .in("conversation_id", convIds)
                .eq("is_read", false)
                .neq("sender_id", userId);

            const unreadMap = ((unreadMsgs as unknown as { conversation_id: string }[]) || []).reduce(
                (acc: Record<string, number>, msg: { conversation_id: string }) => {
                    acc[msg.conversation_id] = (acc[msg.conversation_id] || 0) + 1;
                    return acc;
                },
                {}
            );

            const formatted: Conversation[] = withMessages.map((conv: any) => ({
                ...conv,
                other_user: conv.user1_id === userId ? conv.user2 : conv.user1,
                unread_count: unreadMap[conv.id] || 0,
            }));

            setConversations(formatted);
        } catch (error) {
            console.error("Erro ao carregar conversas:", error);
        }
    }, [supabase]);

    // ─── Fetch messages for a conversation ──────────────────────────────────
    const fetchMessages = useCallback(async (conversationId: string, currentUserId: string) => {
        if (conversationId === "temp_draft") {
            setMessages([]);
            return;
        }
        setMessagesLoading(true);
        try {
            const { data, error } = await supabase
                .from("messages" as any)
                .select("*")
                .eq("conversation_id", conversationId)
                .order("created_at", { ascending: true });

            if (error) throw error;
            setMessages((data as unknown as Message[]) || []);

            // Mark as read
            await (supabase as any)
                .from("messages")
                .update({ is_read: true })
                .eq("conversation_id", conversationId)
                .neq("sender_id", currentUserId)
                .eq("is_read", false);

            refreshUnreadCounts();

            // Update conversation unread count locally (no extra fetch needed)
            setConversations(prev =>
                prev.map(c =>
                    c.id === conversationId ? { ...c, unread_count: 0 } : c
                )
            );
        } catch (error) {
            console.error("Erro ao carregar mensagens:", error);
        } finally {
            setMessagesLoading(false);
        }
    }, [supabase, refreshUnreadCounts]);

    // ─── Start or open a conversation with a user ───────────────────────────
    const handleStartConversation = useCallback(async (userId: string, targetUser: OtherUser) => {
        if (targetUser.id === userId) return;

        // Check local state first
        let conv = conversations.find(c =>
            (c.user1_id === userId && c.user2_id === targetUser.id) ||
            (c.user1_id === targetUser.id && c.user2_id === userId)
        );

        if (!conv) {
            // Check DB (two queries to cover both user orderings)
            const [{ data: d1 }, { data: d2 }] = await Promise.all([
                supabase.from("conversations" as any).select("*").eq("user1_id", userId).eq("user2_id", targetUser.id).maybeSingle(),
                supabase.from("conversations" as any).select("*").eq("user1_id", targetUser.id).eq("user2_id", userId).maybeSingle(),
            ]);

            const existing = d1 || d2;
            if (existing) {
                conv = { ...(existing as object), other_user: targetUser, unread_count: 0 } as Conversation;
                setConversations(prev => {
                    if (prev.find(p => p.id === conv!.id)) return prev;
                    return [conv!, ...prev];
                });
            } else {
                // Draft — will be persisted on first message send
                conv = {
                    id: "temp_draft",
                    user1_id: userId,
                    user2_id: targetUser.id,
                    other_user: targetUser,
                    unread_count: 0,
                    last_message: null,
                    last_message_at: null,
                    updated_at: new Date().toISOString(),
                } as Conversation;
            }
        }

        setActiveConversation(conv);
        fetchMessages(conv.id, userId);
        setMobileView("chat");
    }, [conversations, supabase, fetchMessages]);

    // ─── Handle ?user= query param ──────────────────────────────────────────
    const handleStartNewConversationByUsername = useCallback(async (userId: string, username: string) => {
        try {
            const { data: targetUser, error } = await supabase
                .from("profiles")
                .select("id, username, first_name, avatar_url, role")
                .ilike("username", username)
                .single();

            if (error || !targetUser) return;
            await handleStartConversation(userId, targetUser as OtherUser);
        } catch (error) {
            console.error("Erro ao iniciar conversa por username:", error);
        }
    }, [supabase, handleStartConversation]);

    // ─── Init ────────────────────────────────────────────────────────────────
    useEffect(() => {
        async function init() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                const fullPath = window.location.pathname + window.location.search;
                router.push(`/login?redirectTo=${encodeURIComponent(fullPath)}`);
                return;
            }
            setUser(session.user);
            await fetchConversations(session.user.id);

            if (targetUsername) {
                await handleStartNewConversationByUsername(session.user.id, targetUsername);
            }

            setLoading(false);
        }
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Delete conversation ─────────────────────────────────────────────────
    const handleDeleteConversation = useCallback(async () => {
        if (!activeConversation || !user) return;
        try {
            const { error } = await supabase
                .from("conversations" as any)
                .delete()
                .eq("id", activeConversation.id);

            if (error) throw error;

            setConversations(prev => prev.filter(c => c.id !== activeConversation.id));
            setActiveConversation(null);
            setMobileView("list");
            setDeleteDialogOpen(false);
        } catch {
            toast.error("Erro ao excluir conversa. Tente novamente.");
        }
    }, [activeConversation, user, supabase]);

    // ─── Select conversation ─────────────────────────────────────────────────
    const handleSelectConversation = useCallback((conv: Conversation) => {
        setActiveConversation(conv);
        fetchMessages(conv.id, user?.id ?? "");
        setMobileView("chat");
    }, [fetchMessages, user]);

    // ─── Send message ────────────────────────────────────────────────────────
    const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() || !activeConversation || !user) return;

        const messageContent = newMessage.trim();
        setNewMessage("");

        // Stop typing indicator
        if (typingChannelRef.current) {
            typingChannelRef.current.untrack();
        }

        const tempId = `temp_${Date.now()}`;
        const optimisticMessage: Message = {
            id: tempId,
            conversation_id: activeConversation.id,
            sender_id: user.id,
            content: messageContent,
            is_read: false,
            created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, optimisticMessage]);

        // Update conversation preview locally
        setConversations(prev =>
            prev.map(c =>
                c.id === activeConversation.id
                    ? { ...c, last_message: messageContent, last_message_at: new Date().toISOString() }
                    : c
            )
        );

        try {
            let conversationId = activeConversation.id;

            if (conversationId === "temp_draft") {
                const { data: convData, error: convError } = await (supabase
                    .from("conversations" as any)
                    .insert({ user1_id: user.id, user2_id: activeConversation.user2_id } as any)
                    .select() as any)
                    .single();

                if (convError) throw convError;
                conversationId = convData.id;

                const updatedConv: Conversation = {
                    ...convData,
                    other_user: activeConversation.other_user,
                    unread_count: 0,
                };
                setActiveConversation(updatedConv);
                setConversations(prev => [updatedConv, ...prev.filter(c => c.id !== "temp_draft")]);
            }

            const { data, error } = await supabase
                .from("messages" as any)
                .insert({ conversation_id: conversationId, sender_id: user.id, content: messageContent } as any)
                .select()
                .single();

            if (error) throw error;

            setMessages(prev =>
                prev.map(msg => (msg.id === tempId ? (data as unknown as Message) : msg))
            );
        } catch {
            // Revert optimistic update
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
            setNewMessage(messageContent);
            toast.error("Não foi possível enviar a mensagem.");
        }
    }, [newMessage, activeConversation, user, supabase]);

    // ─── Typing indicator ────────────────────────────────────────────────────
    const handleTyping = useCallback(() => {
        if (!activeConversation || activeConversation.id === "temp_draft" || !user) return;

        const channel = typingChannelRef.current;
        if (!channel) return;

        channel.track({ typing: true, userId: user.id });

        // Auto-clear after 2.5s of no input
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            channel.untrack();
        }, 2500);
    }, [activeConversation, user]);

    // ─── Realtime: messages ──────────────────────────────────────────────────
    useEffect(() => {
        if (!activeConversation || activeConversation.id === "temp_draft") return;

        const convId = activeConversation.id;

        const msgSub = supabase
            .channel(`chat_${convId}`)
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `conversation_id=eq.${convId}`,
            }, (payload) => {
                const newMsg = payload.new as Message;

                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                });

                // Update conversation list preview
                setConversations(prev =>
                    prev.map(c =>
                        c.id === convId
                            ? { ...c, last_message: newMsg.content, last_message_at: newMsg.created_at }
                            : c
                    )
                );

                // If it's from the other person, mark as read immediately
                if (user && newMsg.sender_id !== user.id) {
                    (supabase as any)
                        .from("messages")
                        .update({ is_read: true })
                        .eq("id", newMsg.id);
                    refreshUnreadCounts();
                }
            })
            // Listen for read updates to show ✓✓ in real time
            .on("postgres_changes", {
                event: "UPDATE",
                schema: "public",
                table: "messages",
                filter: `conversation_id=eq.${convId}`,
            }, (payload) => {
                const updated = payload.new as Message;
                setMessages(prev =>
                    prev.map(m => m.id === updated.id ? { ...m, is_read: updated.is_read } : m)
                );
            })
            .subscribe();

        return () => { supabase.removeChannel(msgSub); };
    }, [activeConversation, supabase, user, refreshUnreadCounts]);

    // ─── Realtime: typing indicator ──────────────────────────────────────────
    useEffect(() => {
        // Clean up previous channel
        if (typingChannelRef.current) {
            supabase.removeChannel(typingChannelRef.current);
            typingChannelRef.current = null;
        }

        if (!activeConversation || activeConversation.id === "temp_draft" || !user) return;

        const channel = supabase.channel(`typing_${activeConversation.id}`, {
            config: { presence: { key: user.id } },
        });

        channel
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState() as Record<string, { typing?: boolean; userId?: string }[]>;
                const others = Object.values(state)
                    .flat()
                    .filter((p) => p.userId !== user.id);
                setIsOtherTyping(others.some(p => p.typing));
            })
            .subscribe();

        typingChannelRef.current = channel;

        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            supabase.removeChannel(channel);
            typingChannelRef.current = null;
        };
    }, [activeConversation, supabase, user]);

    // ─── Auto-scroll ─────────────────────────────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, [messages]);

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="flex h-[calc(100vh-64px)] bg-background overflow-hidden border-t">
            <ChatConversationList
                conversations={conversations}
                activeConversationId={activeConversation?.id}
                onSelectConversation={handleSelectConversation}
                onStartConversation={(targetUser) => {
                    if (user) handleStartConversation(user.id, targetUser);
                }}
                currentUserId={user?.id ?? ""}
                mobileView={mobileView}
                loading={loading}
            />

            <ChatMessageWindow
                activeConversation={activeConversation}
                messages={messages}
                messagesLoading={messagesLoading}
                user={user}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                handleSendMessage={handleSendMessage}
                handleTyping={handleTyping}
                setMobileView={setMobileView}
                mobileView={mobileView}
                deleteDialogOpen={deleteDialogOpen}
                setDeleteDialogOpen={setDeleteDialogOpen}
                handleDeleteConversation={handleDeleteConversation}
                messagesEndRef={messagesEndRef}
                isOtherTyping={isOtherTyping}
            />
        </div>
    );
}
