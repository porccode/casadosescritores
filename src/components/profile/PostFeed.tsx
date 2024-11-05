"use client";

import React, { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { Loader2 } from "lucide-react";
import PostCard from "./PostCard";
import CompactPostTrigger from "@/components/CompactPostTrigger";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadMoreButton } from "@/components/ui/LoadMoreButton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PostFeedProps {
  profileId: string;
  isOwnProfile: boolean;
  currentUserId?: string | null;
  currentUserAvatar?: string | null;
  currentUsername?: string;
  currentUserIsAdmin?: boolean;
  canPost?: boolean;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  like_count: number;
  repost_count: number;
  reply_count: number;
  author: {
    id: string;
    username: string;
    avatar_url?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    subscription_plan?: string | null;
  };
  isLiked?: boolean;
  isReposted?: boolean;
}

interface Activity {
  id: string;
  type: "like" | "repost" | "reply";
  created_at: string;
  post: {
    id: string;
    content: string;
    created_at: string;
    like_count?: number;
    repost_count?: number;
    reply_count?: number;
    author: {
      id: string;
      username: string;
      avatar_url?: string | null;
      first_name?: string | null;
      last_name?: string | null;
    };
  };
  replyContent?: string;
}

interface TimelineItem {
  type: "post" | "activity";
  data: Post | Activity;
  sortDate: string;
}

interface ProfileData {
  username: string;
  first_name?: string | null;
  last_name?: string | null;
}

const ITEMS_PER_PAGE = 10;

export default function PostFeed({
  profileId,
  isOwnProfile,
  currentUserId,
  currentUserAvatar,
  currentUsername,
  currentUserIsAdmin = false,
  canPost = false,
}: PostFeedProps) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const supabase = createBrowserClient();

  useEffect(() => {
    loadTimeline(true);
  }, [profileId]);

  const loadTimeline = async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
      setTimeline([]);
      setOffset(0);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      if (isInitial) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, first_name, last_name")
          .eq("id", profileId)
          .single();
        setProfileData(profile);
      }

      const currentOffset = isInitial ? 0 : offset;

      const { data, error: rpcError } = await (supabase.rpc as any)('get_user_timeline', {
        p_user_id: profileId,
        p_limit: ITEMS_PER_PAGE + 1,
        p_offset: currentOffset
      });

      if (rpcError) throw rpcError;

      const timelineData = data as any[];
      const hasMoreItems = timelineData.length > ITEMS_PER_PAGE;
      const itemsToProcess = hasMoreItems ? timelineData.slice(0, ITEMS_PER_PAGE) : timelineData;

      let enrichedItems: TimelineItem[] = [];
      const postIds = itemsToProcess.map((item: any) => item.id);

      let likedPostIds = new Set<string>();
      let repostedPostIds = new Set<string>();

      if (currentUserId && postIds.length > 0) {
        const [userLikesRes, userRepostsRes] = await Promise.all([
          (supabase as any)
            .from("post_likes")
            .select("post_id")
            .eq("user_id", currentUserId)
            .in("post_id", postIds),
          (supabase as any)
            .from("post_reposts")
            .select("post_id")
            .eq("user_id", currentUserId)
            .in("post_id", postIds),
        ]);

        (userLikesRes.data as any[])?.forEach(l => likedPostIds.add(l.post_id));
        (userRepostsRes.data as any[])?.forEach(r => repostedPostIds.add(r.post_id));
      }

      enrichedItems = itemsToProcess.map((item: any) => {
        const author = {
          id: item.author_id,
          username: item.author_username,
          avatar_url: item.author_avatar_url,
          first_name: item.author_first_name,
          last_name: item.author_last_name,
        };

        if (item.item_type === "post") {
          return {
            type: "post",
            data: {
              id: item.id,
              content: item.content,
              created_at: item.created_at,
              like_count: Number(item.like_count),
              repost_count: Number(item.repost_count),
              reply_count: Number(item.reply_count) || 0,
              author,
              isLiked: likedPostIds.has(item.id),
              isReposted: repostedPostIds.has(item.id),
            } as Post,
            sortDate: item.created_at,
          };
        } else {
          return {
            type: "activity",
            data: {
              id: item.activity_id,
              type: item.activity_type as "like" | "repost" | "reply",
              created_at: item.activity_created_at,
              post: {
                id: item.id,
                content: item.content,
                created_at: item.created_at,
                author,
                like_count: Number(item.like_count),
                repost_count: Number(item.repost_count),
                reply_count: Number(item.reply_count) || 0,
              },
              replyContent: item.reply_content,
            } as Activity,
            sortDate: item.activity_created_at,
          };
        }
      });

      setTimeline((prev) => (isInitial ? enrichedItems : [...prev, ...enrichedItems]));
      setHasMore(hasMoreItems);
      setOffset(currentOffset + ITEMS_PER_PAGE);
    } catch (err: any) {
      console.error("Erro ao carregar timeline:", err);
      setError("Erro ao carregar publicações");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handlePostCreated = (newPost: Post) => {
    setTimeline((prev) => [
      { type: "post", data: newPost, sortDate: newPost.created_at },
      ...prev,
    ]);
  };

  const handleReplyCreated = (newReply: any) => {
    setTimeline((prev) => [
      {
        type: "activity",
        data: {
          id: newReply.id,
          type: "reply",
          created_at: newReply.created_at,
          post: newReply.parent || newReply,
          replyContent: newReply.content
        } as Activity,
        sortDate: newReply.created_at
      },
      ...prev,
    ]);
  };

  const handlePostDeleted = (postId: string) => {
    setTimeline((prev) =>
      prev.filter((item) => !(item.type === "post" && (item.data as Post).id === postId))
    );
  };

  const getDisplayName = () => {
    if (!profileData) return "";
    return profileData.first_name || profileData.last_name
      ? `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim()
      : profileData.username;
  };

  return (
    <div className="w-full">
      {isOwnProfile && currentUserId && currentUsername && (
        <div className="mb-3">
          <CompactPostTrigger onPostCreated={handlePostCreated} />
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-muted-foreground text-sm mt-2">Carregando publicações...</p>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : timeline.length === 0 ? (
        <Card className="rounded-xl border-border shadow-none">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground text-sm">
              {isOwnProfile
                ? "Você ainda não fez nenhuma publicação."
                : "Este usuário ainda não tem atividades."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm divide-y overflow-hidden">
          {timeline.map((item, idx) => {
            if (item.type === "post") {
              const post = item.data as Post;
              return (
                <PostCard
                  key={`post-${post.id}-${idx}`}
                  post={post}
                  currentUserId={currentUserId}
                  currentUserAvatar={currentUserAvatar}
                  currentUsername={currentUsername}
                  currentUserIsAdmin={currentUserIsAdmin}
                  onDelete={handlePostDeleted}
                  onReplyCreated={handleReplyCreated}
                />
              );
            }

            const activity = item.data as Activity;
            const actorName = isOwnProfile ? "Você" : getDisplayName();

            return (
              <PostCard
                key={`activity-${activity.id}-${activity.type}-${idx}`}
                post={{
                  ...activity.post,
                  like_count: activity.post.like_count ?? 0,
                  repost_count: activity.post.repost_count ?? 0,
                  reply_count: activity.post.reply_count ?? 0,
                  isLiked: false,
                  isReposted: false,
                }}
                activity={{
                  type: activity.type,
                  actorName,
                  replyContent: activity.replyContent,
                }}
              />
            );
          })}

          {hasMore && (
            <div className="p-4 flex justify-center">
              <LoadMoreButton
                onClick={() => loadTimeline()}
                loading={loadingMore}
                label="Carregar mais"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
