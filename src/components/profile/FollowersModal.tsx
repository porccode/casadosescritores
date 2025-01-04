"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { createBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FollowersModalProps {
    profileId: string;
    profileUsername: string;
    type: "followers" | "following";
    onClose: () => void;
}

interface User {
    id: string;
    username: string;
    avatar_url?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    isFollowing?: boolean;
}

export default function FollowersModal({
    profileId,
    type,
    onClose,
}: FollowersModalProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);

    const supabase = createBrowserClient();
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);
        };
        checkSession();
    }, []);

    useEffect(() => {
        loadUsers();
    }, [profileId, type, currentUserId]);

    const loadUsers = async () => {
        setLoading(true);
        setError("");

        if (!profileId || profileId === "demo-id") {
            setUsers([
                { id: "demo-1", username: "clarice_lispector", first_name: "Clarice", last_name: "Lispector", isFollowing: false },
                { id: "demo-2", username: "machado_de_assis", first_name: "Machado", last_name: "de Assis", isFollowing: true },
                { id: "demo-3", username: "guimaraes_rosa", first_name: "João", last_name: "Guimarães Rosa", isFollowing: false },
            ]);
            setLoading(false);
            return;
        }

        try {
            let userList: User[] = [];

            if (type === "followers") {
                const { data: followsData, error: followsError } = await (supabase as any)
                    .from("follows")
                    .select("follower_id")
                    .eq("following_id", profileId);

                if (followsError) throw followsError;
                const followerIds = ((followsData as any[]) || []).map((f) => f.follower_id);

                if (followerIds.length > 0) {
                    const { data: profilesData, error: profilesError } = await (supabase as any)
                        .from("profiles")
                        .select("id, username, avatar_url, first_name, last_name")
                        .in("id", followerIds)
                        .eq("is_admin", false);
                    if (profilesError) throw profilesError;
                    userList = profilesData || [];
                }
            } else {
                const { data: followsData, error: followsError } = await (supabase as any)
                    .from("follows")
                    .select("following_id")
                    .eq("follower_id", profileId);

                if (followsError) throw followsError;
                const followingIds = ((followsData as any[]) || []).map((f) => f.following_id);

                if (followingIds.length > 0) {
                    const { data: profilesData, error: profilesError } = await (supabase as any)
                        .from("profiles")
                        .select("id, username, avatar_url, first_name, last_name")
                        .in("id", followingIds)
                        .eq("is_admin", false);
                    if (profilesError) throw profilesError;
                    userList = profilesData || [];
                }
            }

            // Check if current user follows these users
            if (userList.length > 0 && currentUserId) {
                const { data: followData } = await (supabase as any)
                    .from("follows")
                    .select("following_id")
                    .eq("follower_id", currentUserId)
                    .in("following_id", userList.map((u) => u.id));

                const followingMap = new Set(((followData as any[]) || []).map((f) => f.following_id));
                userList = userList.map(u => ({
                    ...u,
                    isFollowing: followingMap.has(u.id)
                }));
            }

            setUsers(userList);
        } catch (err: any) {
            console.error("Erro ao carregar usuários:", err?.message || err);
            setError("Erro ao carregar lista");
        } finally {
            setLoading(false);
        }
    };

    const handleFollowToggle = async (e: React.MouseEvent, targetUser: User) => {
        e.preventDefault();
        e.stopPropagation();

        if (!currentUserId || processingId) return;

        setProcessingId(targetUser.id);

        try {
            if (targetUser.isFollowing) {
                // Unfollow
                const { error } = await (supabase as any)
                    .from("follows")
                    .delete()
                    .eq("follower_id", currentUserId)
                    .eq("following_id", targetUser.id);

                if (error) throw error;
            } else {
                // Follow
                const { error } = await (supabase as any).from("follows").insert({
                    follower_id: currentUserId,
                    following_id: targetUser.id,
                });

                if (error) throw error;
            }

            // Update local state
            setUsers(prev => prev.map(u =>
                u.id === targetUser.id ? { ...u, isFollowing: !u.isFollowing } : u
            ));
        } catch (error) {
            console.error("Erro ao toggle follow:", error);
        } finally {
            setProcessingId(null);
            router.refresh();
        }
    };

    const getDisplayName = (user: User) => {
        return user.first_name || user.last_name
            ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
            : user.username;
    };

    const title = type === "followers" ? "Seguidores" : "Seguindo";

    return (
        <Dialog open={true} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto -mx-6 px-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : error ? (
                        <div className="text-destructive text-center py-6 text-sm">
                            {error}
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-muted-foreground text-center py-8 text-sm">
                            {type === "followers"
                                ? "Nenhum seguidor ainda"
                                : "Não está seguindo ninguém"}
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {users.map((user) => (
                                <div key={user.id} className="flex items-center justify-between gap-3 py-3">
                                    <Link
                                        href={`/profile/${user.username}`}
                                        onClick={onClose}
                                        className="flex items-center gap-3 flex-1 min-w-0 group"
                                    >
                                        <UserAvatar
                                            src={user.avatar_url}
                                            alt={user.username}
                                            size={40}
                                        />
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                                {getDisplayName(user)}
                                            </span>
                                            <span className="text-xs text-muted-foreground truncate">
                                                @{user.username}
                                            </span>
                                        </div>
                                    </Link>

                                    {currentUserId && currentUserId !== user.id && (
                                        <Button
                                            variant={user.isFollowing ? "outline" : "default"}
                                            size="sm"
                                            onClick={(e) => handleFollowToggle(e, user)}
                                            disabled={processingId === user.id}
                                        >
                                            {processingId === user.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : user.isFollowing ? (
                                                "Seguindo"
                                            ) : (
                                                "Seguir"
                                            )}
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

