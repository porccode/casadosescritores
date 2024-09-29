"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, MessageSquare, LogIn, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { createBrowserClient } from "@/lib/supabase-browser";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { showXPToast } from "@/lib/xp-toast";
import { XP_CONFIG } from "@/config/xp";

interface Comment {
    id: string;
    text: string;
    created_at: string;
    author_id: string;
    author_username: string;
    author_avatar_url: string | null;
}

function ExpandableText({ text }: { text: string }) {
    const [expanded, setExpanded] = useState(false);
    const isLong = text.length > 250 || text.split('\n').length > 4;

    if (!isLong) {
        return <p className="text-sm text-foreground/90 leading-relaxed break-words whitespace-pre-wrap">{text}</p>;
    }

    return (
        <div className="space-y-1">
            <p className={cn("text-sm text-foreground/90 leading-relaxed break-words whitespace-pre-wrap transition-all", !expanded && "line-clamp-4")}>
                {text}
            </p>
            <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-primary font-medium hover:underline"
            >
                {expanded ? "Mostrar menos" : "Ler mais"}
            </button>
        </div>
    );
}

interface ParagraphCommentPanelProps {
    blockId: string;
    chapterId: string;
    userId: string | null;
    userAvatar?: string | null;
    username?: string;
    isAdmin?: boolean;
    onClose: () => void;
    onCountChange?: (blockId: string, count: number) => void;
}

export default function ParagraphCommentPanel({
    blockId,
    chapterId,
    userId,
    userAvatar,
    username,
    isAdmin,
    onClose,
    onCountChange,
}: ParagraphCommentPanelProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const pathname = usePathname();
    const supabase = createBrowserClient() as any;

    // Load comments for this block
    const loadComments = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from("comments")
                .select("id, text, created_at, author_id, profiles!author_id(username, avatar_url)")
                .eq("chapter_id", chapterId)
                .eq("block_id", blockId)
                .eq("is_inline", true)
                .is("parent_id", null)
                .order("created_at", { ascending: true });

            if (data) {
                const formatted: Comment[] = data.map((c: any) => ({
                    id: c.id,
                    text: c.text,
                    created_at: c.created_at,
                    author_id: c.author_id,
                    author_username: c.profiles?.username || "Usuário",
                    author_avatar_url: c.profiles?.avatar_url || null,
                }));
                setComments(formatted);
                onCountChange?.(blockId, formatted.length);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
    loadComments();
    // Focus textarea after loading
    setTimeout(() => textareaRef.current?.focus(), 150);

    // Close on Escape key only
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
    };

    }, [blockId, chapterId]);

    const handleSubmit = async () => {
        if (!text.trim() || !userId || submitting) return;
        setSubmitting(true);
        try {
            const response = await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: text.trim(),
                    authorId: userId,
                    chapterId,
                    blockId,
                    isInline: true,
                    parentId: null,
                }),
            });

            if (response.ok) {
                setText("");
                showXPToast({ amount: XP_CONFIG.COMMENT_PUBLISH.xp, action: XP_CONFIG.COMMENT_PUBLISH.action });
                await loadComments();
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!window.confirm("Tem certeza que deseja excluir este comentário?")) return;
        try {
            const { error } = await supabase.from('comments').delete().eq('id', commentId);
            if (!error) {
                await loadComments();
            } else {
                console.error("Erro ao excluir comentário:", error);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div
            ref={panelRef}
            className={cn(
                "relative mx-auto my-2 rounded-xl border border-border bg-card shadow-lg",
                "animate-in slide-in-from-top-2 fade-in duration-200",
                "max-w-2xl not-prose"
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span>Comentários do parágrafo</span>
                    {comments.length > 0 && (
                        <span className="ml-1 text-xs text-muted-foreground">({comments.length})</span>
                    )}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="p-4 space-y-4 max-h-[420px] overflow-y-auto">
                {/* Comment Form */}
                {userId ? (
                    <div className="flex gap-3">
                        <Avatar className="h-8 w-8 shrink-0 border border-border">
                            <AvatarImage src={userAvatar || ""} />
                            <AvatarFallback className="text-xs font-semibold">
                                {username?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                            <Textarea
                                ref={textareaRef}
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Sua reação a este trecho..."
                                className="min-h-[72px] resize-none text-sm border-border/60 focus-visible:ring-primary/30"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                            />
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground">Ctrl+Enter para enviar</span>
                                <Button
                                    size="sm"
                                    onClick={handleSubmit}
                                    disabled={!text.trim() || submitting}
                                    className="h-7 px-3 text-xs rounded-full"
                                >
                                    {submitting ? "Enviando..." : "Comentar"}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/40 border border-border/60">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <LogIn className="h-4 w-4 shrink-0" />
                            <span>Entre para comentar neste trecho</span>
                        </div>
                        <Button asChild size="sm" className="h-7 px-3 text-xs rounded-full shrink-0">
                            <Link href={`/login?redirectTo=${encodeURIComponent(pathname)}`}>
                                Entrar
                            </Link>
                        </Button>
                    </div>
                )}

                {/* Comments List */}
                {!loading && comments.length > 0 && (
                    <>
                        <Separator className="opacity-50" />
                        <div className="space-y-4">
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                    <Avatar className="h-7 w-7 shrink-0 border border-border">
                                        <AvatarImage src={comment.author_avatar_url || ""} />
                                        <AvatarFallback className="text-[10px] font-semibold">
                                            {comment.author_username[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-1">
                                            <div className="flex items-baseline gap-2">
                                                <Link
                                                    href={`/profile/${comment.author_username}`}
                                                    className="text-xs font-semibold hover:text-primary transition-colors"
                                                >
                                                    @{comment.author_username}
                                                </Link>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {formatDistanceToNow(new Date(comment.created_at), {
                                                        addSuffix: true,
                                                        locale: ptBR,
                                                    })}
                                                </span>
                                            </div>
                                            {isAdmin && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mt-1 -mr-1"
                                                    onClick={() => handleDelete(comment.id)}
                                                    title="Excluir comentário"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                        <ExpandableText text={comment.text} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {!loading && comments.length === 0 && userId && (
                    <p className="text-xs text-center text-muted-foreground py-2">
                        Seja o primeiro a comentar neste trecho!
                    </p>
                )}
            </div>
        </div>
    );
}
