"use client";

import React, { useState } from "react";
import Link from "next/link";
import CompactPostTrigger from "./CompactPostTrigger";
import InfinitePostList from "./InfinitePostList";
import { Button } from "@/components/ui/button";
import { Feather, Users } from "lucide-react";

import { Post } from "@/types/post";

interface HomeFeedProps {
    initialPosts: Post[];
    currentUserId?: string | null;
    currentUsername?: string;
    currentUserAvatar?: string | null;
    currentUserIsAdmin?: boolean;
    isLoggedIn?: boolean;
    disableInfiniteScroll?: boolean;
}

export default function HomeFeed({
    initialPosts,
    currentUserId,
    currentUsername,
    currentUserAvatar,
    currentUserIsAdmin,
    isLoggedIn = false,
    disableInfiniteScroll = false,
}: HomeFeedProps) {
    const [newPosts, setNewPosts] = useState<Post[]>([]);

    const handlePostCreated = (post: Post) => {
        setNewPosts(prev => [post, ...prev]);
    };

    return (
        <div className="w-full">
            {currentUserId ? (
                <div className="mb-2 md:mb-3">
                    <CompactPostTrigger onPostCreated={handlePostCreated} />
                </div>
            ) : (
                /* CTA de conversão para visitantes não logados */
                <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 flex flex-col gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Users size={16} className="text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground leading-tight">
                                Junte-se à comunidade
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Publique, comente e conecte-se com escritores
                            </p>
                        </div>
                    </div>
                    <Button asChild size="sm" className="w-full gap-2 font-semibold">
                        <Link href="/login?signup=true">
                            <Feather size={14} />
                            Criar conta grátis
                        </Link>
                    </Button>
                </div>
            )}

            <InfinitePostList
                initialPosts={initialPosts}
                currentUserId={currentUserId}
                currentUsername={currentUsername}
                currentUserAvatar={currentUserAvatar}
                currentUserIsAdmin={currentUserIsAdmin}
                prependedPosts={newPosts}
                disableInfiniteScroll={disableInfiniteScroll}
            />
        </div>
    );
}
