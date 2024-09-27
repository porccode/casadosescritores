"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogTitle } from "@/components/ui/dialog";
import SeriesPreviewCard from "@/components/profile/SeriesPreviewCard";

interface CommentTextProps {
    text: string;
    className?: string;
}

// Regex patterns for YouTube URLs
const YOUTUBE_PATTERNS = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:[&\S]*)?/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?\S*)?/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\?\S*)?/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:\?\S*)?/,
];

// Regex for Spotify links
const SPOTIFY_PATTERN = /https?:\/\/open\.spotify\.com\/(track|album|playlist|artist|show|episode)\/([a-zA-Z0-9]+)(?:\?\S*)?/;

// Regex for GIF and Image links — kept for rendering legacy comments that may contain them
const IMAGE_PATTERNS = [
    /https?:\/\/(?:www\.)?media\.tenor\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.gif/,
    /https?:\/\/media(?:\d+)?\.giphy\.com\/media\/[a-zA-Z0-9_./-]+\.gif/,
    /https?:\/\/i\.giphy\.com\/[a-zA-Z0-9_./-]+\.gif/,
    /https?:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/attachments\/[^\s]+\.(webp|jpg|jpeg|png|gif|JPG|PNG|JPEG)/i,
];

// Regex for internal Series links
const SERIES_PATTERN = /(?:https?:\/\/)?(?:www\.)?(?:casadosescritores\.site|localhost:3000)\/series\/([a-zA-Z0-9_-]+)/i;

interface TextSegment {
    type: "text" | "youtube" | "spotify" | "media" | "link" | "mention" | "series";
    content: string;
    videoId?: string;
    spotifyUrl?: string;
    url?: string;
    mentionUsername?: string;
    seriesSlug?: string;
}

