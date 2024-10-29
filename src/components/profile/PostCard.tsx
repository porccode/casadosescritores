"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/UserAvatar";
import ReplyModal from "./ReplyModal";
import { Heart, MessageCircle, Repeat2, MoreHorizontal, Trash2, Video, Camera, Pin, ShieldCheck } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { cn, generateSlug } from "@/lib/utils";
import CommentText from "@/components/comments/CommentText";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { togglePostPinAction } from "@/app/actions/posts";
import { showXPToast } from "@/lib/xp-toast";
import { XP_CONFIG } from "@/config/xp";

const MEDIA_REGEX = /https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|open\.spotify\.com|media\.tenor\.com|media\.giphy\.com|i\.giphy\.com|.*\.supabase\.co\/storage\/v1\/object\/public\/attachments\/)/i;

import { Post } from "@/types/post";

interface ActivityInfo {
  type: "like" | "repost" | "reply";
  actorName: string;
  replyContent?: string;
}

interface PostCardProps {
  post: Post;
  currentUserId?: string | null;
  currentUserAvatar?: string | null;
  currentUsername?: string;
  currentUserIsAdmin?: boolean;
  onDelete?: (postId: string) => void;
  onReplyCreated?: (reply: any) => void;
  activity?: ActivityInfo;
  disableActions?: boolean;
  isDetailPage?: boolean;
}

function ActivityIndicator({ activity }: { activity: ActivityInfo }) {
  const config = {
    like:   { icon: <Heart size={13} className="fill-current" />,   text: "curtiu",    color: "text-red-500" },
    repost: { icon: <Repeat2 size={13} />,                           text: "repostou",  color: "text-green-600" },
    reply:  { icon: <MessageCircle size={13} />,                     text: "comentou",  color: "text-primary" },
  }[activity.type];

  return (
    <div className="flex flex-col gap-1.5 mb-3">
      <div className={`flex items-center gap-1.5 text-xs ${config.color}`}>
        {config.icon}
        <span className="font-medium">{activity.actorName} {config.text}</span>
      </div>
      {activity.type === "reply" && activity.replyContent && (
        <div className="pl-5 border-l-2 border-muted">
          <p className="text-xs text-muted-foreground italic line-clamp-2">"{activity.replyContent}"</p>
        </div>
      )}
    </div>
  );
}

// Formato compacto de tempo
function formatCompactTime(date: Date): string {
  const diffMs  = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffH   = Math.floor(diffMin / 60);
  const diffD   = Math.floor(diffH / 24);
  if (diffD > 0)   return `Há ${diffD}d`;
  if (diffH > 0)   return `Há ${diffH}h`;
  if (diffMin > 0) return `Há ${diffMin}min`;
  return "Agora";
}

