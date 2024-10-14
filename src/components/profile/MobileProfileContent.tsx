"use client";

import React from "react";
import { Rss, Library, ListMusic, ChevronDown, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import ProfileWorks from "@/components/profile/ProfileWorks";
import ProfilePlaylists from "@/components/profile/ProfilePlaylists";
import PostFeed from "@/components/profile/PostFeed";
import ProfileSidebar from "@/components/profile/ProfileSidebar";
import { GuestCTA } from "@/components/ui/GuestCTA";

interface MobileProfileContentProps {
    profileId: string;
    isOwnProfile: boolean;
    currentUserId?: string;
    currentUserAvatar?: string;
    currentUsername?: string;
    canPost: boolean;
    profile: any;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    publicationsLabel: string;
    isAdmin?: boolean;
    commentsCount?: number;
}

export default function MobileProfileContent({
    profileId,
    isOwnProfile,
    currentUserId,
    currentUserAvatar,
    currentUsername,
    canPost,
    profile,
    activeTab,
    setActiveTab,
    sidebarOpen,
    setSidebarOpen,
    publicationsLabel,
    isAdmin = false,
    commentsCount
}: MobileProfileContentProps) {
    return (
        <div className="space-y-4">
            {/* Collapsible Sidebar Info */}
            <Collapsible open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <CollapsibleTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full justify-between"
                    >
                        <span className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Progresso e Sobre
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                    <ProfileSidebar
                        profile={profile}
                        created_at={profile.created_at}
                        isOwnProfile={isOwnProfile}
                        commentsCount={commentsCount}
                    />
                </CollapsibleContent>
            </Collapsible>

            {/* Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="feed" className="gap-1.5 font-medium text-xs">
                        <Rss className="h-3.5 w-3.5" />
                        Feed
                    </TabsTrigger>
                    <TabsTrigger value="publications" className="gap-1.5 font-medium text-xs">
                        <Library className="h-3.5 w-3.5" />
                        {publicationsLabel}
                    </TabsTrigger>
                    <TabsTrigger value="playlists" className="gap-1.5 font-medium text-xs">
                        <ListMusic className="h-3.5 w-3.5" />
                        Playlists
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="feed" className="mt-4">
                    {currentUserId ? (
                        <PostFeed
                            profileId={profileId}
                            isOwnProfile={isOwnProfile}
                            currentUserId={currentUserId}
                            currentUserAvatar={currentUserAvatar}
                            currentUsername={currentUsername}
                            currentUserIsAdmin={isAdmin}
                            canPost={canPost}
                        />
                    ) : (
                        <GuestCTA
                            title="Feed Privado"
                            description={`Faça login para ver as postagens de ${profile.first_name || profile.username}.`}
                        />
                    )}
                </TabsContent>

                <TabsContent value="publications" className="mt-4">
                    <ProfileWorks profileId={profileId} isOwnProfile={isOwnProfile} isAdmin={isAdmin} />
                </TabsContent>

                <TabsContent value="playlists" className="mt-4">
                    {currentUserId ? (
                        <ProfilePlaylists isOwnProfile={isOwnProfile} profileId={profileId} />
                    ) : (
                        <GuestCTA
                            title="Playlists Privadas"
                            description={`As playlists de ${profile.first_name || profile.username} são exclusivas para membros.`}
                        />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