function extractYouTubeId(url: string): string | null {
    for (const pattern of YOUTUBE_PATTERNS) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

function extractSpotifyEmbed(url: string): string | null {
    const match = url.match(SPOTIFY_PATTERN);
    if (match) {
        return `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
    }
    return null;
}

function isMediaLink(url: string): boolean {
    return IMAGE_PATTERNS.some(pattern => pattern.test(url));
}

/** Split a plain text chunk into text + mention sub-segments */
function splitMentions(text: string): TextSegment[] {
    const result: TextSegment[] = [];
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = mentionRegex.exec(text)) !== null) {
        if (m.index > last) {
            result.push({ type: "text", content: text.slice(last, m.index) });
        }
        result.push({ type: "mention", content: m[0], mentionUsername: m[1] });
        last = m.index + m[0].length;
    }
    if (last < text.length) {
        result.push({ type: "text", content: text.slice(last) });
    }
    return result;
}

function parseText(text: string): TextSegment[] {
    const segments: TextSegment[] = [];
    const urlRegex = /https?:\/\/[^\s]+/g;

    let lastIndex = 0;
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
        const url = match[0];

        // Add text before the URL (with mention splitting)
        if (match.index > lastIndex) {
            segments.push(...splitMentions(text.slice(lastIndex, match.index)));
        }

        const videoId = extractYouTubeId(url);
        const spotifyEmbed = extractSpotifyEmbed(url);
        const isMedia = isMediaLink(url);
        const seriesMatch = url.match(SERIES_PATTERN);

        if (videoId) {
            segments.push({ type: "youtube", content: url, videoId, url });
        } else if (spotifyEmbed) {
            segments.push({ type: "spotify", content: url, spotifyUrl: spotifyEmbed, url });
        } else if (isMedia) {
            segments.push({ type: "media", content: url, url });
        } else if (seriesMatch) {
            segments.push({ type: "series", content: url, seriesSlug: seriesMatch[1], url });
        } else {
            segments.push({ type: "link", content: url, url });
        }

        // If we just added a "hidden" segment (one that won't render in the p tag),
        // we should trim the trailing and leading whitespace around it to avoid gaps.
        const currentSegment = segments[segments.length - 1];
        const isHidden = ["youtube", "spotify", "media", "series"].includes(currentSegment.type);

        if (isHidden) {
            // Trim PREVIOUS text segment
            const prevSegment = segments[segments.length - 2];
            if (prevSegment && prevSegment.type === "text") {
                prevSegment.content = prevSegment.content.trimEnd();
            }
        }

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        let remainingText = text.slice(lastIndex);

        // If the LAST added segment was hidden, trim leading whitespace from remaining text
        const lastAdded = segments[segments.length - 1];
        if (lastAdded && ["youtube", "spotify", "media", "series"].includes(lastAdded.type)) {
            remainingText = remainingText.trimStart();
        }

        if (remainingText) {
            segments.push(...splitMentions(remainingText));
        }
    }

    return segments;
}

export default function CommentText({ text, className }: CommentTextProps) {
    const sanitizedText = useMemo(() => {
        if (!text) return "";
        return text
            .replace(/(\r\n|\r|\n)/g, '\n') // Normaliza
            .replace(/\n\s*\n\s*\n+/g, '\n\n') // Colapsa múltiplos enters
            .trim(); // Remove do início e fim
    }, [text]);

    const segments = useMemo(() => parseText(sanitizedText), [sanitizedText]);

    const mediaSegments = segments.filter(s => s.type !== "text" && s.type !== "link" && s.type !== "mention");

    return (
        <div className={cn("flex flex-col gap-1", className)}>
            <p className="text-sm text-foreground leading-snug break-words whitespace-pre-wrap m-0">
                {segments.map((segment, index) => {
                    if (segment.type === "text") {
                        return <span key={index}>{segment.content}</span>;
                    }

                    // Mention: @username → clickable profile link
                    if (segment.type === "mention" && segment.mentionUsername) {
                        return (
                            <a
                                key={index}
                                href={`/profile/${segment.mentionUsername}`}
                                className="font-semibold text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {segment.content}
                            </a>
                        );
                    }

                    // For common links, keep them in text
                    if (segment.type === "link") {
                        return (
                            <a
                                key={index}
                                href={segment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline break-all"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {segment.content}
                            </a>
                        );
                    }

                    // For detected media (YT, Spotify, Image, Series), we hide the link in the text body
                    // to prevent redundancy, as it will be rendered below.
                    return null;
                })}
            </p>

            {mediaSegments.length > 0 && (
                <div className="flex flex-col gap-3 mt-2">
                    {mediaSegments.map((segment, index) => {
                        // YouTube
                        if (segment.type === "youtube" && segment.videoId) {
                            return (
                                <div key={index} className="relative w-full max-w-lg aspect-video overflow-hidden rounded-xl border border-border bg-black shadow-sm">
                                    <iframe
                                        className="absolute inset-0 h-full w-full"
                                        src={`https://www.youtube.com/embed/${segment.videoId}?rel=0`}
                                        title="YouTube video"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                    />
                                </div>
                            );
                        }

                        // Spotify
                        if (segment.type === "spotify" && segment.spotifyUrl) {
                            return (
                                <div key={index} className="w-full max-w-lg rounded-xl overflow-hidden border border-border mt-1">
                                    <iframe
                                        src={segment.spotifyUrl}
                                        width="100%"
                                        height="80"
                                        frameBorder="0"
                                        allow="encrypted-media"
                                        className="bg-transparent"
                                    />
                                </div>
                            );
                        }

                        // Media (GIF/Supabase Image)
                        if (segment.type === "media" && segment.url) {
                            return (
                                <div key={index} className="w-full">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <div
                                                className="relative w-[40%] cursor-pointer overflow-hidden rounded-xl border border-border hover:border-primary/30 transition-colors group"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <img
                                                    src={segment.url}
                                                    alt="Post Media"
                                                    className="w-full h-auto object-contain transition-transform group-hover:scale-[1.02]"
                                                    loading="lazy"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                                            </div>
                                        </DialogTrigger>
                                        <DialogContent hideClose className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden border-none bg-transparent shadow-none flex items-center justify-center">
                                            <VisuallyHidden>
                                                <DialogTitle>Visualização de Imagem</DialogTitle>
                                            </VisuallyHidden>
                                            <div className="relative w-full h-full flex items-center justify-center p-4 group/modal">
                                                <img
                                                    src={segment.url}
                                                    alt="Full size media"
                                                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                                                />
                                                <DialogClose className="absolute top-6 right-6 h-10 w-10 flex items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-all focus:outline-none z-50">
                                                    <X className="h-6 w-6" strokeWidth={3} />
                                                    <span className="sr-only">Fechar</span>
                                                </DialogClose>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            );
                        }
                        
                        // Internal Series Preview URL
                        if (segment.type === "series" && segment.seriesSlug) {
                            return <SeriesPreviewCard key={index} slug={segment.seriesSlug} />;
                        }

                        return null;
                    })}
                </div>
            )}
        </div>
    );
}
