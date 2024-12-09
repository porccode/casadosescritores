"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    MessageSquareLock,
    Mail,
    Trash2,
    Check,
    Eye,
    Loader2,
    Inbox as InboxIcon,
    Calendar,
    Paperclip
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageHeader } from "@/components/admin/PageHeader";
import { cn, formatDate } from "@/lib/utils";
import AdminConversationList from "@/components/admin/AdminConversationList";
import AdminMessageWindow from "@/components/admin/AdminMessageWindow";
import { SuggestionItem } from "@/components/admin/SuggestionItem";
import { useAdminConversations } from "@/hooks/useAdminConversations";
import { useAdminSuggestions } from "@/hooks/useAdminSuggestions";

export default function AdminInboxPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "conversations");

    const {
        conversations,
        activeConversation,
        messages,
        loading: conversationsLoading,
        searchQuery: convSearch,
        setSearchQuery: setConvSearch,
        mobileView,
        setMobileView,
        selectConversation,
        handleDeleteConversation
    } = useAdminConversations();

    const {
        suggestions,
        loading: suggestionsLoading,
        unreadCount: unreadSuggestions,
        handleToggleRead,
        handleDelete: handleDeleteSuggestion,
        handleReply
    } = useAdminSuggestions();

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", value);
        router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
    };

    // Sync active tab with URL
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        } else if (!tab && activeTab !== "conversations") {
            setActiveTab("conversations");
        }
    }, [searchParams, activeTab]);

    // Auto-select conversation from URL param (e.g. from notification deep-link)
    useEffect(() => {
        const conversationId = searchParams.get("conversation");
        if (!conversationId || conversationsLoading) return;
        const match = conversations.find((c) => c.id === conversationId);
        if (match) {
            selectConversation(match);
            // Clean up URL param so back navigation works correctly
            const params = new URLSearchParams(searchParams.toString());
            params.delete("conversation");
            router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversations, conversationsLoading]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Atendimento"
                description="Monitoramento de comunicações e contatos."
                action={
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
                        <TabsList>
                            <TabsTrigger value="conversations" className="gap-2">
                                <MessageSquareLock className="h-4 w-4" />
                                Chat Direto
                            </TabsTrigger>
                            <TabsTrigger value="suggestions" className="gap-2 relative">
                                <Mail className="h-4 w-4" />
                                Contatos
                                {unreadSuggestions > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                }
            />

            <Tabs value={activeTab} className="mt-0">
                <TabsContent value="conversations" className="m-0 focus-visible:ring-0">
                    <Card>
                        <div className="h-[calc(100vh-210px)] flex flex-col overflow-hidden">
                            <div className="flex flex-1 overflow-hidden">
                                <AdminConversationList
                                    conversations={conversations}
                                    activeConversationId={activeConversation?.id}
                                    onSelectConversation={selectConversation}
                                    mobileView={mobileView}
                                    searchQuery={convSearch}
                                    onSearchChange={setConvSearch}
                                    loading={conversationsLoading}
                                />
                                <AdminMessageWindow
                                    activeConversation={activeConversation}
                                    messages={messages}
                                    onDeleteConversation={handleDeleteConversation}
                                    mobileView={mobileView}
                                    setMobileView={setMobileView}
                                />
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="suggestions" className="m-0 focus-visible:ring-0">
                    <Card>
                        <ScrollArea className="h-[calc(100vh-210px)]">
                            <div className="p-6 space-y-4">
                                {suggestionsLoading ? (
                                    <div className="flex flex-col items-center justify-center py-16">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        <span className="mt-4 text-sm text-muted-foreground">Carregando contatos...</span>
                                    </div>
                                ) : suggestions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <InboxIcon className="h-8 w-8 text-muted-foreground/40" />
                                        <h3 className="text-base font-semibold mt-4">Caixa de entrada vazia</h3>
                                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                                            Nenhuma mensagem foi enviada via formulário de contato.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {suggestions.map((s) => (
                                            <SuggestionItem
                                                key={s.id}
                                                suggestion={s}
                                                onToggleRead={handleToggleRead}
                                                onDelete={handleDeleteSuggestion}
                                                onReply={handleReply}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
