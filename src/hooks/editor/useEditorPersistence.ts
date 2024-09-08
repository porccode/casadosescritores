"use client";

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-browser';
import { apiClient } from '@/lib/api-client';
import { showXPToast } from '@/lib/xp-toast';
import { XP_CONFIG } from '@/config/xp';
import { toast } from '@/lib/toast';
import { generateSlug } from '@/lib/utils';
import type { ContentSubmitResult } from '@/types/content.types';

/**
 * useEditorPersistence.
 * 
 * Logic: Manages the lifecycle of content (Series/Chapter), including 
 * saving drafts, publishing, and deleting. Orchestrates Supabase calls 
 * and XP/Notification triggers.
 */

interface PersistenceProps {
    state: any;
    media: any;
    type: string;
    mode: string;
    existingId?: string;
}

export function useEditorPersistence({ state, media, type, mode, existingId }: PersistenceProps) {
    const router = useRouter();
    const supabase = createBrowserClient();

    const submitSeries = async (userId: string, targetIsDraft?: boolean): Promise<ContentSubmitResult> => {
        const isEditing = mode === 'edit';
        const coverUrl = await media.uploadCover(userId);

        let wasDraft = false;
        if (isEditing && existingId) {
            try {
                const { data: currentSeries } = await (supabase
                    .from('series')
                    .select('is_draft')
                    .eq('id', existingId)
                    .single() as any);
                wasDraft = (currentSeries as any)?.is_draft === true;
            } catch (err) {
                console.error("Erro ao verificar draft da série:", err);
            }
        }

        const payload = isEditing
            ? {
                id: existingId,
                title: state.title.trim(),
                description: state.description.trim(),
                genre: state.genres[0] || state.category,
                genres: state.genres,
                author_note: state.authorNote,
                related_series_id: state.relatedSeriesId,
                related_title: state.relatedTitle,
                related_url: state.relatedUrl,
                related_banner_url: state.relatedBannerUrl,
                cover_url: coverUrl,
                work_type: 'series',
                is_completed: false,
                is_explicit: state.isExplicit,
                comments_enabled: state.commentsEnabled,
                is_ai_generated: state.isAIGenerated,
                ai_cover_generated: state.aiCoverGenerated,
                copyright_type: state.copyrightType,
                is_draft: targetIsDraft
            }
            : {
                title: state.title.trim(),
                description: state.description.trim(),
                genre: state.genres[0] || state.category,
                genres: state.genres,
                author_note: state.authorNote,
                related_series_id: state.relatedSeriesId,
                related_title: state.relatedTitle,
                related_url: state.relatedUrl,
                related_banner_url: state.relatedBannerUrl,
                author_id: userId,
                cover_url: coverUrl,
                work_type: 'series',
                is_completed: false,
                is_explicit: state.isExplicit,
                comments_enabled: state.commentsEnabled,
                is_ai_generated: state.isAIGenerated,
                ai_cover_generated: state.aiCoverGenerated,
                copyright_type: state.copyrightType,
                is_draft: targetIsDraft
            };

        const data = await apiClient.request<{ series: any; isFirstBook?: boolean }>('/api/series', {
            method: isEditing ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const seriesIdResult = isEditing ? existingId : data.series?.id;
        const actualTargetIsDraft = targetIsDraft === true;
        const shouldNotify = (!isEditing && !actualTargetIsDraft) || (isEditing && wasDraft && !actualTargetIsDraft);

        if (shouldNotify && seriesIdResult) {
            try {
                await fetch('/api/notifications/notify-followers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contentType: 'series',
                        contentId: seriesIdResult,
                        contentTitle: state.title,
                    }),
                });
            } catch (err) {
                console.error("Erro ao disparar notificações de nova série:", err);
            }
        }

        if (isEditing) {
            showXPToast({ amount: XP_CONFIG.SERIES_EDIT.xp, ...XP_CONFIG.SERIES_EDIT, message: 'Série atualizada!' });
        } else if (data.isFirstBook) {
            showXPToast({ amount: 0, action: 'Primeiro livro gratuito', type: 'writer', message: '✨ Primeiro livro criado gratuitamente!' });
        } else {
            showXPToast({ amount: XP_CONFIG.SERIES_CREATE.xp, ...XP_CONFIG.SERIES_CREATE, message: 'Série criada! (-500 XP)' });
        }

        router.refresh();
        const slug = generateSlug(state.title.trim(), seriesIdResult);

        return {
            success: true,
            message: isEditing ? 'Série atualizada com sucesso!' : 'Série criada com sucesso!',
            data: { id: seriesIdResult, title: state.title, slug, isFirstBook: data.isFirstBook },
        };
    };

    const submitChapter = async (userId: string, targetIsDraft: boolean): Promise<ContentSubmitResult> => {
        const isEditing = mode === 'edit';

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

        let finalPublishedAt = new Date().toISOString();
        if (!targetIsDraft) {
            finalPublishedAt = state.isSchedulingEnabled && state.publishedAt
                ? parseLocalISOString(state.publishedAt).toISOString()
                : new Date().toISOString();
        } else {
            finalPublishedAt = state.publishedAt 
                ? parseLocalISOString(state.publishedAt).toISOString() 
                : new Date().toISOString();
        }
        // Sanitize Content: remove extra empty paragraphs at top/bottom and collapse consecutive empty paragraphs
        let sanitizedContent = state.content;
        let isSanitized = false;

        if (sanitizedContent && typeof sanitizedContent === 'object' && Array.isArray(sanitizedContent.content)) {
            const isNodeEmpty = (node: any) => {
                if (!node) return true;
                // Consideramos headings vazios como lixo também
                if (node.type !== 'paragraph' && !node.type?.startsWith('heading')) return false;
                if (!node.content || node.content.length === 0) return true;

                let allEmpty = true;
                for (const child of node.content) {
                    if (child.type === 'hardBreak') continue;
                    if (child.type === 'text') {
                        // Ignora espaços normais, non-breaking spaces, zero-width spaces...
                        if (child.text && child.text.replace(/[\s\u00A0\u200B\u200C\u200D\uFEFF]/g, '').length > 0) {
                            allEmpty = false;
                            break;
                        }
                    } else {
                        allEmpty = false;
                        break;
                    }
                }
                return allEmpty;
            };

            const arr = sanitizedContent.content;
            let start = 0;
            while (start < arr.length && isNodeEmpty(arr[start])) start++;

            let end = arr.length - 1;
            while (end >= start && isNodeEmpty(arr[end])) end--;

            const middle = start <= end ? arr.slice(start, end + 1) : [];
            const collapsed = [];
            let emptyCount = 0;

            for (const node of middle) {
                if (isNodeEmpty(node)) {
                    emptyCount++;
                    if (emptyCount <= 1) collapsed.push({ type: 'paragraph' });
                } else {
                    emptyCount = 0;
                    collapsed.push(node);
                }
            }
            if (collapsed.length === 0) collapsed.push({ type: 'paragraph' });

            sanitizedContent = { ...sanitizedContent, content: collapsed };
            // Só marcamos como sanitizado se as quantidades diferirem ou se garantimos que passamos no filtro
            isSanitized = true;
        }

        let wasDraft = false;
        if (isEditing && existingId) {
            try {
                const { data: currentChapter } = await (supabase
                    .from('chapters')
                    .select('is_draft')
                    .eq('id', existingId)
                    .single() as any);
                wasDraft = (currentChapter as any)?.is_draft === true;
            } catch (err) {
                console.error("Erro ao verificar draft do capítulo:", err);
            }
        }

        const payload = isEditing
            ? { id: existingId, title: state.title.trim(), content: sanitizedContent, chapter_number: state.chapterNumber, published_at: finalPublishedAt, is_draft: targetIsDraft, author_note: state.authorNote }
            : { title: state.title.trim(), content: sanitizedContent, chapter_number: state.chapterNumber, series_id: state.loadedSeriesId, author_id: userId, published_at: finalPublishedAt, is_draft: targetIsDraft, author_note: state.authorNote };

        const data = await apiClient.request<{ chapter: any, isFirstChapter?: boolean, isFirstBook?: boolean }>('/api/chapters', {
            method: isEditing ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        // Atualiza a visualização local do editor imediatamente se houve sanitização, para que espaços vazios desapareçam da tela
        if (isSanitized) {
            state.setContent?.(sanitizedContent);
        }

        const chapterResult = data.chapter;
        const targetSeriesId = state.loadedSeriesId || chapterResult?.series_id;
        const shouldNotify = (!isEditing && !targetIsDraft) || (isEditing && wasDraft && !targetIsDraft);

        if (shouldNotify && chapterResult) {
            try {
                const { data: sData } = await (supabase.from('series').select('title').eq('id', targetSeriesId).single() as any);
                await fetch('/api/notifications/notify-followers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contentType: 'chapter',
                        contentId: chapterResult.id,
                        contentTitle: state.title,
                        seriesId: targetSeriesId,
                        seriesTitle: (sData as any)?.title,
                    }),
                });
            } catch (err) {
                console.error("Erro ao disparar notificações de novo capítulo:", err);
            }
            if (data.isFirstBook) {
                showXPToast({ amount: XP_CONFIG.FIRST_BOOK_CHAPTER.xp, ...XP_CONFIG.FIRST_BOOK_CHAPTER, message: `✨ Capítulo publicado! (+${XP_CONFIG.FIRST_BOOK_CHAPTER.xp} XP)` });
            } else {
                showXPToast({ amount: XP_CONFIG.CHAPTER_PUBLISH.xp, ...XP_CONFIG.CHAPTER_PUBLISH, message: 'Capítulo publicado! (-50 XP)' });
            }
        } else if (isEditing) {
            showXPToast({ amount: XP_CONFIG.CHAPTER_EDIT.xp, ...XP_CONFIG.CHAPTER_EDIT, message: 'Capítulo atualizado!' });
        } else {
            toast.success('Capítulo publicado com sucesso!');
        }

        router.refresh();
        const cId = chapterResult?.id || existingId;
        const slug = generateSlug(state.title, cId);

        return {
            success: true,
            message: isEditing ? 'Capítulo atualizado com sucesso!' : 'Capítulo criado com sucesso!',
            data: { id: cId, title: state.title, slug, isFirstChapter: data.isFirstChapter },
        };
    };

    const handleSubmit = useCallback(async (overrideIsDraft?: boolean): Promise<ContentSubmitResult> => {
        const targetIsDraft = overrideIsDraft !== undefined ? overrideIsDraft : state.isDraft;

        if (targetIsDraft) state.setIsSaving(true);
        else state.setIsPublishing(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Você precisa estar logado');

            // RULES: Chapter title validation
            if (type === 'chapter') {
                const rawTitle = state.title?.trim() || '';
                
                if (!rawTitle || rawTitle.length < 2) {
                    throw new Error("Título Inválido: o nome do capítulo é obrigatório e está muito curto. Insira um nome real (Ex: O Peso do Sangue).");
                }
                if (/^\d+$/.test(rawTitle)) {
                    throw new Error("Título Inválido: o nome do capítulo não pode ser apenas números. Digite o título descritivo do capítulo.");
                }
                if (/^Cap[íi]tulo\s*\d*\s*-?\s*$/i.test(rawTitle)) {
                    throw new Error("Título Inválido: substitua esse texto automático 'Capítulo' pelo NOME real do capítulo (ex: A Invasão). O sistema se encarrega de numerá-lo automaticamente.");
                }
                if (/^[^aeiouáàâãéèêíïóôõöúç]{7,}$/i.test(rawTitle) && !rawTitle.includes(' ')) {
                    throw new Error("Título Inválido: texto parece uma sequência sem sentido (muitas consoantes seguídas). Digite um nome autêntico para o capítulo.");
                }
            }

            return type === 'series' ? await submitSeries(user.id, targetIsDraft) : await submitChapter(user.id, targetIsDraft);
        } catch (err: any) {
            const msg = err.message || 'Ocorreu um erro ao salvar';
            state.setError(msg);

            const xpErrorDetails = err.originalError?.isXpError ? {
                isXpError: true,
                currentXp: err.originalError.currentXp,
                xpRequired: err.originalError.xpRequired
            } : null;

            return { success: false, message: msg, xpError: xpErrorDetails } as any;
        } finally {
            state.setIsSaving(false);
            state.setIsPublishing(false);
        }
    }, [state, type, mode, existingId, media]);

    const handleDelete = useCallback(async (): Promise<void> => {
        if (!existingId || mode !== 'edit' || type !== 'chapter') return;
        try {
            await apiClient.delete(`/api/chapters?id=${existingId}`);
            showXPToast({ amount: XP_CONFIG.CONTENT_DELETE.xp, ...XP_CONFIG.CONTENT_DELETE, message: 'Capítulo excluído!' });
            setTimeout(() => {
                router.refresh();
                router.push('/');
            }, 1500);
        } catch (err: any) {
            state.setError(`Não foi possível excluir: ${err.message}`);
        }
    }, [existingId, mode, type, router, state]);

    return { handleSubmit, handleDelete };
}
