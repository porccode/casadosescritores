"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Edit, MessageSquare, Star, BookOpen } from "lucide-react";
import { sanitizeText } from "@/lib/sanitize";
import UserAvatar from "@/components/UserAvatar";
import UserFollowButton from "@/components/UserFollowButton";
import FollowersModal from "./FollowersModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
interface ProfileHeaderProps {
  profile: {
    id: string;
    username: string;
    first_name?: string | null;
    last_name?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    location?: string | null;
    created_at: string;
    is_admin?: boolean;
    role?: string | null;
    writer_xp?: number | null;
    writer_level?: number | null;
    reader_xp?: number | null;
    reader_level?: number | null;
  };
  stats: {
    postsCount: number;
    followersCount: number;
    followingCount: number;
  };
  isOwnProfile: boolean;
  currentUserId?: string | null;
  isFollowing?: boolean;
}

export default function ProfileHeader({
  profile,
  stats,
  isOwnProfile,
  currentUserId,
  isFollowing = false,
}: ProfileHeaderProps) {
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);


  const displayName =
    profile.first_name || profile.last_name
      ? sanitizeText(`${profile.first_name || ""} ${profile.last_name || ""}`.trim())
      : sanitizeText(profile.username);

  const memberSince = new Date(profile.created_at).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <div className="bg-background border-b border-border">
        <div className="content-wrapper py-8 relative">
          {/* Avatar e Info Principal - Centralizado */}
          <div className="flex flex-col items-center text-center">
            {/* Avatar Grande */}
            <div className="relative mb-4">
              <UserAvatar
                src={profile.avatar_url}
                alt={profile.username}
                size={144}
                className="w-28 h-28 md:w-36 md:h-36 border-4 border-background shadow-lg"
              />
            </div>

            {/* Nome e Username */}
            <h1 className="text-2xl font-bold text-foreground font-sans flex items-center justify-center gap-3">
              {displayName}
            </h1>
            <p className="text-primary font-semibold">@{profile.username}</p>

            {profile.bio && (
              <p className="text-sm text-muted-foreground mt-3 max-w-md leading-relaxed line-clamp-3">
                {sanitizeText(profile.bio)}
              </p>
            )}


            {/* Stats (Posts, Followers) */}
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground font-medium">
              <span>
                <strong className="text-foreground">{stats.postsCount}</strong> publicações
              </span>
              {currentUserId ? (
                <Button
                  variant="link"
                  onClick={() => setShowFollowersModal(true)}
                  className="p-0 h-auto font-medium text-muted-foreground hover:text-primary hover:no-underline"
                >
                  <strong className="text-foreground">{stats.followersCount}</strong> seguidores
                </Button>
              ) : (
                <span className="font-medium text-muted-foreground cursor-default">
                  <strong className="text-foreground">{stats.followersCount}</strong> seguidores
                </span>
              )}

              {currentUserId ? (
                <Button
                  variant="link"
                  onClick={() => setShowFollowingModal(true)}
                  className="p-0 h-auto font-medium text-muted-foreground hover:text-primary hover:no-underline"
                >
                  <strong className="text-foreground">{stats.followingCount}</strong> seguindo
                </Button>
              ) : (
                <span className="font-medium text-muted-foreground cursor-default">
                  <strong className="text-foreground">{stats.followingCount}</strong> seguindo
                </span>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center gap-3 mt-6">
              {isOwnProfile ? (
                <div className="flex items-center gap-2">
                  <Button variant="secondary" asChild>
                    <Link href="/profile/edit">
                      <Edit size={16} />
                      Editar Perfil
                    </Link>
                  </Button>
                </div>
              ) : (
                currentUserId && (
                  <div className="flex items-center gap-2">
                    <UserFollowButton
                      profileId={profile.id}
                      isFollowing={isFollowing}
                      username={profile.username}
                    />
                    {/* Não mostrar botão de mensagem em perfis admin para usuários comuns */}
                    {!(profile as any).is_admin && (
                      <Button variant="outline" asChild>
                        <Link href={`/messages?user=${profile.username}`}>
                          <MessageSquare size={16} />
                          Mensagem
                        </Link>
                      </Button>
                    )}
                  </div>
                )
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Followers Modal */}
      {showFollowersModal && (
        <FollowersModal
          profileId={profile.id}
          profileUsername={profile.username}
          type="followers"
          onClose={() => setShowFollowersModal(false)}
        />
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <FollowersModal
          profileId={profile.id}
          profileUsername={profile.username}
          type="following"
          onClose={() => setShowFollowingModal(false)}
        />
      )}
    </>
  );
}
