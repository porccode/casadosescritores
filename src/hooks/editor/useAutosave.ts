"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';

/**
 * useAutosave.
 *
 * Autosave local (localStorage cada 30s) + remoto (Supabase cada 2min).
 * Oferece restauração automática ao abrir o editor com rascunho mais recente.
 */

interface AutosaveConfig {
    chapterId?: string;
    content: any;
    title: string;
    enabled: boolean;
}

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'recovered';

interface AutosaveReturn {
    status: AutosaveStatus;
    lastSavedAt: Date | null;
    hasPendingRecovery: boolean;
    recoveredContent: any | null;
    recoveredTitle: string | null;
    acceptRecovery: () => void;
    dismissRecovery: () => void;
    forceSave: (source?: 'manual' | 'publish') => Promise<void>;
}

function getLocalKey(chapterId: string) {
    return `autosave_chapter_${chapterId}`;
}

function countWords(content: any): number {
    if (!content) return 0;
    if (typeof content === 'string') return content.split(/\s+/).filter(Boolean).length;
    // TipTap JSON
    try {
        const text = JSON.stringify(content);
        const stripped = text.replace(/"type":"[^"]+"/g, '').replace(/[{}[\]",]/g, ' ');
        return stripped.split(/\s+/).filter((w: string) => w.length > 1).length;
    } catch {
        return 0;
    }
}

export function useAutosave({ chapterId, content, title, enabled }: AutosaveConfig): AutosaveReturn {
    const supabase = createBrowserClient();
    const [status, setStatus] = useState<AutosaveStatus>('idle');
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [hasPendingRecovery, setHasPendingRecovery] = useState(false);
    const [recoveredContent, setRecoveredContent] = useState<any | null>(null);
    const [recoveredTitle, setRecoveredTitle] = useState<string | null>(null);

    const contentRef = useRef(content);
    const titleRef = useRef(title);
    const lastSavedContentRef = useRef<string>('');
    const isInitializedRef = useRef(false);

    // Manter refs atualizados
    useEffect(() => { contentRef.current = content; }, [content]);
    useEffect(() => { titleRef.current = title; }, [title]);

    const contentHash = useCallback((c: any) => {
        try { return JSON.stringify(c); } catch { return ''; }
    }, []);

    const hasChanges = useCallback(() => {
        return contentHash(contentRef.current) !== lastSavedContentRef.current;
    }, [contentHash]);

    // Verificar recuperação ao montar (apenas para capítulos existentes)
    useEffect(() => {
        if (!chapterId || !enabled || isInitializedRef.current) return;
        isInitializedRef.current = true;

        try {
            const stored = localStorage.getItem(getLocalKey(chapterId));
            if (!stored) return;

            const parsed = JSON.parse(stored);
            const localTimestamp = new Date(parsed.timestamp);
            const now = new Date();
            const ageHours = (now.getTime() - localTimestamp.getTime()) / (1000 * 60 * 60);

            // Ignorar se mais de 48h
            if (ageHours > 48) {
                localStorage.removeItem(getLocalKey(chapterId));
                return;
            }

            // Só oferecer recuperação se o conteúdo local for diferente do atual
            if (parsed.content && contentHash(parsed.content) !== contentHash(content)) {
                setRecoveredContent(parsed.content);
                setRecoveredTitle(parsed.title || null);
                setHasPendingRecovery(true);
            }
        } catch {
            // localStorage corrompido, limpar
            if (chapterId) localStorage.removeItem(getLocalKey(chapterId));
        }
    }, [chapterId, enabled, content, contentHash]);

    // Autosave LOCAL a cada 30s
    useEffect(() => {
        if (!chapterId || !enabled) return;

        const interval = setInterval(() => {
            if (!hasChanges()) return;

            try {
                const data = {
                    content: contentRef.current,
                    title: titleRef.current,
                    timestamp: new Date().toISOString(),
                };
                localStorage.setItem(getLocalKey(chapterId), JSON.stringify(data));
            } catch {
                // localStorage cheio, ignorar silenciosamente
            }
        }, 30_000);

        return () => clearInterval(interval);
    }, [chapterId, enabled, hasChanges]);

    // Autosave REMOTO a cada 2min
    useEffect(() => {
        if (!chapterId || !enabled) return;

        const interval = setInterval(async () => {
            if (!hasChanges()) return;

            setStatus('saving');
            try {
                const currentContent = contentRef.current;
                const { error } = await (supabase as any)
                    .from('chapter_versions')
                    .insert({
                        chapter_id: chapterId,
                        content: currentContent,
                        title: titleRef.current,
                        word_count: countWords(currentContent),
                        source: 'autosave',
                    });

                if (error) throw error;

                lastSavedContentRef.current = contentHash(currentContent);
                setLastSavedAt(new Date());
                setStatus('saved');

                // Limpar autosave local após salvar remotamente
                try {
                    localStorage.removeItem(getLocalKey(chapterId));
                } catch { /* ignore */ }
            } catch {
                setStatus('error');
            }
        }, 120_000);

        return () => clearInterval(interval);
    }, [chapterId, enabled, hasChanges, contentHash, supabase]);

    const acceptRecovery = useCallback(() => {
        setHasPendingRecovery(false);
        setStatus('recovered');
        // O componente pai deve usar recoveredContent para atualizar o editor
    }, []);

    const dismissRecovery = useCallback(() => {
        setHasPendingRecovery(false);
        setRecoveredContent(null);
        setRecoveredTitle(null);
        if (chapterId) {
            try { localStorage.removeItem(getLocalKey(chapterId)); } catch { /* ignore */ }
        }
    }, [chapterId]);

    const forceSave = useCallback(async (source: 'manual' | 'publish' = 'manual') => {
        if (!chapterId || !contentRef.current) return;

        setStatus('saving');
        try {
            const { error } = await (supabase as any)
                .from('chapter_versions')
                .insert({
                    chapter_id: chapterId,
                    content: contentRef.current,
                    title: titleRef.current,
                    word_count: countWords(contentRef.current),
                    source,
                });

            if (error) throw error;

            lastSavedContentRef.current = contentHash(contentRef.current);
            setLastSavedAt(new Date());
            setStatus('saved');

            try { localStorage.removeItem(getLocalKey(chapterId)); } catch { /* ignore */ }
        } catch {
            setStatus('error');
        }
    }, [chapterId, contentHash, supabase]);

    return {
        status,
        lastSavedAt,
        hasPendingRecovery,
        recoveredContent,
        recoveredTitle,
        acceptRecovery,
        dismissRecovery,
        forceSave,
    };
}
