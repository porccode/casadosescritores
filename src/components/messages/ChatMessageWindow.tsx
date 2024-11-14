"use client";

import React, { useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import {
    ArrowLeft, MoreVertical, Trash2, Send, User as UserIcon,
    BookOpen, MessageSquarePlus, CheckCheck, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { Conversation, Message } from "@/types/messages";
import { MessageWindowSkeleton } from "@/components/messages/ConversationSkeleton";

interface ChatMessageWindowProps {
    activeConversation: Conversation | null;
    messages: Message[];
    messagesLoading: boolean;
    user: User | null;
    newMessage: string;
    setNewMessage: (val: string) => void;
    handleSendMessage: (e?: React.FormEvent) => void;
    handleTyping: () => void;
    setMobileView: (view: "list" | "chat") => void;
    mobileView: "list" | "chat";
    deleteDialogOpen: boolean;
    setDeleteDialogOpen: (val: boolean) => void;
    handleDeleteConversation: () => void;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    isOtherTyping: boolean;
}

// XP trigger — fires on new real messages (hidden component)
function XPTriggerMessage({ conversationId, lastMessageId }: { conversationId: string; lastMessageId?: string }) {
    const lastTracked = useRef<string | null>(null);
    useEffect(() => {
        if (lastMessageId && lastMessageId !== lastTracked.current && !lastMessageId.startsWith("temp_")) {
            lastTracked.current = lastMessageId;
            fetch("/api/messages/xp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversationId }),
            }).catch(() => {});
        }
    }, [lastMessageId, conversationId]);
    return null;
}

const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const formatDay = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Hoje";
    if (date.toDateString() === yesterday.toDateString()) return "Ontem";
    return date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
};

