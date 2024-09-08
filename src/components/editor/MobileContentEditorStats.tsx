"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';

interface MobileContentEditorStatsProps {
    wordCount: number;
    charCount: number;
}

export default function MobileContentEditorStats({ wordCount, charCount }: MobileContentEditorStatsProps) {
    return (
        <div className="flex justify-end px-4 mb-2">
            <Badge variant="secondary" className="px-3 py-1 bg-background border border-border shadow-sm text-[10px] font-bold uppercase tracking-tight flex items-center gap-3 h-8 rounded-lg">
                <div className="flex items-center gap-1">
                    <span className="text-muted-foreground/60">Palavras</span>
                    <span className="text-primary">{wordCount}</span>
                </div>
                <div className="w-px h-3 bg-border" />
                <div className="flex items-center gap-1">
                    <span className="text-muted-foreground/60">Chars</span>
                    <span className="text-primary">{charCount}</span>
                </div>
            </Badge>
        </div>
    );
}
