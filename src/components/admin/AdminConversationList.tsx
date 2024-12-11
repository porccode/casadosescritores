"use client";

import React from "react";
import { Search, MessageSquareLock, Lock, User as UserIcon, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

import { AdminConversation } from "@/types/admin";

interface AdminConversationListProps {
    conversations: AdminConversation[];
    activeConversationId?: string;
    onSelectConversation: (conv: AdminConversation) => void;
    mobileView: "list" | "chat";
    searchQuery: string;
    onSearchChange: (val: string) => void;
    loading: boolean;
}

export default function AdminConversationList({
    conversations,
    activeConversationId,
    onSelectConversation,
    mobileView,
    searchQuery,
    onSearchChange,
    loading
}: AdminConversationListProps) {
    return (
        <aside className={cn(
            "w-full md:w-80 lg:w-96 border-r flex flex-col bg-muted/5",
            mobileView === "chat" ? "hidden md:flex" : "flex"
        )}>
            <div className="p-4 pt-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                        placeholder="Pesquisar conversas..."
                        className="pl-9 h-10 border-border bg-background/50 text-sm placeholder:text-muted-foreground/40"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="px-2 pb-4 space-y-0.5">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/20" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="text-center p-12 text-muted-foreground/40 text-sm">
                            Nenhuma conversa ativa.
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => onSelectConversation(conv)}
                                className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-md transition-all group",
                                    activeConversationId === conv.id
                                        ? "bg-primary/5 text-primary"
                                        : "hover:bg-muted/40 text-muted-foreground/70 hover:text-foreground"
                                )}
                            >
                                <div className="flex -space-x-3 shrink-0">
                                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                        <AvatarImage src={conv.user1.avatar_url || undefined} />
                                        <AvatarFallback className="bg-muted text-muted-foreground/40"><UserIcon size={16} /></AvatarFallback>
                                    </Avatar>
                                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                        <AvatarImage src={conv.user2.avatar_url || undefined} />
                                        <AvatarFallback className="bg-muted text-muted-foreground/40"><UserIcon size={16} /></AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="flex-1 text-left min-w-0 pr-1">
                                    <div className="flex justify-between items-baseline gap-2 mb-0.5">
                                        <span className={cn(
                                            "text-[13px] truncate",
                                            activeConversationId === conv.id ? "font-semibold" : "font-medium"
                                        )}>
                                            {conv.user1.username} & {conv.user2.username}
                                        </span>
                                        {conv.last_message_at && (
                                            <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap">
                                                {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false, locale: ptBR })}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground/70 truncate line-clamp-1">
                                        {conv.last_message || "Inicie o monitoramento..."}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </ScrollArea>
        </aside>
    );
}
