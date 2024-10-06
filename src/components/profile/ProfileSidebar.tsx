"use client";

import React from "react";
import {
    MapPin,
    Globe,
    Twitter,
    Facebook,
    Instagram,
    Calendar
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip";
import LevelProgress from "./LevelProgress";
import FeaturedWorkCard from "./FeaturedWorkCard";
import { ProfileAgeBadge } from "./ProfileAgeBadge";

interface Profile {
    id: string;
    bio?: string | null;
    location?: string | null;
    website_url?: string | null;
    twitter_url?: string | null;
    facebook_url?: string | null;
    instagram_url?: string | null;
    xp?: number | null;
    writer_xp?: number | null;
    reader_xp?: number | null;
    birth_date?: string | null;
    age_verified?: boolean | null;
    birth_date_change_count?: number | null;
    is_birth_date_public?: boolean | null;
}

interface ProfileSidebarProps {
    profile: Profile;
    created_at: string;
    isOwnProfile: boolean;
    featuredSeries?: any;
    commentsCount?: number;
}

const socialLinks = [
    { key: "website_url", icon: Globe, label: "Website" },
    { key: "twitter_url", icon: Twitter, label: "Twitter" },
    { key: "facebook_url", icon: Facebook, label: "Facebook" },
    { key: "instagram_url", icon: Instagram, label: "Instagram" },
] as const;

export default function ProfileSidebar({
    profile,
    created_at,
    isOwnProfile,
    featuredSeries,
    commentsCount,
    children,
}: ProfileSidebarProps & { children?: React.ReactNode }) {
    const memberSince = new Date(created_at).toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
    });

    const hasSocialLinks = socialLinks.some(
        (link) => profile[link.key as keyof Profile]
    );

    return (
        <div className="space-y-3">
            {featuredSeries && (
                <FeaturedWorkCard series={featuredSeries} />
            )}
            
            {children}

            <LevelProgress 
                profileId={profile.id}
                xp={profile.xp || 0} 
                writerXP={profile.writer_xp}
                readerXP={profile.reader_xp}
                commentsCount={commentsCount}
            />

            {/* Info Card - só mostra se há conteúdo */}
            {(profile.location || hasSocialLinks) && (
                <Card className="shadow-none">
                    <CardContent className="p-4 space-y-3">
                        {/* Location */}
                        {profile.location && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="size-4 shrink-0" />
                                <span>{profile.location}</span>
                            </div>
                        )}

                        {/* Social Links */}
                        {hasSocialLinks && (
                            <TooltipProvider>
                                <div className="flex items-center gap-1">
                                    {socialLinks.map((link) => {
                                        const url = profile[link.key as keyof Profile] as string | null;
                                        if (!url) return null;

                                        const Icon = link.icon;
                                        return (
                                            <Tooltip key={link.key}>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                        asChild
                                                    >
                                                        <a
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <Icon className="size-4" />
                                                            <span className="sr-only">{link.label}</span>
                                                        </a>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>{link.label}</TooltipContent>
                                            </Tooltip>
                                        );
                                    })}
                                </div>
                            </TooltipProvider>
                        )}
                    </CardContent>

                    <CardFooter className="px-4 py-3 border-t bg-muted/30 flex flex-col items-center gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground w-full justify-center">
                            <Calendar className="size-3" />
                            <span>Membro desde {memberSince}</span>
                        </div>
                        <ProfileAgeBadge profile={profile} isOwnProfile={isOwnProfile} />
                    </CardFooter>
                </Card>
            )}

            {/* Fallback: só membro desde, sem location/social */}
            {!profile.location && !hasSocialLinks && (
                <div className="flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground py-3 px-4 rounded-xl border border-border/50 bg-muted/20">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="size-3" />
                        <span>Membro desde {memberSince}</span>
                    </div>
                    <ProfileAgeBadge profile={profile} isOwnProfile={isOwnProfile} />
                </div>
            )}
        </div>
    );
}
