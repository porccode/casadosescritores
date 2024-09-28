"use client";

import React from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import Comments from "@/components/Comments";
import { MessageSquare } from "lucide-react";

interface InlineCommentsSidebarProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    blockId: string | null;
    storyId?: string;
    contentId?: string;
    contentType: string;
    userId?: string;
    authorId?: string;
    commentsEnabled?: boolean;
}

export default function InlineCommentsSidebar({
    open,
    onOpenChange,
    blockId,
    storyId,
    contentId,
    contentType,
    userId,
    authorId,
    commentsEnabled = true,
}: InlineCommentsSidebarProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md p-0 overflow-y-auto border-l border-border">
                <SheetHeader className="p-6 bg-muted/30 border-b border-border">
                    <SheetTitle className="flex items-center gap-2">
                        <MessageSquare size={18} className="text-primary" />
                        Comentários do Parágrafo
                    </SheetTitle>
                </SheetHeader>

                <div className="p-0">
                    <Comments
                        storyId={storyId}
                        contentId={contentId}
                        contentType={contentType}
                        userId={userId}
                        authorId={authorId}
                        // Props extras que precisamos passar/atualizar no Comments.tsx
                        // @ts-ignore
                        blockId={blockId}
                        isInline={true}
                        commentsEnabled={commentsEnabled}
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}