export default function PostCard({
  post,
  currentUserId,
  currentUserAvatar,
  currentUsername,
  currentUserIsAdmin,
  onDelete,
  onReplyCreated,
  activity,
  disableActions = false,
  isDetailPage = false,
}: PostCardProps) {
  const [liked,       setLiked]       = useState(post.isLiked    || false);
  const [likeCount,   setLikeCount]   = useState(post.like_count  ?? 0);
  const [reposted,    setReposted]    = useState(post.isReposted  || false);
  const [repostCount, setRepostCount] = useState(post.repost_count ?? 0);
  const [replyCount,  setReplyCount]  = useState(post.reply_count  ?? 0);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [isPending,   startTransition] = useTransition();
  const [isDeleting,  setIsDeleting]  = useState(false);
  const [isPinned,    setIsPinned]    = useState(post.is_pinned || false);

  // Sync when server revalidates (only if it changes externally)
  React.useEffect(() => {
    setLiked(post.isLiked    || false);
    setLikeCount(post.like_count  ?? 0);
    setReposted(post.isReposted  || false);
    setRepostCount(post.repost_count ?? 0);
    setReplyCount(post.reply_count  ?? 0);
    setIsPinned(post.is_pinned || false);
  }, [post.isLiked, post.like_count, post.isReposted, post.repost_count, post.reply_count, post.is_pinned]);

  const supabase     = createBrowserClient();
  const router       = useRouter();
  const isAuthor     = currentUserId === post.author.id;
  const showActions  = !disableActions && !activity;
  const postHref     = `/post/${generateSlug(post.content?.slice(0, 50) || "post", post.id)}`;

  const displayName  = (post.author.first_name || post.author.last_name)
    ? `${post.author.first_name || ""} ${post.author.last_name || ""}`.trim()
    : post.author.username;

  const timeAgo = formatCompactTime(new Date(post.created_at));

  // ── Handlers ────────────────────────────────────────────────────────────────
  const [isLiking, setIsLiking] = useState(false);
  const [isReposting, setIsReposting] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId || isLiking) return;
    
    setIsLiking(true);

    // Otimista manual (seguro)
    const prevLiked = liked;
    const prevCount = likeCount;
    const newLiked = !prevLiked;
    
    setLiked(newLiked);
    setLikeCount(prevCount + (newLiked ? 1 : -1));

    try {
      const response = await fetch("/api/posts/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId: post.id }),
      });
      
      if (!response.ok) throw new Error("Falha ao curtir");
      const result = await response.json();
      
      if (!result.success) throw new Error("Falha ao curtir");
      if (result.xpAwarded) {
        showXPToast({ amount: XP_CONFIG.POST_LIKE.xp, action: XP_CONFIG.POST_LIKE.action });
      }
    } catch {
      // Fallback em caso de erro na API
      setLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId || isReposting) return;
    
    setIsReposting(true);

    const prevReposted = reposted;
    const prevCount = repostCount;
    const newR = !prevReposted;
    
    setReposted(newR);
    setRepostCount(prevCount + (newR ? 1 : -1));

    try {
      const response = await fetch("/api/posts/repost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId: post.id }),
      });

      if (!response.ok) throw new Error("Falha ao repostar");
      const result = await response.json();
      
      if (!result.success) throw new Error("Falha ao repostar");
    } catch {
      setReposted(prevReposted);
      setRepostCount(prevCount);
    } finally {
      setIsReposting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if ((!isAuthor && !currentUserIsAdmin) || isDeleting) return;
    onDelete?.(post.id);
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("posts").delete().eq("id", post.id);
      if (error) throw error;
      if (isAuthor) {
        await showXPToast({ amount: XP_CONFIG.CONTENT_DELETE.xp, action: XP_CONFIG.CONTENT_DELETE.action });
      }
    } catch { /* silent */ } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserIsAdmin || isPending) return;
    
    const prevPinned = isPinned;
    setIsPinned(!prevPinned);
    
    startTransition(async () => {
      try {
        const result = await togglePostPinAction(post.id);
        if (!result.success) throw new Error("Falha ao fixar");
      } catch {
        setIsPinned(prevPinned);
      }
    });
  };

  const handleReplyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentUserId && currentUsername) setShowReplyModal(true);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isDetailPage) return;
    
    // Check if the user is selecting text. If they selected text, don't navigate.
    const sel = window.getSelection();
    if (sel && sel.toString().length > 0) return;
    
    router.push(postHref);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── ReplyModal fora do Card — evita bubbling de clique para o card ──── */}
      {showReplyModal && currentUserId && currentUsername && (
        <ReplyModal
          post={post}
          currentUserId={currentUserId}
          currentUserAvatar={currentUserAvatar}
          currentUsername={currentUsername}
          onClose={() => setShowReplyModal(false)}
          onReplyCreated={(reply) => {
            setReplyCount(prev => prev + 1);
            onReplyCreated?.(reply);
          }}
        />
      )}

      {/* Linha de post — sem Card wrapper, separado por divide-y no pai */}
      <div
        onClick={handleCardClick}
        onMouseEnter={() => !isDetailPage && router.prefetch(postHref)}
        className={cn(
          "relative transition-colors group/card",
          !isDetailPage && "cursor-pointer hover:bg-accent/30",
          post.author.is_admin ? "bg-primary/5" : ""
        )}
      >
        {isPinned && (
          <div className="absolute top-0 right-0 py-0.5 px-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-bl flex items-center gap-1">
            <Pin size={10} className="fill-current" />
            FIXADO
          </div>
        )}
        <div className={cn("px-2 py-2.5", isPinned && "pt-5")}>
          {activity && <ActivityIndicator activity={activity} />}

          <div className="flex gap-2.5 items-start">
            {/* Avatar */}
            <Link
              href={`/profile/${post.author.username}`}
              className="shrink-0 hover:opacity-80 transition-opacity"
              onClick={e => e.stopPropagation()}
            >
              <UserAvatar src={post.author.avatar_url} alt={post.author.username} size={32} />
            </Link>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                    {post.author.is_admin && (
                        <ShieldCheck size={14} className="text-primary shrink-0" />
                    )}
                  </div>
                  <Link
                    href={`/profile/${post.author.username}`}
                    className="text-[#484DB5] font-semibold text-xs truncate hover:underline"
                    onClick={e => e.stopPropagation()}
                  >
                    @{post.author.username}
                  </Link>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Indicador de mídia */}
                  {MEDIA_REGEX.test(post.content) && (
                    <div className="text-red-600 flex items-center">
                      {post.content.includes("youtube.com") || post.content.includes("youtu.be")
                        ? <Video size={13} className="fill-current" />
                        : <Camera size={13} className="fill-current" />
                      }
                    </div>
                  )}

                  {/* Timestamp — link separado para o post */}
                  <Link
                    href={postHref}
                    className="text-muted-foreground text-xs whitespace-nowrap hover:text-primary transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    {timeAgo}
                  </Link>

                  {/* Menu exclusão */}
                  {(isAuthor || currentUserIsAdmin) && showActions && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 focus-visible:ring-0"
                          onClick={e => { e.preventDefault(); e.stopPropagation(); }}
                        >
                          <MoreHorizontal size={15} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                        {currentUserIsAdmin && (
                          <DropdownMenuItem
                            onClick={handleTogglePin}
                            className="cursor-pointer"
                          >
                            <Pin size={13} className="mr-2" />
                            {isPinned ? "Desfixar Post" : "Fixar no Topo"}
                          </DropdownMenuItem>
                        )}
                        {isAuthor && (
                          <DropdownMenuItem
                            onClick={handleDelete}
                            className="text-destructive focus:text-destructive cursor-pointer"
                          >
                            <Trash2 size={13} className="mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        )}
                        {currentUserIsAdmin && !isAuthor && (
                          <DropdownMenuItem
                            onClick={handleDelete}
                            className="text-destructive focus:text-destructive cursor-pointer"
                          >
                            <Trash2 size={13} className="mr-2" />
                            Excluir (Admin)
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              {/* Replying to label */}
              {post.parent_author_username && (
                <div className="mt-1">
                  <span className="text-xs text-muted-foreground">
                    Respondendo a{" "}
                    <Link
                      href={`/profile/${post.parent_author_username}`}
                      className="text-primary hover:underline"
                      onClick={e => e.stopPropagation()}
                    >
                      @{post.parent_author_username}
                    </Link>
                  </span>
                </div>
              )}

              {/* Corpo do post */}
              <div className="mt-1">
                <CommentText text={post.content} />
              </div>
            </div>
          </div>

          {/* Barra de ações */}
          {showActions && (
            <div className="flex items-center gap-0.5 mt-1.5 ml-[44px]">
              {/* Comentar */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReplyClick}
                disabled={!currentUserId}
                className="h-7 px-2 text-muted-foreground hover:text-primary"
              >
                <MessageCircle size={13} />
                <span className="ml-1 text-xs">{replyCount}</span>
              </Button>

              {/* Repostar */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRepost}
                disabled={!currentUserId}
                className={cn(
                  "h-7 px-2 transition-colors",
                  reposted
                    ? "text-green-600 hover:text-green-600"
                    : "text-muted-foreground hover:text-green-600"
                )}
              >
                <Repeat2 size={13} />
                <span className="ml-1 text-xs">{repostCount}</span>
              </Button>

              {/* Curtir */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={!currentUserId}
                className={cn(
                  "h-7 px-2 transition-colors",
                  liked
                    ? "text-red-500 hover:text-red-500"
                    : "text-muted-foreground hover:text-red-500"
                )}
              >
                <Heart size={13} className={liked ? "fill-current" : ""} />
                <span className="ml-1 text-xs">{likeCount}</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