/** Typing indicator — 3 bouncing dots */
function TypingIndicator() {
    return (
        <div className="flex justify-start mt-3">
            <div className="px-4 py-2.5 rounded-2xl rounded-tl-md bg-muted flex items-center gap-1">
                {[0, 1, 2].map(i => (
                    <span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms`, animationDuration: "800ms" }}
                    />
                ))}
            </div>
        </div>
    );
}

export default function ChatMessageWindow({
    activeConversation,
    messages,
    messagesLoading,
    user,
    newMessage,
    setNewMessage,
    handleSendMessage,
    handleTyping,
    setMobileView,
    mobileView,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleDeleteConversation,
    messagesEndRef,
    isOtherTyping,
}: ChatMessageWindowProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-expand textarea
    const adjustHeight = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }, []);

    useEffect(() => {
        adjustHeight();
    }, [newMessage, adjustHeight]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value);
        handleTyping();
    };

    // Last message sent by me for read receipt display
    const lastSentByMe = [...messages].reverse().find(m => m.sender_id === user?.id);

    return (
        <div className={cn(
            "flex-1 flex flex-col bg-background relative",
            mobileView === "list" ? "hidden md:flex" : "flex"
        )}>
            {activeConversation ? (
                <>
                    {/* ─── Header ──────────────────────────────────────── */}
                    <div className="px-4 py-3 border-b bg-background flex items-center justify-between sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden h-8 w-8"
                                onClick={() => setMobileView("list")}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>

                            <Link
                                href={`/profile/${activeConversation.other_user.username}`}
                                className="flex items-center gap-3 group"
                            >
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={activeConversation.other_user.avatar_url || undefined} />
                                    <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                                        <UserIcon className="h-4 w-4" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col -space-y-0.5">
                                    <span className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors">
                                        {activeConversation.other_user.first_name || activeConversation.other_user.username}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                        @{activeConversation.other_user.username}
                                    </span>
                                </div>
                            </Link>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                <Link href={`/profile/${activeConversation.other_user.username}`}>
                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                </Link>
                            </Button>

                            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Excluir conversa
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação não pode ser desfeita. A conversa será excluída permanentemente para ambos os lados.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDeleteConversation}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Excluir
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>

                    {/* ─── Messages ────────────────────────────────────── */}
                    <ScrollArea className="flex-1 px-4 py-6">
                        <div className="flex flex-col gap-1 max-w-2xl mx-auto">

                            {messagesLoading ? (
                                <MessageWindowSkeleton />
                            ) : messages.length === 0 ? (
                                <div className="py-12 text-center space-y-2 opacity-50">
                                    <MessageSquarePlus className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
                                    <p className="text-sm text-muted-foreground">
                                        Início da conversa com{" "}
                                        <span className="font-medium">
                                            {activeConversation.other_user.first_name || activeConversation.other_user.username}
                                        </span>
                                    </p>
                                    <p className="text-xs text-muted-foreground/60">
                                        Suas mensagens são privadas e seguras.
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg, i) => {
                                    const isMine = msg.sender_id === user?.id;
                                    const showDay = i === 0 ||
                                        new Date(msg.created_at).toDateString() !==
                                        new Date(messages[i - 1].created_at).toDateString();
                                    const isFirstInGroup = i === 0 || messages[i - 1].sender_id !== msg.sender_id;
                                    const isLastInGroup = i === messages.length - 1 || messages[i + 1].sender_id !== msg.sender_id;
                                    const isAdminReply = !isMine && activeConversation.other_user.role === "admin";
                                    const isOptimistic = msg.id.startsWith("temp_");
                                    const isLastSentByMe = msg.id === lastSentByMe?.id;

                                    return (
                                        <React.Fragment key={msg.id}>
                                            {showDay && (
                                                <div className="flex items-center gap-3 my-4">
                                                    <div className="h-px flex-1 bg-border/50" />
                                                    <span className="text-[10px] text-muted-foreground/60 font-medium tracking-wide">
                                                        {formatDay(msg.created_at)}
                                                    </span>
                                                    <div className="h-px flex-1 bg-border/50" />
                                                </div>
                                            )}

                                            <div className={cn(
                                                "flex",
                                                isMine ? "justify-end" : "justify-start",
                                                isFirstInGroup ? "mt-3" : "mt-0.5"
                                            )}>
                                                <div className={cn(
                                                    "max-w-[72%] md:max-w-[60%] px-3.5 py-2 text-sm rounded-2xl",
                                                    isOptimistic && "opacity-70",
                                                    isMine
                                                        ? [
                                                            "bg-primary text-primary-foreground",
                                                            isFirstInGroup && "rounded-tr-md",
                                                            isLastInGroup && "rounded-br-md",
                                                        ]
                                                        : isAdminReply
                                                            ? [
                                                                "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20",
                                                                isFirstInGroup && "rounded-tl-md",
                                                                isLastInGroup && "rounded-bl-md",
                                                            ]
                                                            : [
                                                                "bg-muted text-foreground",
                                                                isFirstInGroup && "rounded-tl-md",
                                                                isLastInGroup && "rounded-bl-md",
                                                            ]
                                                )}>
                                                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                                                        {msg.content}
                                                    </p>

                                                    {isLastInGroup && (
                                                        <div className={cn(
                                                            "flex items-center gap-1 mt-1",
                                                            isMine ? "justify-end" : "justify-start"
                                                        )}>
                                                            <p className={cn(
                                                                "text-[10px]",
                                                                isMine ? "text-primary-foreground/60" : "text-muted-foreground/60"
                                                            )}>
                                                                {formatTime(msg.created_at)}
                                                            </p>
                                                            {/* Read receipts — only on last sent message */}
                                                            {isMine && isLastSentByMe && !isOptimistic && (
                                                                msg.is_read ? (
                                                                    <CheckCheck className="h-3 w-3 text-blue-400 shrink-0" />
                                                                ) : (
                                                                    <Check className="h-3 w-3 text-primary-foreground/50 shrink-0" />
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                })
                            )}

                            {/* Typing indicator */}
                            {isOtherTyping && <TypingIndicator />}

                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>

                    {/* ─── Input ───────────────────────────────────────── */}
                    <div className="px-4 py-3 border-t bg-background">
                        <form
                            onSubmit={handleSendMessage}
                            className="flex items-end gap-2 max-w-2xl mx-auto"
                        >
                            <Textarea
                                ref={textareaRef}
                                value={newMessage}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Escreva uma mensagem..."
                                rows={1}
                                className={cn(
                                    "flex-1 resize-none bg-muted/40 border-transparent",
                                    "focus-visible:border-border focus-visible:ring-0",
                                    "rounded-xl text-sm min-h-[40px] max-h-[120px] py-2.5 px-4",
                                    "transition-colors overflow-hidden"
                                )}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!newMessage.trim()}
                                className="h-10 w-10 rounded-xl shrink-0"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                        <p className="text-center text-[10px] text-muted-foreground/40 mt-2">
                            Enter para enviar · Shift+Enter para nova linha
                        </p>
                    </div>

                    {/* XP gamification trigger */}
                    <XPTriggerMessage
                        conversationId={activeConversation.id}
                        lastMessageId={messages[messages.length - 1]?.id}
                    />
                </>
            ) : (
                /* ─── Empty state (no conversation selected) ─── */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="space-y-5 max-w-xs">
                        <div className="h-16 w-16 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto border border-primary/10">
                            <MessageSquarePlus className="h-7 w-7 text-primary/60" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-lg font-bold tracking-tight">Suas Mensagens</h2>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Conecte-se com escritores que você admira. Selecione uma conversa ou clique em <span className="font-medium text-primary">+</span> para iniciar uma nova.
                            </p>
                        </div>
                        <p className="text-xs text-muted-foreground/50">
                            Mensagens privadas e seguras.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
