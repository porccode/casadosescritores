"use client";

import React, { useState, useTransition } from "react";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { createNotificationAction } from "@/app/actions/notifications";
import { useAuth } from "@/components/providers/AuthProvider";

interface UserFollowButtonProps {
  /** ID do perfil a ser seguido */
  profileId: string;
  /** Se o usuário atual já segue este perfil */
  isFollowing: boolean;
  /** Nome de usuário do perfil */
  username: string;
}

/**
 * Botão de seguir/deixar de seguir usuário
 * Gerencia estado de follow e cria notificações
 */
export default function UserFollowButton({
  profileId,
  isFollowing,
  username,
}: UserFollowButtonProps): React.ReactElement {
  const [following, setFollowing] = useState(isFollowing);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient();
  const { userId, isAuthenticated } = useAuth();

  // Combinando os estados de loading
  const loading = isLoading || isPending;

  // Função para criar notificação de follow
  const createFollowNotification = async (
    userId: string,
    followedId: string,
    senderUsername?: string
  ) => {
    try {
      const senderName = senderUsername || "Usuário";

      await createNotificationAction({
        userId: followedId,
        targetId: userId, // In this context, source ID
        type: 'follow',
        content: `${senderName} começou a seguir você`
      });

    } catch (error) {
      console.error("Erro ao criar notificação:", error);
    }
  };

  const handleFollowToggle = async () => {
    try {
      // Verificar autenticação do usuário
      if (!isAuthenticated || !userId) {
        const fullPath = window.location.pathname + window.location.search;
        return router.push(`/login?redirectTo=${encodeURIComponent(fullPath)}`);
      }

      setIsLoading(true);

      const action = following ? 'unfollow' : 'follow';
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      const response = await fetch("/api/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          targetUserId: profileId,
          action: action
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erro ao atualizar status de seguidor");

      // Inverter o estado após sucesso
      setFollowing(!following);

      // XP Logic
      if (result.xpAwarded) {
        const { XP_CONFIG } = await import('@/config/xp');
        const { showXPToast } = await import('@/lib/xp-toast');
        showXPToast({
          amount: XP_CONFIG.FOLLOW_USER.xp,
          action: XP_CONFIG.FOLLOW_USER.action,
          message: 'Novo seguidor!'
        });
      }

      // Atualizar a UI
      startTransition(() => {
        router.refresh();
      });
    } catch (error: any) {
      console.error("Erro ao atualizar status de seguidor:", error);
      alert(error.message || `Não foi possível ${following ? "deixar de seguir" : "seguir"} este usuário.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollowToggle}
      disabled={loading}
      className={`h-10 px-6 rounded-lg transition-all duration-200 font-bold text-sm flex items-center justify-center ${following
        ? "bg-background text-muted-foreground border border-border hover:bg-muted"
        : "bg-primary text-primary-foreground hover:opacity-90"
        }`}
      aria-label={following ? "Deixar de seguir" : "Seguir"}
    >
      {loading ? (
        <Loader2 size={16} className="mr-2 animate-spin" />
      ) : following ? (
        <UserMinus size={16} className="mr-2" />
      ) : (
        <UserPlus size={16} className="mr-2" />
      )}
      <span>{following ? "Seguindo" : "Seguir"}</span>
    </button>
  );
}
