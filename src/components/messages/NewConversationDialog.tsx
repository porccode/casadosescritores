"use client";

import React, { useState, useCallback } from "react";
import { Search, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { createBrowserClient } from "@/lib/supabase-browser";
import type { OtherUser } from "@/types/messages";
import { cn } from "@/lib/utils";

interface NewConversationDialogProps {
    currentUserId: string;
    onSelectUser: (user: OtherUser) => void;
}

export function NewConversationDialog({
    currentUserId,
    onSelectUser,
}: NewConversationDialogProps) {
    const supabase = createBrowserClient();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<OtherUser[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = useCallback(
        async (value: string) => {
            setQuery(value);
            if (value.trim().length < 2) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const { data } = await supabase
                    .from("profiles")
                    .select("id, username, first_name, avatar_url, role")
                    .or(`username.ilike.%${value}%,first_name.ilike.%${value}%`)
                    .neq("id", currentUserId)
                    .limit(8);

                setResults((data as OtherUser[]) || []);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        },
        [supabase, currentUserId]
    );

    const handleSelect = (user: OtherUser) => {
        onSelectUser(user);
        setOpen(false);
        setQuery("");
        setResults([]);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full"
                    aria-label="Nova conversa"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Nova Conversa</DialogTitle>
                </DialogHeader>

                <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar escritor por nome ou @usuário..."
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-9"
                        autoFocus
                    />
                </div>

                <div className="mt-2 min-h-[120px]">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {!loading && query.length >= 2 && results.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            Nenhum escritor encontrado.
                        </p>
                    )}

                    {!loading && query.length < 2 && (
                        <p className="text-xs text-muted-foreground text-center py-8">
                            Digite pelo menos 2 caracteres para buscar.
                        </p>
                    )}

                    {!loading && results.length > 0 && (
                        <div className="space-y-1">
                            {results.map((user) => {
                                const name = user.first_name || user.username;
                                const initial = name.charAt(0).toUpperCase();
                                return (
                                    <button
                                        key={user.id}
                                        onClick={() => handleSelect(user)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left",
                                            "hover:bg-muted/60 transition-colors"
                                        )}
                                    >
                                        <Avatar className="h-9 w-9 shrink-0">
                                            <AvatarImage src={user.avatar_url || undefined} />
                                            <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                                                {initial}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{name}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                @{user.username}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
