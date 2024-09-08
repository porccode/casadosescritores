"use client";
import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';

const getLocalISOString = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const parseLocalISOString = (isoString: string): Date => {
    if (!isoString) return new Date();
    if (isoString.includes('Z') || isoString.includes('+') || (isoString.includes('-') && isoString.split('-').length > 3)) {
        return new Date(isoString);
    }
    try {
        const [datePart, timePart] = isoString.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes] = timePart.split(':').map(Number);
        return new Date(year, month - 1, day, hours, minutes);
    } catch (e) {
        return new Date(isoString);
    }
};

/**
 * useEditorState.
 * 
 * Logic: Manages all form fields, loading states, and initial data fetching 
 * for existing series/chapters. Includes validation rules.
 */

interface StateProps {
    type: string;
    mode: string;
    existingId?: string;
    seriesId?: string;
}

export function useEditorState({ type, mode, existingId, seriesId }: StateProps) {
    const supabase = createBrowserClient();

    // Field States
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [genres, setGenres] = useState<string[]>([]);
    const [chapterNumber, setChapterNumber] = useState(1);
    const [isPinned, setIsPinned] = useState(false);
    const [expiresAt, setExpiresAt] = useState('');
    const [isExplicit, setIsExplicit] = useState(false);
    const [commentsEnabled, setCommentsEnabled] = useState(true);
    const [isAIGenerated, setIsAIGenerated] = useState('no');
    const [aiCoverGenerated, setAiCoverGenerated] = useState('no');
    const [copyrightType, setCopyrightType] = useState('all_rights_reserved');
    const [publishedAt, setPublishedAt] = useState(getLocalISOString(new Date()));
    const [authorNote, setAuthorNote] = useState('');
    const [relatedSeriesId, setRelatedSeriesId] = useState<string | null>(null);
    const [relatedTitle, setRelatedTitle] = useState('');
    const [relatedUrl, setRelatedUrl] = useState('');
    const [relatedBannerUrl, setRelatedBannerUrl] = useState('');

    // Series Specific
    const [seriesTitle, setSeriesTitle] = useState('');
    const [seriesDescription, setSeriesDescription] = useState('');
    const [seriesCategory, setSeriesCategory] = useState('');
    const [loadedSeriesId, setLoadedSeriesId] = useState<string | null>(seriesId || null);
    const [loadedAuthorId, setLoadedAuthorId] = useState<string | null>(null);
    const [coverUrl, setCoverUrl] = useState<string | null>(null);
    const [isFirstChapterCreation, setIsFirstChapterCreation] = useState(false);

    // Status States
    const [isDraft, setIsDraft] = useState(false);
    const [isSchedulingEnabled, setIsSchedulingEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Initial Load Logic
    useEffect(() => {
        async function load() {
            if (mode !== 'edit' || !existingId) return;
            setIsLoading(true);
            try {
                if (type === 'series') {
                    const { data } = await (supabase.from('series').select('*').eq('id', existingId).single() as any);
                    if (data) {
                        setLoadedSeriesId(data.id);
                        setTitle(data.title || '');
                        setDescription(data.description || '');
                        setCategory(data.genre || '');
                        setGenres(data.genres || (data.genre ? [data.genre] : []));
                        setAuthorNote(data.author_note || '');
                        setRelatedSeriesId(data.related_series_id || null);
                        setRelatedTitle(data.related_title || '');
                        setRelatedUrl(data.related_url || '');
                        setRelatedBannerUrl(data.related_banner_url || '');
                        setIsExplicit(data.is_explicit || false);
                        setCommentsEnabled(data.comments_enabled !== false);
                        const normalizeAI = (val: string | null | undefined) => {
                            if (!val) return 'no';
                            if (val === 'yes' || val === 'generated') return 'generated';
                            if (val === 'enhanced' || val === 'assisted') return 'assisted';
                            return 'no';
                        };
                        setIsAIGenerated(normalizeAI(data.is_ai_generated));
                        setAiCoverGenerated(normalizeAI(data.ai_cover_generated));
                        setCopyrightType(data.copyright_type || 'all_rights_reserved');
                        setLoadedAuthorId(data.author_id);
                        setCoverUrl(data.cover_url || null);
                        setIsDraft(data.is_draft || false);
                    }
                } else {
                    const { data, error } = await (supabase.from('chapters').select('*, series:series_id(title)').eq('id', existingId).single() as any);
                    if (error) {
                        console.error("[useEditorState] Error fetching chapter:", error);
                    }
                    if (data) {
                        console.log("[useEditorState] Chapter fetched successfully:", data.id);
                        console.log("[useEditorState] Content exists:", !!data.content, "type:", typeof data.content, "length:", data.content?.length);
                        const chData = data as any;
                        setTitle(chData.title || '');
                        setContent(chData.content || '');
                        setAuthorNote(chData.author_note || '');
                        setChapterNumber(chData.chapter_number || 1);
                        setIsDraft(chData.is_draft || false);
                        setLoadedSeriesId(chData.series_id);
                        setLoadedAuthorId(chData.author_id);
                        if (chData.series?.title) setSeriesTitle(chData.series.title);
                        if (chData.published_at) {
                            const pDate = new Date(chData.published_at);
                            if (pDate > new Date()) setIsSchedulingEnabled(true);
                            setPublishedAt(getLocalISOString(pDate));
                        }
                    } else {
                        console.warn("[useEditorState] No data found for chapter ID:", existingId);
                    }
                }
            } catch (err: any) {
                setError('Falha ao carregar conteúdo existente.');
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [mode, existingId, type, supabase]);

    // Synchronize scheduling and draft status reactively
    useEffect(() => {
        if (isSchedulingEnabled && isDraft) {
            setIsDraft(false);
        }
    }, [isSchedulingEnabled, isDraft]);

    useEffect(() => {
        if (isDraft && isSchedulingEnabled) {
            setIsSchedulingEnabled(false);
        }
    }, [isDraft, isSchedulingEnabled]);

    // Next Chapter Logic & Fetch Series Title for Breadcrumbs
    useEffect(() => {
        if (type !== 'chapter' || !loadedSeriesId) return;

        async function getSeriesInfo() {
            // Se for criação, pegamos o próximo número e o título da série
            if (mode === 'create') {
                const { data: chaptersData } = await supabase
                    .from('chapters')
                    .select('chapter_number')
                    .eq('series_id', loadedSeriesId)
                    .order('chapter_number', { ascending: false })
                    .limit(1)
                    .single();

                const lastNum = chaptersData ? (chaptersData as any).chapter_number : 0;
                // Se a série tem prólogo (lastNum = 0) ou nenhum capítulo (chaptersData nulo), o novo capítulo numérico é 1.
                // Se o último capítulo já é >= 1, incrementamos normalmente.
                const nextChapterNum = !chaptersData ? 1 : (lastNum === 0 ? 1 : lastNum + 1);
                setChapterNumber(nextChapterNum);
                
                // Set title only if it is currently empty, using a functional update to avoid dependencies
                setTitle(prevTitle => prevTitle ? prevTitle : `Capítulo ${nextChapterNum} - `);

                if (nextChapterNum === 1 && !chaptersData) {
                    setIsFirstChapterCreation(true);
                }
            }

            // Sempre buscamos o título da série se ainda não tivermos (para breadcrumbs)
            const { data: seriesData } = await (supabase
                .from('series')
                .select('title')
                .eq('id', loadedSeriesId)
                .single() as any);

            if (seriesData) {
                setSeriesTitle(prev => prev ? prev : seriesData.title);
            }
        }
        getSeriesInfo();
    }, [type, mode, loadedSeriesId, supabase]);

    const validateForm = useCallback((): boolean => {
        setError(null);
        if (!title.trim()) {
            setError(`Título é obrigatório.`);
            return false;
        }
        if (type === 'chapter' && !content) {
            setError('Conteúdo é obrigatório.');
            return false;
        }
        if (type === 'series' && (!genres || genres.length === 0)) {
            setError('Gênero é obrigatório.');
            return false;
        }
        if (type === 'chapter' && isSchedulingEnabled) {
            const schedDate = parseLocalISOString(publishedAt);
            if (schedDate.getTime() <= Date.now()) {
                setError('A data e horário do agendamento devem ser no futuro.');
                return false;
            }
        }
        return true;
    }, [title, content, genres, type, isSchedulingEnabled, publishedAt]);

    const resetForm = useCallback(() => {
        setTitle('');
        setContent('');
        setDescription('');
        setCategory('');
        setGenres([]);
        setAuthorNote('');
        setRelatedSeriesId(null);
        setRelatedTitle('');
        setRelatedUrl('');
        setRelatedBannerUrl('');
        setChapterNumber(1);
        setIsExplicit(false);
        setCommentsEnabled(true);
        setIsAIGenerated('no');
        setAiCoverGenerated('no');
        setCopyrightType('all_rights_reserved');
        setSuccess(null);
        setIsDraft(false);
        setIsSchedulingEnabled(false);
    }, []);

    return {
        title, setTitle, content, setContent, description, setDescription,
        category, setCategory, genres, setGenres, chapterNumber, setChapterNumber,
        isExplicit, setIsExplicit, commentsEnabled, setCommentsEnabled, isAIGenerated, setIsAIGenerated,
        aiCoverGenerated, setAiCoverGenerated,
        copyrightType, setCopyrightType, publishedAt, setPublishedAt,
        seriesTitle, setSeriesTitle, seriesDescription, setSeriesDescription,
        seriesCategory, setSeriesCategory, loadedSeriesId, setLoadedSeriesId,
        loadedAuthorId, isDraft, setIsDraft, isSchedulingEnabled, setIsSchedulingEnabled,
        isPinned, setIsPinned, expiresAt, setExpiresAt,
        isLoading, setIsLoading, isSaving, setIsSaving, isPublishing, setIsPublishing,
        isFirstChapterCreation, setIsFirstChapterCreation,
        error, setError, success, setSuccess, validateForm, resetForm,
        coverUrl,
        authorNote, setAuthorNote,
        relatedSeriesId, setRelatedSeriesId,
        relatedTitle, setRelatedTitle,
        relatedUrl, setRelatedUrl,
        relatedBannerUrl, setRelatedBannerUrl
    };
}
