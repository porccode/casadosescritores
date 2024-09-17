"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bookmark, Share2, Pencil, MessageSquareText, Settings, Sun, Moon, Coffee, AlignLeft, AlignCenter, Maximize2, Twitter, Facebook, Instagram, Send, MessageCircle, AtSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useReaderSettings } from '@/hooks/useReaderSettings';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import StoryContent from '@/components/StoryContent';
import Comments from '@/components/Comments';
import ReaderNavigation from '@/components/content-viewer/ReaderNavigation';
import MobileAudioPlayer from './MobileAudioPlayer';
import SaveToPlaylistModal from '@/components/SaveToPlaylistModal';
import { generateSlug, sanitizeSlug, formatTitle, cn } from '@/lib/utils';
import { isContentSaved, toggleContentSaved, toggleContentSavedAPI } from '@/lib/playlist-service';
import { createBrowserClient } from '@/lib/supabase-browser';
import { toast } from '@/lib/toast';
import type { ContentViewerProps } from '@/components/content-viewer/types';
import MobileHeader from '@/components/navigation/MobileHeader';
import ContentTitleHeader from '@/components/content/ContentTitleHeader';
import { GuestCTA } from '@/components/ui/GuestCTA';
import { ADMIN_ACCESS_PROFILE_SELECT, isAdminRole } from '@/lib/roles';


