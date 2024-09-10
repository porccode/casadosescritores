"use client";

import dynamic from 'next/dynamic';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-browser';
import { generateSlug, cn } from '@/lib/utils';
import {
  AlertCircle,
  Pencil,
  BookOpen,
  Calendar,
  User,
  Hash,
  Type,
  Play,
  Bookmark,
  Share2,
  MessageSquareText,
  Settings,
  Sun,
  Moon,
  Coffee,
  AlignCenter,
  AlignLeft,
  Maximize2,
  Twitter,
  Facebook,
  Instagram,
  Send,
  MessageCircle,
  AtSign
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import StoryContent from '../StoryContent';
import InlineCommentTrigger from './InlineCommentTrigger';
import MobileContentViewer from '@/components/content-viewer/MobileContentViewer';
import { useMobile } from '@/hooks/useMobile';
import { useReaderSettings } from '@/hooks/useReaderSettings';
import DesktopHeader from '@/components/navigation/DesktopHeader';
import ContentTitleHeader from '@/components/content/ContentTitleHeader';
import { GuestCTA } from '@/components/ui/GuestCTA';
import { ADMIN_ACCESS_PROFILE_SELECT, isAdminRole } from "@/lib/roles";
import ParagraphCommentPanel from './ParagraphCommentPanel';

// Componentes pesados carregados dinamicamente
const Comments = dynamic(() => import('../Comments'), { ssr: false });
const ReaderNavigation = dynamic(() => import('./ReaderNavigation'), { ssr: false });
const AudioPlayer = dynamic(() => import('./AudioPlayer'), { ssr: false });
const SaveToPlaylistModal = dynamic(() => import('../SaveToPlaylistModal'), { ssr: false });

import { isContentSaved, toggleContentSaved, toggleContentSavedAPI } from '@/lib/playlist-service';
import { toast } from '@/lib/toast';

import type { ContentViewerProps } from './types';

export default function ContentViewer({
  id,
  title,
  content,
  author,
  createdAt,
  updatedAt,
  contentType,
  userId,
  prevChapter,
  nextChapter,
  seriesId,
  seriesTitle,
  seriesSlug,
  chapterNumber,
  relatedItems = [],
  authorNote,
  commentsEnabled = true,
}: ContentViewerProps) {
  const isMobile = useMobile();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const [inlineCounts, setInlineCounts] = useState<Record<string, number>>({});
  const [isMounted, setIsMounted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [checkingSave, setCheckingSave] = useState(false);
  const [blockPositions, setBlockPositions] = useState<Record<string, number>>({});
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [panelContainer, setPanelContainer] = useState<HTMLElement | null>(null);
  const [blocksReadyCount, setBlocksReadyCount] = useState(0);

  const handleBlocksReady = useCallback(() => {
    setBlocksReadyCount(prev => prev + 1);
  }, []);

  // Hook do Modo Leitura
  const { settings: readerSettings, updateSetting: updateReaderSettings } = useReaderSettings();

  const supabase = createBrowserClient() as any;
  const hasTrackedReading = useRef(false);

  useEffect(() => {
    setIsMounted(true);

    // ✅ Gamificação: Premiar XP por descobrir série/ler capítulo pela primeira vez
    if (!hasTrackedReading.current && seriesId) {
        hasTrackedReading.current = true;
        fetch('/api/reading-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                seriesId, 
                chapterId: id, 
                isFirstChapter: chapterNumber === 1 
            })
        }).catch(() => {});
    }

    // Force scroll to top on mount to avoid layout shift jumps or focus-stealing
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }

    if (!userId && typeof window !== 'undefined') {
      try {
        const guestData = localStorage.getItem('cde_guest_session');
        const userAgent = window.navigator.userAgent;
        let hash = 0;
        for (let i = 0; i < userAgent.length; i++) {
          hash = ((hash << 5) - hash) + userAgent.charCodeAt(i);
          hash |= 0;
        }

        if (guestData) {
          const parsed = JSON.parse(atob(guestData));
          if (parsed.id !== id) {
            setIsLocked(true);
          }
        } else {
          const payload = btoa(JSON.stringify({ id, hash, timestamp: Date.now() }));
          localStorage.setItem('cde_guest_session', payload);
        }
      } catch (error) {
        setIsLocked(true);
      }
    }
  }, [userId, id]);

  // Atualizar posições dos blocos para indicadores fixos com debounce
  useEffect(() => {
    if (!isMounted || !content) return;

    let timeoutId: NodeJS.Timeout;

    const updatePositions = () => {
      const container = document.querySelector('.prose');
      if (!container) return;

      const parentRect = container.getBoundingClientRect();
      const blocks = container.querySelectorAll('[data-block-id]');
      const positions: Record<string, number> = {};

      blocks.forEach((block) => {
        const id = block.getAttribute('data-block-id');
        if (id) {
          const rect = block.getBoundingClientRect();
          // Centraliza o ícone verticalmente no bloco
          positions[id] = rect.top - parentRect.top + (rect.height / 2) - 16;
        }
      });

      setBlockPositions(positions);
    };

    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updatePositions, 100);
    };

    // Pequeno delay inicial para garantir que o StoryContent terminou de renderizar e blockificar
    const timer = setTimeout(updatePositions, 500);

    window.addEventListener('resize', debouncedUpdate);
    return () => {
      clearTimeout(timer);
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedUpdate);
    };
  }, [isMounted, content, inlineCounts]);

  // Carregar contagens de comentários em linha
  useEffect(() => {
    if (!id || contentType === 'announcement') return;
    const tableId = contentType === 'chapter' ? 'chapter_id' : 'story_id';

    async function fetchInlineCounts() {
      const { data, error } = await (supabase
        .from('comments' as any)
        .select('block_id')
        .eq(tableId, id)
        .eq('is_inline', true) as any);

      if (error) {
        console.error('Erro ao buscar contagens de comentários inline:', error);
        return;
      }

      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((c: any) => {
          if (c.block_id) {
            counts[c.block_id] = (counts[c.block_id] || 0) + 1;
          }
        });
        setInlineCounts(counts);
      }
    }

    fetchInlineCounts();

    // Calcular contagem de palavras e caracteres
    if (content) {
      let text = '';
      try {
        if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
          const json = JSON.parse(content);
          // Função recursiva para extrair texto do JSON do Tiptap
          const extractText = (node: any): string => {
            if (!node) return '';
            if (node.text) return node.text;
            if (node.content && Array.isArray(node.content)) {
              return node.content.map(extractText).join(' ');
            }
            return '';
          };
          text = extractText(json);
        } else {
          // Fallback para HTML: remover tags
          text = content.replace(/<[^>]*>/g, ' ');
        }
      } catch (e) {
        text = content || '';
      }

      const cleanText = text.trim();
      setCharCount(cleanText.length);
      setWordCount(cleanText ? cleanText.split(/\s+/).length : 0);
    }

    fetchInlineCounts();

    // Inscrever em mudanças nos comentários para atualizar contagens
    const channel = supabase
      .channel(`inline-comments-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `${tableId}=eq.${id}`
        },
        () => fetchInlineCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, contentType, supabase]);

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
  }, [id, userId, contentType, supabase]);

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select(`${ADMIN_ACCESS_PROFILE_SELECT}, username, avatar_url`).eq('id', userId).single();
      if (data) {
        setIsAdmin(isAdminRole(data));
        setUsername(data.username || '');
        setUserAvatar(data.avatar_url || null);
      }
    };
    fetchProfile();
  }, [userId, supabase]);

  // Synchronize paragraph classes (has-inline-comments, paragraph-commenting-active) with state
  useEffect(() => {
    if (!isMounted) return;

    const container = document.querySelector('.prose');
    if (!container) return;

    const blocks = container.querySelectorAll('[data-block-id]');
    blocks.forEach((block) => {
      const blockId = block.getAttribute('data-block-id');
      if (!blockId) return;

      // 1. Comments underline style
      const count = inlineCounts[blockId] || 0;
      if (count > 0) {
        block.classList.add('has-inline-comments');
      } else {
        block.classList.remove('has-inline-comments');
      }

      // 2. Active commenting style
      if (openPanel === blockId) {
        block.classList.add('paragraph-commenting-active');
      } else {
        block.classList.remove('paragraph-commenting-active');
      }
    });
  }, [isMounted, inlineCounts, openPanel, blocksReadyCount, content]);

  // Portal: inject comment panel container right after the clicked paragraph
  useEffect(() => {
    // Remove any existing panel containers first
    document.querySelectorAll('.paragraph-panel-portal').forEach(el => el.remove());
    setPanelContainer(null);

    if (!openPanel) return;

    const blockEl = document.querySelector(`[data-block-id="${openPanel}"]`);
    if (!blockEl || !blockEl.parentNode) return;

    const container = document.createElement('div');
    container.className = 'paragraph-panel-portal';
    container.style.cssText = 'margin: 8px 0;';

    // Insert the container div immediately after the paragraph element
    blockEl.parentNode.insertBefore(container, blockEl.nextSibling);
    setPanelContainer(container);

    return () => {
      container.remove();
    };
  }, [openPanel]);

  const canEdit = userId === author?.id || isAdmin;

  const handleOpenPlaylistModal = async () => {
    if (!userId) {
      const fullPath = window.location.pathname + window.location.search;
      router.push(`/login?redirectTo=${encodeURIComponent(fullPath)}`);
      return;
    }

    if (contentType === 'chapter' || contentType === 'story') {
      setCheckingSave(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Sessão expirada");

        const result = await toggleContentSavedAPI(id, contentType, session.access_token);
        const nowSaved = result.added; // result.added ou result.removed
        
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
      return;
    }

    setPlaylistModalOpen(true);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title,
        text: `Confira "${title}" na Casa dos Escritores`,
        url: window.location.href,
      });
    } catch (err) {
      // Compartilhamento não suportado ou cancelado
      // Fallback: copiar para área de transferência
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isMobile) {
    return (
      <MobileContentViewer
        id={id}
        title={title}
        content={content}
        author={author}
        createdAt={createdAt}
        updatedAt={updatedAt}
        contentType={contentType}
        userId={userId}
        prevChapter={prevChapter}
        nextChapter={nextChapter}
        seriesId={seriesId}
        seriesTitle={seriesTitle}
        chapterNumber={chapterNumber}
        relatedItems={relatedItems}
        isAdmin={isAdmin}
        commentsEnabled={commentsEnabled}
      />
    );
  }

  return (
    <div className="bg-background">
      {/* Header com Breadcrumb Standardizado */}
      <DesktopHeader
        seriesTitle={seriesTitle}
        seriesId={seriesId}
        seriesSlug={seriesSlug}
        pageTitle={title}
        onBack={() => router.back()}
        actions={
          <div className="flex items-center gap-1">
            {canEdit && contentType === 'chapter' && (
              <Button
                size="sm"
                className="flex items-center gap-2 mr-1 shadow-sm h-8"
                asChild
              >
                <Link href={`/escrever?action=edit&type=chapter&id=${id}&seriesId=${seriesId}`}>
                  <Pencil size={14} />
                  <span>Editar</span>
                </Link>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenPlaylistModal}
              disabled={checkingSave}
              className={isSaved ? "text-primary hover:text-primary/80" : "text-muted-foreground hover:text-foreground"}
            >
              <Bookmark size={18} className={isSaved ? "fill-current" : ""} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="text-muted-foreground hover:text-foreground"
            >
              <Share2 size={18} />
            </Button>
          </div>
        }
      />

      {/* Main Content Area - Standardized with mt-12 and zero padding */}
      <div className="w-full mt-12 relative px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start relative w-full max-w-[75rem] mx-auto">
          {/* Coluna Esquerda: Conteúdo principal */}
          <div className="w-full">
            {/* Título e Metadados Standardizados */}
            <div className="w-full">
              <ContentTitleHeader
                title={title}
                className="mb-12"
              />

              {error && (
                <Alert variant="destructive" className="mb-8">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Global styles for paragraph inline comment UX */}
              <style jsx global>{`
                .prose {
                  font-size: var(--reader-font-size) !important;
                  color: inherit !important;
                  transition: font-size 0.2s ease;
                }
                .prose p:not(.paragraph-panel-portal *),
                .prose span:not(.paragraph-panel-portal *),
                .prose li:not(.paragraph-panel-portal *) {
                  color: inherit !important;
                  font-size: inherit !important;
                }
                .dark-reader .prose {
                  color: #e8e8e8 !important;
                }
                .prose [data-block-id] {
                  position: relative;
                  border-radius: 4px;
                  transition: background-color 0.15s ease;
                  padding-left: 0.25rem;
                  margin-left: -0.25rem;
                }
                .prose [data-block-id].paragraph-hovered {
                  background-color: hsl(var(--primary) / 0.06);
                  cursor: pointer;
                }
                .prose [data-block-id].has-inline-comments {
                  text-decoration: underline;
                  text-decoration-color: hsl(var(--primary) / 0.35);
                  text-underline-offset: 3px;
                  text-decoration-thickness: 2px;
                }
                .prose [data-block-id].paragraph-commenting-active {
                  background-color: hsl(var(--primary) / 0.08);
                  border-left: 3px solid hsl(var(--primary));
                  padding-left: 0.5rem;
                  border-radius: 0 4px 4px 0;
                  transition: all 0.2s ease-in-out;
                }
              `}</style>

              <div
                className="max-w-none text-foreground min-h-[60vh] font-sans relative"
                onClick={(e) => {
                  if (!userId || isLocked) return;
                  const target = e.target as HTMLElement;
                  const block = target.closest('[data-block-id]') as HTMLElement | null;
                  if (block) {
                    const blockId = block.getAttribute('data-block-id');
                    if (blockId) {
                      setOpenPanel(openPanel === blockId ? null : blockId);
                    }
                  }
                }}
                onMouseMove={(e) => {
                  if (!userId || isLocked) return;
                  const now = Date.now();
                  // @ts-ignore
                  if (window._lastMove && now - window._lastMove < 40) return;
                  // @ts-ignore
                  window._lastMove = now;

                  const target = e.target as HTMLElement;
                  const block = target.closest('[data-block-id]') as HTMLElement | null;

                  // Remove old hover class
                  document.querySelectorAll('.paragraph-hovered').forEach(el => el.classList.remove('paragraph-hovered'));

                  if (block) {
                    const blockId = block.getAttribute('data-block-id');
                    if (blockId) {
                      block.classList.add('paragraph-hovered');
                      setHoveredBlock(blockId);
                    }
                  } else {
                    setHoveredBlock(null);
                  }
                }}
                onMouseLeave={() => {
                  document.querySelectorAll('.paragraph-hovered').forEach(el => el.classList.remove('paragraph-hovered'));
                  setHoveredBlock(null);
                }}
              >
                <div
                  className={`p-0 m-0 transition-colors duration-300 rounded-xl ${readerSettings.theme === 'sepia'
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
                    padding: readerSettings.theme !== 'light' ? '2.5rem' : '0'
                  } as React.CSSProperties}
                >

                  {!isMounted ? (
                    <div className="min-h-[40vh]" />
                  ) : isLocked ? (
                    <GuestCTA
                      title="Limite de Leitura Atingido"
                      description="Você já leu seu capítulo gratuito de hoje. Junte-se à Casa dos Escritores para ter acesso ilimitado a todas as histórias."
                    />
                  ) : (
                    <>
                      <article className="w-full transition-all duration-300">
                        <StoryContent
                          content={content}
                          onBlocksReady={handleBlocksReady}
                        />
                      </article>
                    </>
                  )}
                </div>

                {/* Nota do Autor (apenas se não estiver bloqueado e existir) */}
                {authorNote && !isLocked && (
                  <div className="mt-8 mb-6 mx-auto">
                    <Separator className="mb-6 opacity-30" />
                    <div className="relative p-5 rounded-xl bg-muted/20 border border-border/40 group hover:bg-muted/30 transition-colors">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10 border border-border/50 shrink-0">
                          <AvatarImage src={author?.avatar_url || ''} />
                          <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold uppercase">
                            {author?.username?.substring(0, 2) || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-muted-foreground mb-1">
                              Nota do Autor
                            </span>
                            <span className="text-sm font-semibold text-foreground">
                              Uma mensagem de {author?.first_name || author?.username}
                            </span>
                          </div>
                          <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap italic">
                            "{authorNote}"
                          </div>
                        </div>
                      </div>

                      {/* Decorative element */}
                      <div className="absolute top-4 right-4 text-muted-foreground/10 group-hover:text-muted-foreground/20 transition-colors">
                        <MessageSquareText size={48} strokeWidth={1} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Left-side icons: always visible for commented blocks, hover-only for others */}
                {!isLocked && userId && Object.entries(inlineCounts).map(([blockId, count]) => {
                  if (count === 0) return null;
                  const top = blockPositions[blockId];
                  if (top === undefined) return null;
                  return (
                    <InlineCommentTrigger
                      key={`count-${blockId}`}
                      blockId={blockId}
                      count={count}
                      top={top}
                      alwaysVisible={true}
                      isHovered={hoveredBlock === blockId}
                      onClick={(id) => setOpenPanel(openPanel === id ? null : id)}
                    />
                  );
                })}

                {/* Hover trigger for blocks WITHOUT comments */}
                {!isLocked && userId && hoveredBlock && !inlineCounts[hoveredBlock] && (() => {
                  const top = blockPositions[hoveredBlock];
                  if (top === undefined) return null;
                  return (
                    <InlineCommentTrigger
                      key={`hover-${hoveredBlock}`}
                      blockId={hoveredBlock}
                      count={0}
                      top={top}
              onClick={(id) => setOpenPanel(openPanel === id ? null : id)}
                    />
                  );
                })()}
              </div>

              {/* Portal: renders the comment panel right after the clicked paragraph in the DOM */}
              {!isLocked && openPanel && panelContainer && contentType === 'chapter' && createPortal(
                <ParagraphCommentPanel
                  blockId={openPanel}
                  chapterId={id}
                  userId={userId}
                  userAvatar={userAvatar}
                  username={username}
                  isAdmin={isAdmin}
                  onClose={() => setOpenPanel(null)}
                  onCountChange={(blockId, count) => {
                    setInlineCounts(prev => ({ ...prev, [blockId]: count }));
                  }}
                />,
                panelContainer
              )}

              {/* Navegação de Capítulo (apenas se não estiver bloqueado) */}
              {contentType === 'chapter' && seriesId && !isLocked && (
                <div className="mt-12">
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
            </div>
          </div>

          {/* Coluna Direita: Sidebar Informativa */}
          <aside className="hidden lg:flex flex-col gap-6 sticky top-24">
            {/* Bloco de Áudio / Narração (apenas se não estiver bloqueado) */}
            {!isLocked && <AudioPlayer content={content || ''} title={title} />}


            {/* Sobre a Obra / Capítulo */}
            <Card className="shadow-none rounded-xl border-border">
              <CardHeader className="py-4 border-b border-border">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Sobre esta leitura
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Informações do Autor */}
                <div className="p-4 flex items-center gap-3 border-b border-border bg-muted/5">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={author?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold uppercase">
                      {author?.username?.substring(0, 2) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold leading-tight text-foreground">
                      {author?.first_name ? `${author.first_name} ${author.last_name || ''}`.trim() : author?.username}
                    </span>
                    <Link
                      href={`/profile/${author?.username || "usuario"}`}
                      className="text-xs text-primary font-medium hover:underline w-fit"
                    >
                      @{author?.username}
                    </Link>
                  </div>
                </div>

                {/* Métricas do Conteúdo */}
                <div className="p-4 space-y-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Type size={14} className="opacity-70" />
                      <span>Palavras</span>
                    </div>
                    <span className="font-medium text-foreground">{wordCount}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Hash size={14} className="opacity-70" />
                      <span>Caracteres</span>
                    </div>
                    <span className="font-medium text-foreground">{charCount}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <BookOpen size={14} className="opacity-70" />
                      <span>Tempo de leitura</span>
                    </div>
                    <span className="font-medium text-foreground">{Math.ceil(wordCount / 200)} min</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar size={14} className="opacity-70" />
                      <span>Publicado em</span>
                    </div>
                    <span className="font-medium text-foreground">{formatDate(createdAt)}</span>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Tipo de obra</span>
                      <Badge variant="secondary" className="text-[10px] font-medium py-0 h-5 px-2.5 rounded-full capitalize">
                        {contentType === 'chapter' ? 'capítulo' : 'série'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nossas Redes Sociais */}
            {!isLocked && (
              <Card className="shadow-none rounded-xl border-border overflow-hidden">
                <CardHeader className="py-3 border-b border-border bg-muted/5">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Nossas Redes Sociais
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Siga-nos e faça parte da comunidade!</p>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <a href="https://x.com/casa_escritores" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-white transition-all duration-200 hover:opacity-90 hover:shadow-md hover:-translate-y-0.5"
                      style={{ backgroundColor: '#000000' }}>
                      <Twitter size={14} /> <span>Twitter</span>
                    </a>
                    <a href="https://www.facebook.com/casadosescritores.site" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-white transition-all duration-200 hover:opacity-90 hover:shadow-md hover:-translate-y-0.5"
                      style={{ backgroundColor: '#1877F2' }}>
                      <Facebook size={14} /> <span>Facebook</span>
                    </a>
                    <a href="https://www.instagram.com/casadosescritoresbr/" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-white transition-all duration-200 hover:opacity-90 hover:shadow-md hover:-translate-y-0.5"
                      style={{ background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
                      <Instagram size={14} /> <span>Instagram</span>
                    </a>
                    <a href="https://www.threads.com/@casadosescritoresbr" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-white transition-all duration-200 hover:opacity-90 hover:shadow-md hover:-translate-y-0.5"
                      style={{ backgroundColor: '#101010' }}>
                      <AtSign size={14} /> <span>Threads</span>
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>

        {/* Seção de Comentários Gerais - Largura total abaixo do grid (apenas se não estiver bloqueado) */}
        {!isLocked && (
          <div className="mt-12">
            <div className="w-full max-w-[75rem] mx-auto">
              <div id="comments-section" className={`${contentType === 'announcement' ? 'pt-6' : ''} scroll-mt-24`}>
                <Comments
                  storyId={contentType === 'story' ? id : undefined}
                  contentId={contentType === 'chapter' ? id : undefined}
                  announcementId={contentType === 'announcement' ? id : undefined}
                  contentType={contentType}
                  userId={userId}
                  authorId={author?.id}
                  commentsEnabled={commentsEnabled}
                />
              </div>
            </div>
          </div>
        )}

        {/* Save to Playlist Modal */}
        <SaveToPlaylistModal
          open={playlistModalOpen}
          onOpenChange={setPlaylistModalOpen}
          contentId={id}
          contentType={contentType === 'chapter' ? 'chapter' : 'story'}
          contentTitle={title}
        />
      </div>
    </div>
  );
}
