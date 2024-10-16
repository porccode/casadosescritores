"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Rss, Library, ListMusic, ChevronDown, Trophy, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProfileWorks from "./ProfileWorks";
import ProfilePlaylists from "./ProfilePlaylists";
import PostFeed from "./PostFeed";
import ProfileSidebar from "./ProfileSidebar";
import MobileProfileContent from "@/components/profile/MobileProfileContent";
import { GuestCTA } from "@/components/ui/GuestCTA";

interface ProfileContentManagerProps {
    profileId: string;
    isOwnProfile: boolean;
    currentUserId?: string;
    currentUserAvatar?: string;
    currentUsername?: string;
    canPost: boolean;
    profile: any;
    isAdmin?: boolean;
    featuredSeries?: any;
    commentsCount?: number;
}

export default function ProfileContentManager({
    profileId,
    isOwnProfile,
    currentUserId,
    currentUserAvatar,
    currentUsername,
    canPost,
    profile,
    isAdmin = false,
    featuredSeries,
    commentsCount
}: ProfileContentManagerProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "feed");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", value);
        router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
    };

    // Keep state in sync if URL changes (e.g. browser back)
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        } else if (!tab && activeTab !== "feed") {
            setActiveTab("feed");
        }
    }, [searchParams]);

    const profileName = profile.first_name || profile.username;
    const publicationsLabel = isOwnProfile ? "Séries" : `Séries`;

    return (
        <div className="w-full">
            {/* Mobile Layout */}
            <div className="md:hidden">
                <MobileProfileContent
                    profileId={profileId}
                    isOwnProfile={isOwnProfile}
                    currentUserId={currentUserId}
                    currentUserAvatar={currentUserAvatar}
                    currentUsername={currentUsername}
                    canPost={canPost}
                    profile={profile}
                    activeTab={activeTab}
                    setActiveTab={handleTabChange}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    publicationsLabel={publicationsLabel}
                    isAdmin={isAdmin}
                    commentsCount={commentsCount}
                />
            </div>

            {/* Desktop Layout - Original Grid */}
            <div className="hidden md:grid md:grid-cols-12 gap-8">
                {/* Sidebar */}
                <div className="md:col-span-4 md:sticky md:top-24 h-fit space-y-6">
                    <ProfileSidebar
                        profile={profile}
                        created_at={profile.created_at}
                        isOwnProfile={isOwnProfile}
                        featuredSeries={featuredSeries}
                        commentsCount={commentsCount}
                    >
                        {/* Desktop Navigation Menu */}
                        <Card className="bg-card border border-border shadow-sm rounded-xl">
                            <CardHeader className="pb-2 pt-4 px-4">
                                <CardTitle className="text-xs font-semibold text-muted-foreground">
                                    Navegação
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-2 pt-0">
                                <Tabs value={activeTab} onValueChange={handleTabChange} orientation="vertical">
                                    <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 gap-1">
                                        <TabsTrigger 
                                            value="feed" 
                                            className="w-full justify-start gap-3 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all duration-150 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-sm"
                                        >
                                            <Rss className="h-4 w-4 shrink-0" />
                                            Feed de posts
                                        </TabsTrigger>
                                        <TabsTrigger 
                                            value="publications" 
                                            className="w-full justify-start gap-3 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all duration-150 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-sm"
                                        >
                                            <Library className="h-4 w-4 shrink-0" />
                                            {isOwnProfile ? "Minhas séries" : `Séries de ${profileName}`}
                                        </TabsTrigger>
                                        <TabsTrigger 
                                            value="playlists" 
                                            className="w-full justify-start gap-3 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all duration-150 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-sm"
                                        >
                                            <ListMusic className="h-4 w-4 shrink-0" />
                                            Playlists
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </ProfileSidebar>
                </div>

                {/* Main Content */}
                <div className="md:col-span-8">
                    {activeTab === "feed" && (
                        currentUserId ? (
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
                                description={`Faça login para ver as postagens e interagir com ${profileName}.`}
                            />
                        )
                    )}

                    {activeTab === "publications" && (
                        <ProfileWorks profileId={profileId} isOwnProfile={isOwnProfile} isAdmin={isAdmin} />
                    )}

                    {activeTab === "playlists" && (
                        currentUserId ? (
                            <ProfilePlaylists isOwnProfile={isOwnProfile} profileId={profileId} />
                        ) : (
                            <GuestCTA
                                title="Playlists Privadas"
                                description={`As playlists de ${profileName} estão visíveis apenas para membros da comunidade.`}
                            />
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
