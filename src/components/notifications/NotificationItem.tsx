"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Heart,
  UserPlus,
  Repeat2,
  BookOpen,
  AtSign,
  ListPlus,
  Loader2,
  Mail,
  MessagesSquare,
} from "lucide-react";
import { generateSlug, cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationPayload } from "@/types/notifications";
import { createBrowserClient } from "@/lib/supabase-browser";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface NotificationSender {
  username: string;
  avatar_url: string | null;
}

interface Notification extends Omit<NotificationPayload, 'related_id'> {
  id: string;
  is_read: boolean;
  created_at: string;
  related_id?: string;
  sender?: NotificationSender;
}

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onNavigate?: () => void;
}

export default function NotificationItem({
  notification,
  onRead,
  onNavigate,
}: NotificationItemProps) {
  const { type, additional_data, sender, is_read, created_at, content } = notification;
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [isDeclined, setIsDeclined] = useState(false);

  const authorName = sender?.username || "Alguém";
  const authorAvatar = sender?.avatar_url;
  const authorInitial = authorName.charAt(0).toUpperCase();

  const getUrl = (): string => {
    // Redirecionamento unificado e inteligente para posts e comentários de comunidades
    if (
      type === "community_post_comment" ||
      type === "community_comment" ||
      type === "community_post_like" ||
      type === "community_post_created" ||
      (type === "mention" && additional_data?.community_post_id)
    ) {
      const postId = additional_data?.community_post_id || notification.related_id;
      const commentId = additional_data?.comment_id;
      if (postId) {
        let redirectUrl = `/comunidades/post/${postId}`;
        if (commentId) {
          redirectUrl += `?commentId=${commentId}`;
        }
        return redirectUrl;
      }
    }

    if (type === "message") {
      const conversationId = additional_data?.conversation_id;
      if (conversationId) {
        return `/admin/inbox?tab=conversations&conversation=${conversationId}`;
      }
      return "/admin/inbox?tab=conversations";
    }

    if (type === "suggestion") return "/admin/inbox?tab=suggestions";

    if (type === "new_chapter" && additional_data?.chapter_id) {
      return `/capitulo/${generateSlug(additional_data.chapter_title || "", additional_data.chapter_id)}`;
    }


    if (type.startsWith("community_") && additional_data?.community_slug) {
      return `/comunidades/${additional_data.community_slug}`;
    }

    const targetUsername = additional_data?.username || sender?.username;
    if ((type === "playlist_add" || type === "series_follow" || type === "follow") && targetUsername) {
      return `/profile/${targetUsername}`;
    }

    // Para notificações de comentário, resposta ou menção:
    // Evitamos o early-return sem âncora e damos prioridade ao capítulo.
    const isCommentRelated =
      type === "comment" ||
      type === "series_comment" ||
      type === "community_post_comment" ||
      type === "community_comment" ||
      type === "reply" ||
      type === "mention";

    if (!isCommentRelated) {
      if (additional_data?.community_slug) {
        return `/comunidades/${additional_data.community_slug}`;
      }
      if (additional_data?.chapter_id) {
        return `/capitulo/${generateSlug(additional_data.chapter_title || "", additional_data.chapter_id)}`;
      }
      if (additional_data?.story_id) {
        return `/historia/${generateSlug(additional_data.story_title || "", additional_data.story_id)}`;
      }
      if (additional_data?.series_id) {
        return `/series/${generateSlug(additional_data.series_title || "", additional_data.series_id)}`;
      }
    }

    let url = "/";
    if (additional_data?.community_slug) {
      url = `/comunidades/${additional_data.community_slug}`;
    } else if (additional_data?.chapter_id) {
      url = `/capitulo/${generateSlug(additional_data.chapter_title || "", additional_data.chapter_id)}`;
    } else if (additional_data?.story_id) {
      url = `/historia/${generateSlug(additional_data.story_title || "", additional_data.story_id)}`;
    } else if (additional_data?.series_id) {
      url = `/series/${generateSlug(additional_data.series_title || "", additional_data.series_id)}`;
    } else if (additional_data?.announcement_id) {
      url = `/anuncios/${generateSlug(additional_data.announcement_title || "", additional_data.announcement_id)}`;
    } else if (additional_data?.community_post_id) {
      url = "/comunidades";
    } else if (notification.related_id) {
      url = `/capitulo/${notification.related_id}`;
    }

    if (isCommentRelated) {
      if (additional_data?.comment_id) {
        url += `#comment-${additional_data.comment_id}`;
      } else if (type === "reply") {
        url += `#comment-${notification.related_id}`;
      }
    }

    return url;
  };

  const getMessage = (): React.ReactNode => {
    const name = (
      <Link
        href={`/profile/${sender?.username}`}
        className="font-bold text-foreground hover:underline pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {authorName}
      </Link>
    );

    switch (type) {
      case "comment": {
        const isInline = additional_data?.is_inline;
        const targetTitle = additional_data?.story_title || additional_data?.chapter_title || "uma obra";
        return (
          <>
            {name} {isInline ? "comentou em um parágrafo de" : "comentou em"}{" "}
            <span className="font-medium">{targetTitle}</span>
          </>
        );
      }
      case "series_comment": {
        const isInline = additional_data?.is_inline;
        const targetTitle = additional_data?.chapter_title || additional_data?.series_title || "uma série";
        return (
          <>
            {name} {isInline ? "comentou em um parágrafo de" : "comentou em"}{" "}
            <span className="font-medium">{targetTitle}</span>
          </>
        );
      }
      case "community_comment":
      case "community_post_comment": {
        return (
          <>
            {name} comentou em sua publicação na comunidade
          </>
        );
      }
      case "reply":
      case "post_reply":
        return (
          <>
            {name} respondeu ao seu comentário
          </>
        );
      case "post_like":
        return <>{name} curtiu sua publicação</>;
      case "post_repost":
        return <>{name} repostou sua publicação</>;
      case "like":
      case "series_like":
        return (
          <>
            {name} curtiu{" "}
            <span className="font-medium">{additional_data?.story_title}</span>
          </>
        );
      case "follow":
        return <>{name} começou a seguir você</>;
      case "series_follow":
        return (
          <>
            {name} começou a seguir a série{" "}
            <span className="font-medium">
              {additional_data?.series_title || "sua série"}
            </span>
          </>
        );
      case "new_chapter":
        return (
          <>
            {name} postou{" "}
            <span className="font-medium">
              {additional_data?.chapter_title || "novo capítulo"}
            </span>{" "}
            em{" "}
            <span className="font-medium">
              {additional_data?.series_title || "uma série"}
            </span>
          </>
        );
      case "mention":
        return <>{name} mencionou você</>;
      case "playlist_add": {
        const contentName = additional_data?.series_title || additional_data?.story_title || "sua obra";
        const isPrivate = additional_data?.playlist_is_private;
        if (isPrivate) {
          return (
            <>
              Um usuário adicionou{" "}
              <span className="font-medium">{contentName}</span>
              {" "}a uma playlist privada
            </>
          );
        }
        const playlistName = additional_data?.playlist_name
          ? ` à playlist ${additional_data.playlist_name}`
          : " a uma playlist";
        return (
          <>
            {name} adicionou{" "}
            <span className="font-medium">{contentName}</span>
            {playlistName}
          </>
        );
      }
      case "community_post_like": {
        const communityName = additional_data?.community_name ? ` na comunidade ${additional_data.community_name}` : " na comunidade";
        return (
          <>
            {name} curtiu sua publicação{communityName}
          </>
        );
      }
      case "community_invite":
        return (
          <>
            {name} convidou você para uma comunidade
          </>
        );
      case "community_request":
        return (
          <>
            {name} {content || "solicitou entrada na comunidade"}
          </>
        );
      case "community_post_created": {
        const communityName = additional_data?.community_name ? ` na comunidade ${additional_data.community_name}` : " na comunidade";
        return (
          <>
            {name} publicou uma nova discussão{communityName}
          </>
        );
      }
      case "message": {
        const preview = content || additional_data?.message_preview;
        return (
          <>
            Você recebeu uma mensagem no Chat Direto
            {preview && (
              <span className="block text-muted-foreground font-normal mt-0.5 line-clamp-1">
                {preview}
              </span>
            )}
          </>
        );
      }
      case "suggestion": {
        return (
          <>
            Você recebeu uma resposta em Contatos
          </>
        );
      }
      default:
        return content || "Nova notificação";
    }
  };

  const getIcon = () => {
    const iconProps = { className: "h-3.5 w-3.5 text-white" };

    const getBadgeClass = (color: string) =>
      cn(
        "absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-background",
        color
      );

    switch (type) {
      case "like":
      case "post_like":
      case "series_like":
      case "community_post_like":
        return (
          <div className={getBadgeClass("bg-red-500")}>
            <Heart {...iconProps} fill="currentColor" />
          </div>
        );
      case "comment":
      case "series_comment":
      case "reply":
      case "post_reply":
      case "community_post_comment":
      case "community_comment":
        return (
          <div className={getBadgeClass("bg-blue-500")}>
            <MessageSquare {...iconProps} fill="currentColor" />
          </div>
        );
      case "post_repost":
        return (
          <div className={getBadgeClass("bg-green-500")}>
            <Repeat2 {...iconProps} />
          </div>
        );
      case "follow":
      case "series_follow":
      case "community_invite":
        return (
          <div className={getBadgeClass("bg-primary")}>
            <UserPlus {...iconProps} />
          </div>
        );
      case "new_chapter":
        return (
          <div className={getBadgeClass("bg-amber-500")}>
            <BookOpen {...iconProps} />
          </div>
        );
      case "mention":
        return (
          <div className={getBadgeClass("bg-purple-500")}>
            <AtSign {...iconProps} />
          </div>
        );
      case "playlist_add":
        return (
          <div className={getBadgeClass("bg-violet-600")}>
            <ListPlus {...iconProps} />
          </div>
        );
      case "community_request":
        return (
          <div className={getBadgeClass("bg-amber-500")}>
            <UserPlus {...iconProps} />
          </div>
        );
      case "community_post_created":
        return (
          <div className={getBadgeClass("bg-emerald-500")}>
            <MessageSquare {...iconProps} />
          </div>
        );
      case "message":
        return (
          <div className={getBadgeClass("bg-violet-500")}>
            <MessagesSquare {...iconProps} />
          </div>
        );
      case "suggestion":
        return (
          <div className={getBadgeClass("bg-sky-500")}>
            <Mail {...iconProps} />
          </div>
        );
      default:
        return null;
    }
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHour / 24);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMin < 1) return "agora";
    if (diffMin < 60) return `${diffMin}min`;
    if (diffHour < 24) return `${diffHour}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return `${diffWeeks}sem`;
  };

  const handleAccept = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const inviteId = additional_data?.invite_id;
    const communityId = notification.related_id;
    
    if (!inviteId || !communityId) {
      toast.error("Erro: Informações do convite ausentes.");
      return;
    }
    
    setIsActionLoading(true);
    try {
      const supabase = createBrowserClient() as any;
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Você precisa estar logado.");
        return;
      }

      // 1. Inserir na tabela de membros
      const { error: memberError } = await supabase.from("community_members").insert({
        community_id: communityId,
        user_id: user.id,
        role: "member",
        status: "joined",
      });
      if (memberError) throw memberError;

      // 2. Atualizar convite
      const { error: inviteError } = await supabase
        .from("community_invites")
        .update({ status: "accepted" })
        .eq("id", inviteId);
      if (inviteError) throw inviteError;

      toast.success(`Você entrou na comunidade ${additional_data?.community_name || ""}!`);
      setIsAccepted(true);
      onRead(notification.id);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao aceitar convite.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDecline = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const inviteId = additional_data?.invite_id;
    if (!inviteId) {
      toast.error("Erro: Informações do convite ausentes.");
      return;
    }
    
    setIsActionLoading(true);
    try {
      const supabase = createBrowserClient() as any;
      const { error } = await supabase
        .from("community_invites")
        .update({ status: "declined" })
        .eq("id", inviteId);
      if (error) throw error;

      toast.success("Convite recusado.");
      setIsDeclined(true);
      onRead(notification.id);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao recusar convite.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleClick = () => {
    onRead(notification.id);
    onNavigate?.();

    // ✅ Gamificação: Premiar XP por ver notificação (se não lida)
    if (!is_read) {
      import("@/services/xp").then(({ grantXP }) => {
        // We use the same userId from the session or let the service handle it
        // Since this is a client component, we'll need a different approach or 
        // a dedicated API route for client-side XP grants of serverSide: true actions
        // Wait, NOTIFICATION_CLICK is serverSide: true, so it NEEDS an API route or Action.
        fetch('/api/notifications/xp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: notification.id })
        }).catch(err => console.error("XP Error:", err));
      });
    }
  };

  return (
    <div className="relative group">
      <Link
        href={getUrl()}
        onClick={handleClick}
        className={cn(
          "absolute inset-0 z-0 hover:bg-accent transition-colors",
          !is_read && "bg-primary/5"
        )}
        aria-label="Ver detalhe da notificação"
      />

      <div className="flex items-start gap-3 px-4 py-3 relative z-10 pointer-events-none">
        {/* Avatar com badge */}
        <div className="relative shrink-0 pointer-events-auto">
          <Link href={`/profile/${sender?.username}`} onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}>
            <Avatar className="h-11 w-11">
              {authorAvatar && <AvatarImage src={authorAvatar} alt={authorName} />}
              <AvatarFallback className="text-sm font-medium">
                {authorInitial}
              </AvatarFallback>
            </Avatar>
          </Link>
          {getIcon()}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug text-foreground">
            {getMessage()}
          </p>

          {type === "community_invite" && (
            <div className="mt-2 flex items-center gap-2 pointer-events-auto">
              {isAccepted ? (
                <span className="text-xs font-semibold text-emerald-600">Convite aceito</span>
              ) : isDeclined ? (
                <span className="text-xs font-semibold text-muted-foreground">Convite recusado</span>
              ) : (
                <>
                  <Button
                    size="sm"
                    className="h-7 px-3 rounded-full text-xs font-bold"
                    onClick={handleAccept}
                    disabled={isActionLoading}
                  >
                    {isActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Aceitar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-3 rounded-full text-xs font-bold border-destructive/20 text-destructive hover:bg-destructive/5"
                    onClick={handleDecline}
                    disabled={isActionLoading}
                  >
                    Recusar
                  </Button>
                </>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-0.5">
            {getTimeAgo(created_at)}
          </p>
        </div>

        {/* Indicador de não lida */}
        {!is_read && (
          <div className="shrink-0 self-center">
            <div className="h-2 w-2 rounded-full bg-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
