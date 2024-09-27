"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Edit, Trash2, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import CommentForm from "./CommentForm";
import CommentText from "./CommentText";
import { Database } from "@/types/database.types";
import { toast } from "sonner";

type CommentRow = Database["public"]["Tables"]["comments"]["Row"];

export interface CommentWithAuthor extends Omit<CommentRow, "like_count" | "dislike_count"> {
    author_username?: string;
    author_avatar_url?: string | null;
    like_count?: number;
    dislike_count?: number;
    user_vote?: "like" | "dislike" | null;
    replies?: CommentWithAuthor[];
}

export interface CommentItemProps {
    comment: CommentWithAuthor;
    currentUserId?: string | null;
    currentUserName?: string;
    currentUserAvatar?: string | null;
    isAdmin?: boolean;
    authorId?: string;  // ID do autor do post/série/capítulo
    onReply: (comment: CommentWithAuthor) => void;
    onReplyPost: (text: string, parentId: string) => Promise<void>;
    onEdit: (id: string, text: string) => Promise<void>;
    onDelete: (id: string) => void;
    isProcessing?: boolean;
    level?: number;
    disableVotes?: boolean;
    disableReplies?: boolean;
}

export default function CommentItem({
    comment,
    currentUserId,
    currentUserName,
    currentUserAvatar,
    isAdmin,
    authorId,
    onReply,
    onReplyPost,
    onEdit,
    onDelete,
    isProcessing = false,
    level = 0,
    disableVotes = false,
    disableReplies = false,
}: CommentItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [showReplies, setShowReplies] = useState(false);
    const [editText, setEditText] = useState(comment.text);
    const [replyText, setReplyText] = useState("");
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const [likes, setLikes] = useState(comment.like_count ?? 0);
    const [dislikes, setDislikes] = useState(comment.dislike_count ?? 0);
    const [userVote, setUserVote] = useState<"like" | "dislike" | null>(comment.user_vote || null);
    const [isVoting, setIsVoting] = useState(false);
    const votingLockRef = useRef(false);

    const isAuthor = currentUserId === comment.author_id;
    const isPostAuthor = authorId && comment.author_id === authorId;
    const canManage = isAuthor || isAdmin;
    const replyCount = comment.replies?.length ?? 0;

    const handleVote = async (type: "like" | "dislike") => {
        if (!currentUserId || votingLockRef.current) return;
        const previousVote = userVote;
        const newVote = previousVote === type ? null : type;
        votingLockRef.current = true;
        setIsVoting(true);
        setUserVote(newVote);

        if (type === "like") {
            setLikes((l) => previousVote === "like" ? Math.max(0, l - 1) : l + 1);
            if (previousVote === "dislike") setDislikes((d) => Math.max(0, d - 1));
        } else {
            setDislikes((d) => previousVote === "dislike" ? Math.max(0, d - 1) : d + 1);
            if (previousVote === "like") setLikes((l) => Math.max(0, l - 1));
        }

        try {
            const res = await fetch("/api/comments/vote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ commentId: comment.id, userId: currentUserId, voteType: type }),
            });
            if (!res.ok) throw new Error();
        } catch {
            setUserVote(previousVote);
        } finally {
            setIsVoting(false);
            votingLockRef.current = false;
        }
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}${window.location.pathname}#comment-${comment.id}`;
        navigator.clipboard.writeText(url).then(() => {
            toast.success("Link copiado!");
        });
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onEdit(comment.id, editText);
        setIsEditing(false);
    };

    const handleReplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        setIsSubmittingReply(true);
        try {
            await onReplyPost(replyText, comment.id);
            setReplyText("");
            setIsReplying(false);
            setShowReplies(true);
        } finally {
            setIsSubmittingReply(false);
        }
    };

    // Avatar size: root = 40px, replies = 24px
    const avatarClass = level === 0 ? "h-10 w-10" : "h-6 w-6";

    return (
        <div
            id={`comment-${comment.id}`}
            className={cn("scroll-mt-20", isProcessing && "opacity-50 pointer-events-none")}
        >
            <div className="group flex gap-4">
                {/* Avatar */}
                <Link href={`/profile/${comment.author_username || comment.author_id}`} className="shrink-0 mt-0.5">
                    <UserAvatar
                        src={comment.author_avatar_url}
                        alt={comment.author_username}
                        className={cn("border border-border", avatarClass)}
                    />
                </Link>

                {/* Content column */}
                <div className="flex-1 min-w-0">
                    {/* Metadata row */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <Link
                            href={`/profile/${comment.author_username || comment.author_id}`}
                            className="text-sm font-semibold text-foreground hover:underline"
                        >
                            @{comment.author_username || "usuario"}
                        </Link>


                        {/* Badge de Autor do post */}
                        {isPostAuthor && level === 0 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-medium">
                                Autor
                            </Badge>
                        )}

                        <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                            })}
                        </span>
                    </div>

                    {/* Text / edit form */}
                    {isEditing ? (
                        <div className="mt-1">
                            <CommentForm
                                value={editText}
                                onChange={setEditText}
                                onSubmit={handleSaveEdit}
                                submitting={isProcessing}
                                username=""
                                submitLabel="Salvar"
                                autoFocus
                                compact
                                onCancel={() => {
                                    setIsEditing(false);
                                    setEditText(comment.text);
                                }}
                            />
                        </div>
                    ) : (
                        <div className="mt-0.5 text-sm text-foreground leading-relaxed break-words">
                            <CommentText text={comment.text} />
                        </div>
                    )}

                    {/* Action bar — YouTube style: always visible, flat */}
                    {!isEditing && (
                        <div className="flex items-center gap-1 mt-2 -ml-2">
                            {/* Like */}
                            {!disableVotes && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "h-8 gap-1.5 px-2 rounded-full text-xs font-medium",
                                        userVote === "like"
                                            ? "text-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    )}
                                    onClick={() => handleVote("like")}
                                    disabled={isVoting}
                                >
                                    <ThumbsUp className={cn("h-4 w-4", userVote === "like" && "fill-current")} />
                                    {likes > 0 && <span>{likes}</span>}
                                </Button>
                            )}

                            {/* Dislike */}
                            {!disableVotes && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "h-8 w-8 p-0 rounded-full",
                                        userVote === "dislike"
                                            ? "text-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    )}
                                    onClick={() => handleVote("dislike")}
                                    disabled={isVoting}
                                >
                                    <ThumbsDown className={cn("h-4 w-4", userVote === "dislike" && "fill-current")} />
                                </Button>
                            )}

                            {/* Reply button */}
                            {currentUserId && !disableReplies && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted"
                                    onClick={() => {
                                        if (!isReplying && level > 0 && comment.author_username && !replyText) {
                                            setReplyText(`@${comment.author_username} `);
                                        }
                                        setIsReplying(!isReplying);
                                    }}
                                >
                                    Responder
                                </Button>
                            )}

                            {/* Link de âncora — aparece ao hover */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-muted"
                                onClick={handleCopyLink}
                                title="Copiar link do comentário"
                            >
                                <Link2 className="h-3.5 w-3.5" />
                            </Button>

                            {/* Three-dot menu — subtle, hover only */}
                            {canManage && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-muted"
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-32">
                                        {isAuthor && (
                                            <DropdownMenuItem onClick={() => setIsEditing(true)} className="gap-2 text-sm">
                                                <Edit className="h-3.5 w-3.5" />
                                                Editar
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem
                                            onClick={() => onDelete(comment.id)}
                                            className="gap-2 text-sm text-destructive focus:text-destructive"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    )}

                    {/* Inline reply form */}
                    {isReplying && (
                        <div className="mt-4">
                            <CommentForm
                                value={replyText}
                                onChange={setReplyText}
                                onSubmit={handleReplySubmit}
                                submitting={isSubmittingReply}
                                username={currentUserName || ""}
                                userAvatar={currentUserAvatar}
                                placeholder="Adicione uma resposta..."
                                onCancel={() => {
                                    setIsReplying(false);
                                    setReplyText("");
                                }}
                                submitLabel="Responder"
                            />
                        </div>
                    )}

                    {/* "X respostas" toggle — YouTube style */}
                    {replyCount > 0 && (
                        <button
                            onClick={() => setShowReplies(!showReplies)}
                            className="flex items-center gap-1.5 mt-3 text-sm font-semibold text-primary hover:bg-primary/5 rounded-full px-3 py-1.5 -ml-3 transition-colors"
                        >
                            {showReplies ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                            {replyCount} {replyCount === 1 ? "resposta" : "respostas"}
                        </button>
                    )}
                </div>
            </div>

            {/* Replies — shown when toggled */}
            {showReplies && replyCount > 0 && (
                <div className="mt-3 ml-14 flex flex-col gap-4">
                    {comment.replies!.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            currentUserId={currentUserId}
                            currentUserName={currentUserName}
                            currentUserAvatar={currentUserAvatar}
                            isAdmin={isAdmin}
                            authorId={authorId}
                            onReply={onReply}
                            onReplyPost={async (text, parentId) => {
                                await onReplyPost(text, parentId);
                                setShowReplies(true);
                            }}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            isProcessing={isProcessing}
                            level={level + 1}
                            disableVotes={disableVotes}
                            disableReplies={disableReplies}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
