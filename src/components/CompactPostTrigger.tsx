"use client";

import React, { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import UserAvatar from "@/components/UserAvatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Loader2,
    Play,
    Music,
    Paperclip
} from "lucide-react";
import { getMediaUrl, cn } from "@/lib/utils";

interface UserData {
    id: string;
    username: string;
    first_name: string | null;
    avatar_url: string | null;
}

interface CompactPostTriggerProps {
    onPostCreated?: (post: any) => void;
}

const MAX_CHARS = 240;

// Regex for YouTube and Spotify
const YOUTUBE_REGEX = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|live\/)([^#\&\?]*).*/;
const SPOTIFY_REGEX = /https?:\/\/open\.spotify\.com\/(track|album|playlist|artist|show|episode)\/[a-zA-Z0-9]+/;

export default function CompactPostTrigger({ onPostCreated }: CompactPostTriggerProps) {
    const [user, setUser] = useState<UserData | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    const [detectedLink, setDetectedLink] = useState<{ type: 'youtube' | 'spotify'; url: string; id?: string } | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const charsLeft = MAX_CHARS - content.length;
    const isOverLimit = charsLeft < 0;

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createBrowserClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("id, username, first_name, avatar_url")
                    .eq("id", session.user.id)
                    .single();

                if (profile) {
                    setUser(profile);
                }
            }
            setLoading(false);
        };

        fetchUser();
    }, []);

    // Link detection
    useEffect(() => {
        const lines = content.split('\n');
        let foundLink = null;

        for (const line of lines) {
            const words = line.split(/\s+/);
            for (const word of words) {
                if (word.startsWith('http')) {
                    const ytMatch = word.match(YOUTUBE_REGEX);
                    if (ytMatch && ytMatch[2].length === 11) {
                        foundLink = { type: 'youtube' as const, url: word, id: ytMatch[2] };
                        break;
                    }
                    const spMatch = word.match(SPOTIFY_REGEX);
                    if (spMatch) {
                        foundLink = { type: 'spotify' as const, url: word };
                        break;
                    }
                }
            }
            if (foundLink) break;
        }
        setDetectedLink(foundLink);
    }, [content]);

    // Auto-expand textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea && isExpanded) {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        }
    }, [content, isExpanded]);

    if (loading || !user) {
        return null;
    }

    const displayName = user.first_name || user.username;

    const handleSubmit = async () => {
        if (!content.trim() || isOverLimit || isSubmitting) return;

        setIsSubmitting(true);

        try {
            const finalContent = content.trim();

            const { createPostAction } = await import("@/app/actions/posts");
            const result = await createPostAction(finalContent);

            if (!result.success || !result.post) {
                throw new Error(result.error || "Erro desconhecido");
            }

            // Cleanup
            setContent("");
            setIsExpanded(false);

            if (result.xpBlocked) {
                const { toast } = await import("@/lib/toast");
                toast.error("Você está postando muito rápido! O ganho de XP para posts está pausado por 1 hora.");
            } else {
                const { showXPToast } = await import("@/lib/xp-toast");
                const { XP_CONFIG } = await import("@/config/xp");
                await showXPToast({
                    amount: XP_CONFIG.POST_PUBLISH.xp,
                    action: XP_CONFIG.POST_PUBLISH.action
                });
            }

            if (onPostCreated) {
                onPostCreated(result.post);
            } else {
                // If no callback, we might still need a refresh but let's favor router.refresh() 
                // over window.location.reload() if possible, or just do nothing if revalidate handled it.
                // For now, if no callback is provided, we just let it be (revalidatePath should handle it)
            }
        } catch (err: any) {
            console.error("Erro ao criar post:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="mb-4 shadow-none border-border">
            <CardContent className="p-3">
                <div className="flex gap-3">
                    <UserAvatar
                        src={user.avatar_url ? getMediaUrl(user.avatar_url, "avatars") : null}
                        alt={user.username}
                        size={36}
                        className="shrink-0"
                    />

                    {!isExpanded ? (
                        <div
                            className="flex-1 flex items-center cursor-pointer"
                            onClick={() => setIsExpanded(true)}
                        >
                            <span className="text-sm text-muted-foreground">
                                No que você está pensando, {displayName}?
                            </span>
                        </div>
                    ) : (
                        <div className="flex-1 space-y-4 min-w-0">
                            <Textarea
                                ref={textareaRef}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                onKeyDown={(e) => e.stopPropagation()}
                                placeholder="O que está acontecendo?"
                                className="resize-none border-none shadow-none p-0 focus-visible:ring-0 text-sm overflow-hidden min-h-0"
                                rows={1}
                                maxLength={240}
                                autoFocus
                            />

                            {/* Previews */}
                            <div className="space-y-2">
                                {/* YouTube Preview */}
                                {detectedLink?.type === 'youtube' && detectedLink.id && (
                                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-border">
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src={`https://www.youtube.com/embed/${detectedLink.id}`}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                )}

                                {/* Spotify Preview */}
                                {detectedLink?.type === 'spotify' && (
                                    <div className="rounded-xl overflow-hidden border border-border">
                                        <iframe
                                            src={detectedLink.url.replace("open.spotify.com/", "open.spotify.com/embed/")}
                                            width="100%"
                                            height="80"
                                            frameBorder="0"
                                            allow="encrypted-media"
                                        />
                                    </div>
                                )}

                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-border">
                                <div className="flex items-center gap-1">
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={cn(
                                        "text-xs font-medium tabular-nums",
                                        isOverLimit ? "text-destructive" : charsLeft <= 50 ? "text-yellow-500" : "text-muted-foreground"
                                    )}>
                                        {charsLeft}
                                    </span>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs"
                                            onClick={() => {
                                                setIsExpanded(false);
                                                setContent("");
                                            }}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="h-8 text-xs font-semibold px-4"
                                            disabled={!content.trim() || isOverLimit || isSubmitting}
                                            onClick={handleSubmit}
                                        >
                                            {isSubmitting ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                                            {isSubmitting ? "Publicando..." : "Publicar"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

