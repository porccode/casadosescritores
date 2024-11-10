"use client";

import React, { useState } from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import CommentText from "@/components/comments/CommentText";
import { createBrowserClient } from "@/lib/supabase-browser";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Post {
    id: string;
    content: string;
    created_at: string;
    author: {
        id: string;
        username: string;
        avatar_url?: string | null;
        first_name?: string | null;
        last_name?: string | null;
    };
}

interface ReplyModalProps {
    post: Post;
    currentUserId: string;
    currentUserAvatar?: string | null;
    currentUsername: string;
    onClose: () => void;
    onReplyCreated?: (reply: any) => void;
}

export default function ReplyModal({
    post,
    currentUserId,
    currentUserAvatar,
    currentUsername,
    onClose,
    onReplyCreated,
}: ReplyModalProps) {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const supabase = createBrowserClient();

    const displayName =
        post.author.first_name || post.author.last_name
            ? `${post.author.first_name || ""} ${post.author.last_name || ""}`.trim()
            : post.author.username;

    const timeAgo = formatDistanceToNow(new Date(post.created_at), {
        addSuffix: true,
        locale: ptBR,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isSubmitting) return;

        setIsSubmitting(true);
        setError("");

        try {
            const { data: newReply, error: replyError } = await (supabase as any)
                .from("posts")
                .insert({
                    content: content.trim(),
                    author_id: currentUserId,
                    parent_id: post.id,
                })
                .select(`
          *,
          author:profiles!posts_author_id_fkey(id, username, avatar_url, first_name, last_name)
        `)
                .single() as any;

            if (replyError) throw replyError;

            // Incremento atômico — evita race condition do SELECT+UPDATE
            await (supabase as any).rpc("increment_post_reply_count", { post_id: post.id });

            onReplyCreated?.({ ...newReply, parent: post });
            onClose();
        } catch (err: any) {
            console.error("Erro ao criar resposta:", err);
            setError("Erro ao enviar resposta. Tente novamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Responder</DialogTitle>
                </DialogHeader>

                {/* Post Original (Preview) */}
                <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="flex gap-3">
                        <UserAvatar
                            src={post.author.avatar_url}
                            alt={post.author.username}
                            size={40}
                        />
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm">{displayName}</span>
                                <span className="text-muted-foreground text-xs">@{post.author.username}</span>
                                <span className="text-muted-foreground text-xs">·</span>
                                <span className="text-muted-foreground text-xs">{timeAgo}</span>
                            </div>
                            <CommentText text={post.content} />
                        </div>
                    </div>
                </div>

                {/* Formulário de Resposta */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-3">
                        <UserAvatar
                            src={currentUserAvatar}
                            alt={currentUsername}
                            size={40}
                        />
                        <div className="flex-1 space-y-2">
                            <Textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                onKeyDown={(e) => e.stopPropagation()}
                                placeholder="Escreva sua resposta..."
                                className="min-h-[100px] resize-none"
                                maxLength={240}
                                autoFocus
                            />
                            <div className="flex items-center justify-between">
                                <span className={cn(
                                    "text-xs text-muted-foreground",
                                    content.length > 220 && "text-orange-500"
                                )}>
                                    {content.length}/240
                                </span>
                            </div>
                            {error && (
                                <p className="text-destructive text-sm">{error}</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={!content.trim() || isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <MessageCircle className="h-4 w-4" />
                                    Responder
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
