"use client";

import { useMemo } from 'react';

/**
 * useEditorStats.
 * 
 * Logic: Calculates word count, character count, and estimated reading time 
 * from various content formats (HTML, JSON, or plain text).
 */

function extractTextFromJSON(node: any): string {
    if (!node) return '';
    if (node.type === 'text') return node.text || '';
    if (Array.isArray(node.content)) {
        return node.content.map(extractTextFromJSON).join(' ');
    }
    if (node.content && typeof node.content === 'object') {
        return extractTextFromJSON(node.content);
    }
    return '';
}

export function useEditorStats(content: any) {
    const stats = useMemo(() => {
        if (!content) {
            return { wordCount: 0, charCount: 0, readingTime: 0 };
        }

        let plainText = '';

        if (typeof content === 'string') {
            if (!content.includes('<') && !content.startsWith('{')) {
                plainText = content;
            } else if (content.startsWith('{') || content.startsWith('[')) {
                try {
                    const json = JSON.parse(content);
                    plainText = extractTextFromJSON(json);
                } catch (e) {
                    plainText = content.replace(/<[^>]*>/g, '');
                }
            } else {
                plainText = content.replace(/<[^>]*>/g, '');
            }
        } else if (typeof content === 'object') {
            plainText = extractTextFromJSON(content);
        }

        const charCount = plainText.length;
        const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
        const readingTime = wordCount > 0 ? Math.ceil(wordCount / 200) : 0;

        return {
            wordCount,
            charCount,
            readingTime: Math.max(1, readingTime)
        };
    }, [content]);

    return stats;
}
