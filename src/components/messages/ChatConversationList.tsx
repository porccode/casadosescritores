"use client";

import React from "react";
import { Search, MessageSquareLock, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Conversation, OtherUser } from "@/types/messages";
import { ConversationListSkeleton } from "@/components/messages/ConversationSkeleton";
import { NewConversationDialog } from "@/components/messages/NewConversationDialog";
import { useState } from "react";

interface ChatConversationListProps {
    conversations: Conversation[];
    activeConversationId?: string;
    onSelectConversation: (conv: Conversation) => void;
    onStartConversation: (user: OtherUser) => void;
    currentUserId: string;
    mobileView: "list" | "chat";
    loading: boolean;
}

export default function ChatConversationList({
    conversations,
    activeConversationId,
    onSelectConversation,
    onStartConversation,
    currentUserId,
    mobileView,
    loading,
}: ChatConversationListProps) {
    const [search, setSearch] = useState("");

    const filtered = conversations.filter(conv => {
        const name = conv.other_user.first_name || conv.other_user.username;
        return name.toLowerCase().includes(search.toLowerCase());
    });

    return (
        <div className={cn(
            "w-full md:w-72 lg:w-80 border-r flex flex-col bg-background transition-all duration-300",
            mobileView === "chat" ? "hidden md:flex" : "flex"
        )}>
            {/* Header */}
            <div className="px-5 pt-5 pb-3 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquareLock className="h-4 w-4 text-primary" />
                        <h1 className="text-base font-bold tracking-tight">Mensagens</h1>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 px-2 py-1 rounded-full">
                            <Lock className="h-2.5 w-2.5" />
                            <span>privado</span>
                        </div>
                        {/* Nova conversa */}
                        {currentUserId && (
                            <NewConversationDialog
                                currentUserId={currentUserId}
                                onSelectUser={onStartConversation}
                            />
                        )}
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                    <Input
                        placeholder="Buscar..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-8 h-9 bg-muted/40 border-transparent focus-visible:border-border focus-visible:ring-0 text-sm rounded-lg"
                    />
                </div>
            </div>

            {/* Lista */}
            <ScrollArea className="flex-1">
                {loading ? (
                    <ConversationListSkeleton count={5} />
                ) : filtered.length === 0 ? (
                    <div className="px-5 py-16 text-center space-y-2">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                            <MessageSquareLock className="h-5 w-5 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                            {search ? "Nenhum resultado" : "Nenhuma conversa ainda"}
                        </p>
                        {!search && (
                            <p className="text-xs text-muted-foreground/60">
                                Clique em <span className="font-medium text-primary">+</span> para iniciar uma conversa.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="py-1">
                        {filtered.map((conv) => {
                            const isActive = activeConversationId === conv.id;
                            const name = conv.other_user.first_name || conv.other_user.username;
                            const initial = name.charAt(0).toUpperCase();
                            const timeAgo = conv.last_message_at
                                ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false, locale: ptBR })
                                : "";
                            const hasUnread = conv.unread_count > 0;

                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => onSelectConversation(conv)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                                        "hover:bg-muted/50 focus-visible:outline-none focus-visible:bg-muted/50",
                                        isActive && "bg-muted/70"
                                    )}
                                >
                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={conv.other_user.avatar_url || undefined} />
                                            <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                                                {initial}
                                            </AvatarFallback>
                                        </Avatar>
                                        {hasUnread && (
                                            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline justify-between gap-2 mb-0.5">
                                            <span className={cn(
                                                "text-sm truncate",
                                                hasUnread ? "font-semibold text-foreground" : "font-medium text-foreground/80"
                                            )}>
                                                {name}
                                            </span>
                                            {timeAgo && (
                                                <span className="text-[10px] text-muted-foreground/60 shrink-0">
                                                    {timeAgo}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={cn(
                                                "text-xs truncate",
                                                hasUnread ? "text-foreground/70" : "text-muted-foreground/60"
                                            )}>
                                                {conv.last_message || "Sem mensagens"}
                                            </p>
                                            {hasUnread && (
                                                <Badge className="h-4 min-w-4 px-1 flex items-center justify-center rounded-full text-[9px] bg-primary shrink-0">
                                                    {conv.unread_count}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
