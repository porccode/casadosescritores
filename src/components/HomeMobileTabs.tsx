"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface HomeMobileTabsProps {
    recentContent: React.ReactNode;
    mostCommented: React.ReactNode;
    feed: React.ReactNode;
}

export default function HomeMobileTabs({
    recentContent,
    mostCommented,
    feed,
}: HomeMobileTabsProps) {
    return (
        <Tabs defaultValue="recentes" className="lg:hidden w-full">
            <TabsList className="w-full h-10 mb-4">
                <TabsTrigger value="recentes" className="flex-1 text-xs font-semibold">
                    Recentes
                </TabsTrigger>
                <TabsTrigger value="comentados" className="flex-1 text-xs font-semibold">
                    Mais Comentados
                </TabsTrigger>
                <TabsTrigger value="feed" className="flex-1 text-xs font-semibold">
                    Feed
                </TabsTrigger>
            </TabsList>
            <TabsContent value="recentes" className="mt-0">
                {recentContent}
            </TabsContent>
            <TabsContent value="comentados" className="mt-0">
                {mostCommented}
            </TabsContent>
            <TabsContent value="feed" className="mt-0">
                {feed}
            </TabsContent>
        </Tabs>
    );
}