export default function MobileContentViewer({
    id,
    title,
    content,
    author,
    createdAt,
    contentType,
    userId,
    prevChapter,
    nextChapter,
    seriesId,
    seriesTitle,
    chapterNumber,
    isAdmin: isAdminProp = false,
    authorNote,
    commentsEnabled = true,
}: ContentViewerProps & { isAdmin?: boolean }) {
    const router = useRouter();
    const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [checkingSave, setCheckingSave] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [internalIsAdmin, setInternalIsAdmin] = useState(isAdminProp);
    const supabase = createBrowserClient() as any;

    // Hook do Modo Leitura
    const { settings: readerSettings, updateSetting: updateReaderSettings } = useReaderSettings();

    // Verificar se o conteúdo está bloqueado para convidados
    useEffect(() => {
        setIsMounted(true);
        if (!userId && typeof window !== 'undefined') {
            const readId = localStorage.getItem('guest_read_id');
            if (readId && readId !== id) {
                setIsLocked(true);
            } else if (!readId) {
                localStorage.setItem('guest_read_id', id);
            }
        }
    }, [userId, id]);

    useEffect(() => {
        setInternalIsAdmin(isAdminProp);
    }, [isAdminProp]);

    // Verificar isAdmin se não foi passado
    useEffect(() => {
        if (isAdminProp || !userId) return;
        async function checkAdmin() {
            const { data } = await supabase.from('profiles').select(ADMIN_ACCESS_PROFILE_SELECT).eq('id', userId).single();
            if (data) setInternalIsAdmin(isAdminRole(data));
        }
        checkAdmin();
    }, [isAdminProp, userId, supabase]);

    const canEdit = userId === author?.id || internalIsAdmin;

    // Verificar se o conteúdo está salvo
    useEffect(() => {
        if (!id || !userId) return;

        async function checkStatus() {
            try {
                const saved = await isContentSaved(supabase, userId, id);
                setIsSaved(saved);
            } catch (error) {
                console.error('Erro ao verificar status de salvamento:', error);
            }
        }

        checkStatus();
    }, [id, userId, supabase]);

    const handleOpenPlaylistModal = async () => {
        if (!userId) {
            const fullPath = window.location.pathname + window.location.search;
            router.push(`/login?redirectTo=${encodeURIComponent(fullPath)}`);
            return;
        }

        setCheckingSave(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Sessão expirada");

            const result = await toggleContentSavedAPI(id, contentType === 'chapter' ? 'chapter' : 'story', session.access_token);
            const nowSaved = result.added;

            setIsSaved(nowSaved);
            toast.success(nowSaved ? 'Salvo em "Capítulos Salvos"' : 'Removido de "Capítulos Salvos"');

            if (result.xpAwarded) {
                const { XP_CONFIG } = await import('@/config/xp');
                const { showXPToast } = await import('@/lib/xp-toast');
                showXPToast({
                    amount: XP_CONFIG.CONTENT_SAVE.xp,
                    action: XP_CONFIG.CONTENT_SAVE.action,
                    message: 'XP de curadoria recebido!'
                });
            }
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            toast.error(error.message || 'Erro ao salvar');
        } finally {
            setCheckingSave(false);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    text: `Confira "${title}" na Casa dos Escritores`,
                    url: window.location.href,
                });
            } catch (err) {
                // Cancelado pelo usuário
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copiado para a área de transferência!');
        }
    };

    const backHref = seriesId ? `/series/${sanitizeSlug(seriesTitle || '')}` : '/explorar';

    const headerActions = (
        <>
            {canEdit && contentType === 'chapter' && (
                <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="h-9 w-9 text-primary font-bold bg-primary/5 mr-1"
                >
                    <Link
                        href={`/escrever?action=edit&type=chapter&id=${id}&seriesId=${seriesId}`}
                        title="Editar"
                    >
                        <Pencil size={18} strokeWidth={2.5} />
                    </Link>
                </Button>
            )}
            <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenPlaylistModal}
                disabled={checkingSave}
                className={cn("h-9 w-9", isSaved && "text-primary")}
            >
                <Bookmark size={18} className={isSaved ? "fill-current" : ""} />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="h-9 w-9"
            >
                <Share2 size={18} />
            </Button>
            
            {/* Controles de Leitura Mobile */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                        <Settings size={18} />
                    </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-12 pt-6">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="text-left">Configurações de Leitura</SheetTitle>
                    </SheetHeader>
                    
                    <div className="space-y-8">
                        {/* Temas */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tema</h4>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    variant={readerSettings.theme === 'light' ? 'default' : 'outline'}
                                    onClick={() => updateReaderSettings({ theme: 'light' })}
                                    className="flex flex-col gap-1 h-14 py-2"
                                >
                                    <Sun size={16} />
                                    <span className="text-[10px]">Claro</span>
                                </Button>
                                <Button
                                    variant={readerSettings.theme === 'sepia' ? 'default' : 'outline'}
                                    onClick={() => updateReaderSettings({ theme: 'sepia' })}
                                    className="flex flex-col gap-1 h-14 py-2 bg-[#f4ecd8] text-[#5b4636] hover:bg-[#ebdcb2] border-[#e1d09e]"
                                >
                                    <Coffee size={16} />
                                    <span className="text-[10px]">Sépia</span>
                                </Button>
                                <Button
                                    variant={readerSettings.theme === 'dark' ? 'default' : 'outline'}
                                    onClick={() => updateReaderSettings({ theme: 'dark' })}
                                    className="flex flex-col gap-1 h-14 py-2 bg-slate-900 text-slate-100 hover:bg-slate-800"
                                >
                                    <Moon size={16} />
                                    <span className="text-[10px]">Escuro</span>
                                </Button>
                            </div>
                        </div>

                        {/* Fonte */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tamanho da Fonte</h4>
                                <span className="text-sm font-bold text-primary">{readerSettings.fontSize}px</span>
                            </div>
                            <Slider
                                value={[readerSettings.fontSize]}
                                min={14}
                                max={30}
                                step={1}
                                onValueChange={(val) => updateReaderSettings({ fontSize: val[0] })}
                                className="py-2"
                            />
                        </div>

                        {/* Espaçador final */}
                        <div className="pt-2 text-[10px] text-center text-muted-foreground italic">
                            Preferências salvas automaticamente
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Header com Breadcrumb */}
            <MobileHeader
                seriesTitle={seriesTitle}
                seriesId={seriesId}
                pageTitle={title}
                backHref={backHref}
                actions={headerActions}
            />

            {/* Content Area */}
            <main className="flex-1 w-full px-4 py-6">

                {/* Título e Metadados Standardizados */}
                <ContentTitleHeader
                    title={title}
                    author={author ? { username: author.username || '', id: author.id } : undefined}
                    createdAt={createdAt}
                    chapterNumber={contentType === 'chapter' ? chapterNumber : undefined}
                />

                {/* Audio Player Integration (apenas se não estiver bloqueado) */}
                {!isLocked && <MobileAudioPlayer content={content || ''} title={title} className="mb-6" />}

                <div className="min-h-[40vh] relative">
                    {!isMounted ? (
                        <div className="min-h-[20vh]" />
                    ) : isLocked ? (
                        <GuestCTA
                            title="Limite de Leitura Atingido"
                            description="Você já leu seu capítulo gratuito de hoje. Junte-se para ler tudo sem limites."
                        />
                    ) : (
                        <div 
                            className={`transition-colors duration-300 rounded-xl ${
                                readerSettings.theme === 'sepia' 
                                    ? 'bg-[#f4ecd8] text-[#5b4636]' 
                                    : readerSettings.theme === 'dark' 
                                        ? 'bg-[#0f0f12] text-[#e8e8e8] dark-reader' 
                                        : ''
                            }`}
                            style={{
                                // @ts-ignore
                                '--reader-font-size': `${readerSettings.fontSize}px`,
                                fontSize: 'var(--reader-font-size)',
                                lineHeight: readerSettings.lineHeight,
                                padding: readerSettings.theme !== 'light' ? '1.5rem' : '0'
                            } as React.CSSProperties}
                        >
                            <style jsx global>{`
                                .prose {
                                    font-size: var(--reader-font-size) !important;
                                    color: inherit !important;
                                    transition: font-size 0.2s ease;
                                }
                                .prose p, .prose span, .prose li {
                                    color: inherit !important;
                                    font-size: inherit !important;
                                }
                                .dark-reader .prose {
                                    color: #e8e8e8 !important;
                                }
                            `}</style>
                            <article className="w-full transition-all duration-300">
                                <StoryContent content={content} />
                            </article>


                        </div>
                    )}
                </div>

                {/* Nota do Autor (apenas se não estiver bloqueado e existir) */}
                {authorNote && !isLocked && (
                    <div className="mt-12 mb-8 mx-auto">
                        <Separator className="mb-8 opacity-50" />
                        <div className="relative p-5 rounded-2xl bg-muted/30 border border-border/50 transition-colors">
                            <div className="flex items-start gap-3">
                                <Avatar className="h-8 w-8 border border-border/50 shrink-0 mt-0.5">
                                    <AvatarImage src={author?.avatar_url || ''} />
                                    <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold uppercase">
                                        {author?.username?.substring(0, 2) || 'A'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1.5 flex-1 min-w-0">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 mb-0.5">
                                            Nota do Autor
                                        </span>
                                        <span className="text-xs font-semibold text-foreground truncate">
                                            Recado de {author?.first_name || author?.username}
                                        </span>
                                    </div>
                                    <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap italic break-words">
                                        "{authorNote}"
                                    </div>
                                </div>
                            </div>
                            
                            {/* Decorative element */}
                            <div className="absolute top-3 right-3 text-muted-foreground/5 pointer-events-none">
                                <MessageSquareText size={32} strokeWidth={1} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Reader Navigation (apenas se não estiver bloqueado e se for capítulo) */}
                {!isLocked && contentType === 'chapter' && seriesId && (
                    <div className="mt-8 mb-12">
                        <ReaderNavigation
                            prevChapter={prevChapter}
                            nextChapter={nextChapter}
                            seriesId={seriesId}
                            seriesTitle={seriesTitle}
                            currentChapterNumber={chapterNumber}
                            chapterTitle={title}
                        />
                    </div>
                )}

                {/* Nossas Redes Sociais card no mobile */}
                {!isLocked && (
                    <div className="mt-2 mb-10">
                        <Card className="shadow-none rounded-xl border-border overflow-hidden">
                          <CardHeader className="py-3 border-b border-border bg-muted/5">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-foreground text-center">
                              Nossas Redes Sociais
                            </CardTitle>
                            <p className="text-[10px] text-muted-foreground text-center mt-0.5">Siga-nos e faça parte da comunidade!</p>
                          </CardHeader>
                          <CardContent className="p-3">
                            <div className="grid grid-cols-4 gap-2">
                              <a href="https://x.com/casa_escritores" target="_blank" rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg text-[10px] font-medium text-white transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-95"
                                style={{ backgroundColor: '#000000' }}>
                                <Twitter size={16} /> <span>Twitter</span>
                              </a>
                              <a href="https://www.facebook.com/casadosescritores.site" target="_blank" rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg text-[10px] font-medium text-white transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-95"
                                style={{ backgroundColor: '#1877F2' }}>
                                <Facebook size={16} /> <span>Facebook</span>
                              </a>
                              <a href="https://www.instagram.com/casadosescritoresbr/" target="_blank" rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg text-[10px] font-medium text-white transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-95"
                                style={{ background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
                                <Instagram size={16} /> <span>Insta</span>
                              </a>
                              <a href="https://www.threads.com/@casadosescritoresbr" target="_blank" rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg text-[10px] font-medium text-white transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-95"
                                style={{ backgroundColor: '#101010' }}>
                                <AtSign size={16} /> <span>Threads</span>
                              </a>
                            </div>
                          </CardContent>
                        </Card>
                    </div>
                )}

                {/* Comments Section (apenas se não estiver bloqueado) */}
                {!isLocked && (
                    <div id="comments-section" className="mt-8 scroll-mt-20">
                        <Comments
                            storyId={contentType === 'story' ? id : undefined}
                            contentId={contentType === 'chapter' ? id : undefined}
                            contentType={contentType}
                            userId={userId}
                            authorId={author?.id}
                            commentsEnabled={commentsEnabled}
                        />
                    </div>
                )}
            </main>

            {/* Playlist Modal */}
            <SaveToPlaylistModal
                open={playlistModalOpen}
                onOpenChange={setPlaylistModalOpen}
                contentId={id}
                contentType={contentType === 'chapter' ? 'chapter' : 'story'}
                contentTitle={title}
            />
        </div>
    );
}
