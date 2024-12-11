"use client";

import React from "react";
import { ArrowLeft, Trash2, User as UserIcon, MessageSquareLock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { AdminConversation, AdminMessage } from "@/types/admin";

interface AdminMessageWindowProps {
    activeConversation: AdminConversation | null;
    messages: AdminMessage[];
    onDeleteConversation: (id: string) => void;
    mobileView: "list" | "chat";
    setMobileView: (view: "list" | "chat") => void;
}

export default function AdminMessageWindow({
    activeConversation,
    messages,
    onDeleteConversation,
    mobileView,
    setMobileView
}: AdminMessageWindowProps) {
    return (
        <div className={cn(
            "flex-1 flex flex-col bg-background/50 relative",
            mobileView === "list" ? "hidden md:flex" : "flex"
        )}>
            {activeConversation ? (
                <>
                    {/* Header do Chat Ativo */}
                    <div className="h-16 flex items-center justify-between px-6 border-b bg-background/50 backdrop-blur-md z-10 sticky top-0">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden"
                                onClick={() => setMobileView("list")}
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div className="flex -space-x-2 shrink-0">
                                <Avatar className="h-8 w-8 ring-2 ring-background shadow-sm">
                                    <AvatarImage src={activeConversation.user1.avatar_url || undefined} />
                                    <AvatarFallback><UserIcon size={14} /></AvatarFallback>
                                </Avatar>
                                <Avatar className="h-8 w-8 ring-2 ring-background shadow-sm">
                                    <AvatarImage src={activeConversation.user2.avatar_url || undefined} />
                                    <AvatarFallback><UserIcon size={14} /></AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="flex flex-col">
                                <h2 className="font-semibold text-sm leading-none">
                                    {activeConversation.user1.username} & {activeConversation.user2.username}
                                </h2>
                                <span className="text-[10px] text-muted-foreground/60 mt-1">Monitorando interação</span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 transition-colors"
                            onClick={() => onDeleteConversation(activeConversation.id)}
                            title="Excluir conversa inteira"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Mensagens */}
                    <ScrollArea className="flex-1">
                        <div className="p-6 space-y-8 max-w-4xl mx-auto">
                            {messages.map((msg, index) => {
                                const sender = msg.sender_id === activeConversation.user1_id ? activeConversation.user1 : activeConversation.user2;
                                const isUser1 = msg.sender_id === activeConversation.user1_id;
                                const showDate = index === 0 ||
                                    new Date(msg.created_at).toDateString() !== new Date(messages[index - 1].created_at).toDateString();

                                return (
                                    <React.Fragment key={msg.id}>
                                        {showDate && (
                                            <div className="flex justify-center my-6">
                                                <span className="text-[10px] font-medium text-muted-foreground/40 px-3 py-1 bg-muted/30 rounded-full">
                                                    {new Date(msg.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                </span>
                                            </div>
                                        )}
                                        <div className={cn(
                                            "flex items-start gap-4",
                                            isUser1 ? "flex-row" : "flex-row-reverse"
                                        )}>
                                            <Avatar className="h-8 w-8 mt-1 border border-border shadow-sm shrink-0">
                                                <AvatarImage src={sender.avatar_url || undefined} />
                                                <AvatarFallback><UserIcon size={14} /></AvatarFallback>
                                            </Avatar>
                                            <div className={cn(
                                                "flex flex-col max-w-[80%]",
                                                isUser1 ? "items-start" : "items-end"
                                            )}>
                                                <span className="text-[10px] font-medium text-muted-foreground/60 mb-1.5 px-1 uppercase tracking-tight">
                                                    @{sender.username}
                                                </span>
                                                <div className={cn(
                                                    "p-3 rounded-lg text-sm transition-all",
                                                    isUser1
                                                        ? "bg-primary text-primary-foreground rounded-tl-none shadow-sm"
                                                        : "bg-muted/80 text-foreground border border-border rounded-tr-none"
                                                )}>
                                                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                                    <div className={cn(
                                                        "text-[9px] mt-1.5 flex justify-end items-center gap-1 opacity-60 font-medium",
                                                        isUser1 ? "text-primary-foreground/80" : "text-muted-foreground"
                                                    )}>
                                                        {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-muted-foreground/40">
                    <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-6">
                        <MessageSquareLock className="h-8 w-8 opacity-20" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground/60 mb-1">Selecione uma conversa</h2>
                    <p className="max-w-[240px] text-xs leading-relaxed">
                        Escolha uma conversa na lista para monitorar as mensagens entre usuários.
                    </p>
                </div>
            )}
        </div>
    );
}
