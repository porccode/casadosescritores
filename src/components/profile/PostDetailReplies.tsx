"use client";

import React, { useState, useMemo } from "react";
import PostCard from "./PostCard";
import { MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
        subscription_plan?: string | null;
    };
    reply_count: number;
    like_count: number;
    repost_count: number;
    isLiked?: boolean;
    isReposted?: boolean;
    parent_id?: string | null;
    parent_author_username?: string | null;
}

interface PostDetailRepliesProps {
    initialReplies: Post[];
    currentUserId?: string | null;
    currentUserAvatar?: string | null;
    currentUsername?: string;
    ancestors?: Post[];
    currentUserIsAdmin?: boolean;
    mainPost: Post;
}

interface NestedPostProps {
    post: Post & { replies?: Post[] };
    currentUserId?: string | null;
    currentUserAvatar?: string | null;
    currentUsername?: string;
    currentUserIsAdmin?: boolean;
    onReplyCreated: (reply: any) => void;
    onDelete: (replyId: string) => void;
    level?: number;
}

function NestedPost({
    post,
    currentUserId,
    currentUserAvatar,
    currentUsername,
    currentUserIsAdmin,
    onReplyCreated,
    onDelete,
    level = 0,
}: NestedPostProps) {
    const hasReplies = post.replies && post.replies.length > 0;
    
    return (
        <div className="w-full relative">
            <div 
                className="relative"
                style={{ 
                    paddingLeft: level > 0 ? `${Math.min(level * 24, 72)}px` : '0px',
                }}
            >
                {/* Visual Connector for Nested Replies */}
                {level > 0 && (
                    <div 
                        className="absolute bg-border z-0" 
                        style={{
                            left: `${Math.min((level - 1) * 24 + 16, 64)}px`,
                            top: '0px',
                            bottom: '0px',
                            width: '2px',
                        }}
                    />
                )}
                
                <PostCard
                    post={post}
                    currentUserId={currentUserId}
                    currentUserAvatar={currentUserAvatar}
                    currentUsername={currentUsername}
                    onReplyCreated={onReplyCreated}
                    onDelete={onDelete}
                    currentUserIsAdmin={currentUserIsAdmin}
                />
            </div>
            
            {hasReplies && (
                <div className="w-full">
                    {post.replies!.map((reply) => (
                        <NestedPost
                            key={reply.id}
                            post={reply}
                            currentUserId={currentUserId}
                            currentUserAvatar={currentUserAvatar}
                            currentUsername={currentUsername}
                            onReplyCreated={onReplyCreated}
                            onDelete={onDelete}
                            level={level + 1}
                            currentUserIsAdmin={currentUserIsAdmin}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function PostDetailReplies({
    mainPost,
    initialReplies,
    ancestors = [],
    currentUserId,
    currentUsername,
    currentUserAvatar,
    currentUserIsAdmin,
}: PostDetailRepliesProps) {
    const [replies, setReplies] = useState<Post[]>(initialReplies);

    const handleReplyCreated = (newReply: any) => {
        const enrichedReply = {
            ...newReply,
            parent_author_username: newReply.parent?.author?.username || mainPost.author.username,
            isLiked: false,
            isReposted: false
        };
        setReplies(prev => [...prev, enrichedReply]);
    };

    const handleDeleteReply = (replyId: string) => {
        setReplies(prev => prev.filter(r => r.id !== replyId));
    };

    // Build hierarchical tree structure from flat replies
    const buildTree = (allReplies: Post[]) => {
        const map: Record<string, Post & { replies: Post[] }> = {};
        const roots: (Post & { replies: Post[] })[] = [];

        // 1. Initialize the map
        allReplies.forEach(reply => {
            map[reply.id] = { ...reply, replies: [] };
        });

        // 2. Build the hierarchy
        allReplies.forEach(reply => {
            const mapped = map[reply.id];
            if (reply.parent_id && reply.parent_id !== mainPost.id && map[reply.parent_id]) {
                map[reply.parent_id].replies.push(mapped);
            } else {
                roots.push(mapped);
            }
        });

        // 3. Sort root replies and their sub-replies chronologically by date
        const sortReplies = (list: (Post & { replies: Post[] })[]) => {
            list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            list.forEach(item => {
                if (item.replies && item.replies.length > 0) {
                    sortReplies(item.replies as any);
                }
            });
        };

        sortReplies(roots);
        return roots;
    };

    const tree = useMemo(() => buildTree(replies), [replies]);

    return (
        <div className="w-full space-y-0.5">
            {/* Ancestors */}
            {ancestors.map((ancestor, index) => (
                <div key={ancestor.id} className="relative">
                    <PostCard
                        post={{
                            ...ancestor,
                            parent_author_username: index > 0 ? ancestors[index - 1].author.username : null
                        }}
                        currentUserId={currentUserId}
                        currentUserAvatar={currentUserAvatar}
                        currentUsername={currentUsername}
                        currentUserIsAdmin={currentUserIsAdmin}
                    />
                    {/* Visual Connector */}
                    <div className="absolute left-[24px] top-[44px] bottom-0 w-0.5 bg-border z-0" />
                </div>
            ))}

            {/* Main Post */}
            <div className="relative">
                <PostCard
                    post={{
                        ...mainPost,
                        parent_author_username: ancestors.length > 0 ? ancestors[ancestors.length - 1].author.username : null
                    }}
                    currentUserId={currentUserId}
                    currentUserAvatar={currentUserAvatar}
                    currentUsername={currentUsername}
                    onReplyCreated={handleReplyCreated}
                    isDetailPage={true}
                    currentUserIsAdmin={currentUserIsAdmin}
                />
            </div>

            {/* Replies Header */}
            {replies.length > 0 && (
                <div className="pt-6 pb-2 px-4 md:px-0">
                    <h2 className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                        <MessageCircle size={16} />
                        Respostas
                    </h2>
                </div>
            )}

            {/* Tree-based nested Replies List */}
            <div className="divide-y divide-border/40 border-t border-border/40 mt-2">
                {tree.map((rootReply) => (
                    <NestedPost
                        key={rootReply.id}
                        post={rootReply}
                        currentUserId={currentUserId}
                        currentUserAvatar={currentUserAvatar}
                        currentUsername={currentUsername}
                        onReplyCreated={handleReplyCreated}
                        onDelete={handleDeleteReply}
                        currentUserIsAdmin={currentUserIsAdmin}
                    />
                ))}
            </div>

            {replies.length === 0 && (
                <Card className="rounded-xl border-dashed bg-muted/20 shadow-none mt-6">
                    <CardContent className="p-12 text-center">
                        <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground text-sm">Ainda não há respostas para esta publicação.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
