"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  FormEvent,
} from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogIn, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentBlock } from "@/components/layout/ContentBlock";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ConfirmModal";
import { Database } from "@/types/database.types";
import { showXPToast } from "@/lib/xp-toast";
import { XP_CONFIG } from "@/config/xp";
import CommentItem, { CommentWithAuthor } from "./comments/CommentItem";
import CommentForm from "./comments/CommentForm";
import { useAuth } from "@/components/providers/AuthProvider";
import { ADMIN_ACCESS_PROFILE_SELECT, isAdminRole } from "@/lib/roles";
import { buildCommentTree } from "@/lib/comment-utils";

interface CommentsProps {
  storyId?: string;
  contentId?: string;
  announcementId?: string;
  contentType?: string;
  sessionId?: string;
  userId?: string;
  authorId?: string;
  isSeriesComment?: boolean;
  blockId?: string | null;
  isInline?: boolean;
  hideHeader?: boolean;
  postId?: string;
  isMember?: boolean;
  commentsEnabled?: boolean;
}

export default function Comments({
  storyId,
  contentId,
  announcementId,
  contentType,
  sessionId,
  userId,
  authorId,
  isSeriesComment = false,
  blockId,
  isInline = false,
  hideHeader = false,
  postId,
  isMember = true,
  commentsEnabled = true,
}: CommentsProps): React.ReactElement {
  const pathname = usePathname();
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient() as any;
  const [isAdmin, setIsAdmin] = useState(false);

  const { userId: authUserId } = useAuth();
  const { confirm } = useConfirm();
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const id = postId || announcementId || contentId || storyId;
  const type = postId ? "community_post" : (announcementId ? "announcement" : (contentType || (isSeriesComment ? "series" : "story")));
  const currentUserId = userId || sessionId || authUserId;

  // Contagem correta: só comentários raiz (sem parent_id)
  const rootCommentCount = comments.filter(c => !c.parent_id).length;

  const fetchUserData = useCallback(
    async (uid: string) => {
      if (!uid) return;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(`username, avatar_url, ${ADMIN_ACCESS_PROFILE_SELECT}`)
          .eq("id", uid)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            setUsername("Usuário");
            setIsAdmin(false);
            return;
          }
          throw error;
        }

        if (data) {
          setUsername(data.username || "Usuário");
          setIsAdmin(isAdminRole(data));
          setUserAvatar(data.avatar_url);
        }
      } catch (err) {
        console.error("Erro ao buscar dados do usuário:", err);
      }
    },
    [supabase]
  );

  useEffect(() => {
    if (currentUserId) {
      fetchUserData(currentUserId);
    }
  }, [currentUserId, fetchUserData]);

  const isFirstLoadRef = React.useRef(true);

  const loadComments = useCallback(async () => {
    if (!id) return;
    if (isFirstLoadRef.current) {
      setLoading(true);
    }
    try {
      let selectStr = `
        id, 
        text, 
        created_at, 
        author_id, 
        parent_id,
        like_count,
        dislike_count,
        profiles!author_id(username, avatar_url)
      `;

      if (currentUserId) {
        selectStr += `, comment_votes(vote_type)`;
      }

      let query = supabase.from("comments" as any).select(selectStr);

      if (currentUserId) {
        query = (query as any).eq('comment_votes.user_id', currentUserId);
      }

      if (type === "chapter") {
        query = query.eq("chapter_id", id);
      } else if (type === "series") {
        query = query.eq("series_id", id);
      } else if (type === "announcement") {
        query = query.eq("announcement_id", id);
      } else if (type === "community_post") {
        query = query.eq("community_post_id", id);
      } else {
        query = query.eq("story_id", id);
      }

      if (isInline) {
        query = query.eq("is_inline", true);
        if (blockId) {
          query = query.eq("block_id", blockId);
        }
      } else {
        query = query.eq("is_inline", false);
      }

      // Mais recentes primeiro para comentários raiz, mais antigos para replies
      const { data: commentsData, error } = await (query.order("created_at", { ascending: false }) as any);

      if (error) throw error;
      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        isFirstLoadRef.current = false;
        return;
      }

      const formatted = commentsData.map((c: any) => ({
        id: c.id,
        text: c.text,
        created_at: c.created_at,
        author_id: c.author_id,
        parent_id: c.parent_id,
        like_count: c.like_count || 0,
        dislike_count: c.dislike_count || 0,
        author_username: c.profiles?.username || "Usuário",
        author_avatar_url: c.profiles?.avatar_url || null,
        user_vote: c.comment_votes?.[0]?.vote_type || null,
        replies: [],
      })) as CommentWithAuthor[];

      setComments(formatted);
      isFirstLoadRef.current = false;
    } catch (err) {
      console.error("Erro ao carregar comentários:", err);
    } finally {
      setLoading(false);
    }
  }, [id, type, supabase, isInline, blockId, currentUserId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  useEffect(() => {
    if (!id) return;

    let filterCol = "story_id";
    if (type === "chapter") filterCol = "chapter_id";
    else if (type === "series") filterCol = "series_id";
    else if (type === "announcement") filterCol = "announcement_id";
    else if (type === "community_post") filterCol = "community_post_id";

    const channel = supabase
      .channel(`comments-realtime-${type}-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `${filterCol}=eq.${id}`,
        },
        async () => {
          await loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, type, supabase, loadComments]);

  const hasScrolledRef = React.useRef(false);

  useEffect(() => {
    if (comments.length > 0 && typeof window !== 'undefined' && window.location.hash && !hasScrolledRef.current) {
      const hash = window.location.hash;
      const id = hash.replace('#', '');
      
      if (id.startsWith('comment-')) {
        const element = document.getElementById(id);
        if (element) {
          hasScrolledRef.current = true;
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 500);
        }
      }
    }
  }, [comments]);

  async function handleSubmitComment(e: FormEvent) {
    if (e) e.preventDefault();
    if (!currentUserId) {
      setError("Você precisa estar logado para comentar");
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      await handleCommentSubmit(newComment, null);
      setNewComment("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCommentSubmit(text: string, parentId: string | null = null) {
    const commentData: any = {
      text,
      authorId: currentUserId,
      parentId,
      blockId: isInline ? blockId : null,
      isInline: isInline,
    };

    if (type === "chapter") commentData.chapterId = id;
    else if (type === "series") commentData.seriesId = id;
    else if (type === "announcement") commentData.announcementId = id;
    else if (type === "community_post") commentData.communityPostId = id;
    else commentData.storyId = id;

    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(commentData),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const result = await response.json();
        throw new Error(result.error || "Erro ao adicionar comentário");
      } else {
        const textRes = await response.text();
        console.error("Erro da API (não JSON):", textRes);
        throw new Error("Ocorreu um erro inesperado no servidor.");
      }
    }

    setSuccess("Comentário adicionado com sucesso!");
    showXPToast({
      amount: XP_CONFIG.COMMENT_PUBLISH.xp,
      action: XP_CONFIG.COMMENT_PUBLISH.action
    });
    await loadComments();
    setTimeout(() => setSuccess(""), 3000);
  }

  const handleEditComment = async (id: string, text: string) => {
    setIsProcessingAction(true);
    try {
      const { error } = await supabase.from("comments").update({ text }).eq("id", id);
      if (error) throw error;
      setSuccess("Comentário editado!");
      await loadComments();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    const confirmed = await confirm({
      title: "Excluir Comentário",
      message: "Deseja mesmo apagar este comentário? Isso removerá o texto permanentemente.",
      confirmText: "Excluir",
      type: "danger"
    });

    if (!confirmed) return;

    setIsProcessingAction(true);
    try {
      const { error } = await supabase.from("comments").delete().eq("id", id);
      if (error) throw error;
      setSuccess("Comentário excluído.");
      await loadComments();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const tree = useMemo(() => buildCommentTree(comments), [comments]);

  const commentsLoadingSkeleton = (
    <div className="flex flex-col gap-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );

  // Shared pieces
  let targetName = "Esta página";
  if (type === "chapter") targetName = "Este capítulo";
  else if (type === "series") targetName = "Esta série";
  else if (type === "announcement") targetName = "Este aviso";
  else if (type === "community_post") targetName = "Esta publicação";

  const loginPromptText = rootCommentCount === 0
    ? "Não há comentários ainda. Crie uma conta para ser o primeiro a interagir!"
    : `${targetName} tem ${rootCommentCount} ${rootCommentCount === 1 ? 'comentário' : 'comentários'}. Crie uma conta para vê-${rootCommentCount === 1 ? 'lo' : 'los'} e interagir com nossa comunidade!`;

  const loginPrompt = (
    <Alert>
      <LogIn className="h-4 w-4" />
      <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <span className="leading-relaxed">{loginPromptText}</span>
        <Button asChild size="sm" className="shrink-0 w-full sm:w-auto">
          <Link href={`/login?redirectTo=${encodeURIComponent(pathname)}`}>Criar Conta / Entrar</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );

  const commentList = (
    <div className="flex flex-col gap-6">
      {loading ? commentsLoadingSkeleton : comments.length === 0 ? null : (
        tree.map((root) => (
          <CommentItem
            key={root.id}
            comment={root}
            currentUserId={currentUserId}
            currentUserName={username}
            currentUserAvatar={userAvatar}
            isAdmin={isAdmin}
            authorId={authorId}
            onReply={() => { }}
            onReplyPost={handleCommentSubmit}
            onEdit={handleEditComment}
            onDelete={handleDeleteRequest}
            isProcessing={isProcessingAction}
          />
        ))
      )}
    </div>
  );

  const commentForm = isMember ? (
    <CommentForm
      value={newComment}
      onChange={setNewComment}
      onSubmit={handleSubmitComment}
      submitting={submitting}
      username={username}
      userAvatar={userAvatar}
      placeholder="Sua opinião..."
      compact={isInline}
    />
  ) : (
    <div className="bg-secondary/30 text-center py-3 rounded-lg border border-dashed text-xs text-muted-foreground font-semibold">
      Entre na comunidade para comentar nesta publicação.
    </div>
  );

  const disabledNotice = (
    <div className="bg-muted/50 text-center py-4 px-3 rounded-lg border text-sm text-muted-foreground">
      🔒 Os comentários foram desativados para esta obra.
    </div>
  );

  if (isInline || hideHeader) {
    return (
      <div className="w-full mt-2 space-y-6">
        {commentsEnabled === false ? (
          <>
            {disabledNotice}
            {commentList}
          </>
        ) : !currentUserId ? (
          loginPrompt
        ) : (
          <>
            {commentForm}
            {commentList}
          </>
        )}
      </div>
    );
  }

  return (
    <ContentBlock
      title="Comentários"
      variant="outline"
      icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
      count={rootCommentCount}  // ✅ Fix: apenas comentários raiz
      bodyClassName="p-0"
    >
      <div className="p-4 space-y-6">
        {commentsEnabled === false ? (
          <>
            {disabledNotice}
            {commentList}
          </>
        ) : !currentUserId ? (
          loginPrompt
        ) : (
          <>
            {commentForm}
            {commentList}
          </>
        )}
      </div>
    </ContentBlock>
  );
}
