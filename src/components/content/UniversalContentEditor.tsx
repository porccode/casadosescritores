'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useContentEditor } from '@/hooks/useContentEditor';
import { createBrowserClient } from '@/lib/supabase-browser';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import TiptapEditor from '@/components/tiptap/TiptapEditor';
import { Send, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ButtonSpinner } from '@/components/ui/loading-states';
import DesktopHeader from '@/components/navigation/DesktopHeader';
import ContentTitleHeader from '@/components/content/ContentTitleHeader';
import WorkMetadataForm from '@/components/content/WorkMetadataForm';
import WorkCreationWizard from '@/components/content/WorkCreationWizard';
import ChapterEditorSidebar from '@/components/content/ChapterEditorSidebar';
import MobileEditorialStatus from '@/components/content/MobileEditorialStatus';
import MobileContentEditorHeader from '@/components/editor/MobileContentEditorHeader';
import { EditorAuthGuard } from '@/components/editor/EditorAuthGuard';
import { EditorAlerts } from '@/components/editor/EditorAlerts';
import { EditorModals } from '@/components/editor/EditorModals';
import { FirstChapterCongratsModal } from '@/components/content/RetentionModals';
import { FirstChapterTypeModal } from '@/components/editor/FirstChapterTypeModal';
import Sidebar from '@/components/tiptap/Sidebar';
import { useAutosave } from '@/hooks/editor/useAutosave';
import AutosaveIndicator from '@/components/editor/AutosaveIndicator';
import VersionHistory from '@/components/editor/VersionHistory';

export default function UniversalContentEditor() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const supabase = createBrowserClient();

    // URL Parameters
    const action = searchParams.get('action') || 'new';
    const editType = searchParams.get('type');
    const editId = searchParams.get("id") || "";
    console.log("[UniversalContentEditor] editId:", editId, "action:", action, "type:", editType);
    const urlSeriesId = searchParams.get('seriesId');
    const firstChapterType = searchParams.get('firstChapterType'); // 'prologue' | 'chapter_1'

    // State
    const [categories, setCategories] = useState<string[]>([]);
    const [userXP, setUserXP] = useState(0);
    const [tiptapEditor, setTiptapEditor] = useState<any>(null);
    const [lastSelectionUpdate, setLastSelectionUpdate] = useState(0);
    const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
    // const [isAIModalOpen, setIsAIModalOpen] = useState(false); // Removed
    // const [isAICoverModalOpen, setIsAICoverModalOpen] = useState(false); // Removed
    const [videoUrl, setVideoUrl] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAuthor, setIsAuthor] = useState(false);

    // Retention Modals State
    const [firstChapterModalOpen, setFirstChapterModalOpen] = useState(false);
    const [publishedChapterSlug, setPublishedChapterSlug] = useState('');

    // XP Economy Modals State
    const [xpErrorModalOpen, setXpErrorModalOpen] = useState(false);
    const [xpErrorData, setXpErrorData] = useState<{ currentXp: number; xpRequired: number } | null>(null);

    const imageInputRef = useRef<HTMLInputElement>(null);
    // Core Hook
    const editor = useContentEditor({
        type: editType === 'series' ? 'series' : 'chapter',
        mode: action === 'edit' ? 'edit' : 'create',
        existingId: editId || undefined,
        seriesId: urlSeriesId || undefined
    });

    // Intercepta handleSubmit para abrir modal de XP insuficiente quando a API retorna isXpError
    const originalSubmit = editor.handleSubmit;
    editor.handleSubmit = async (overrideIsDraft?: boolean) => {
        const res = await originalSubmit(overrideIsDraft);
        if (!res.success && (res as any).xpError) {
            setXpErrorData((res as any).xpError);
            setXpErrorModalOpen(true);
        }
        return res;
    };

    const mode = editType === 'series' ? (action === 'edit' ? 'edit-work' : 'create-work') : 'write-chapter';
    const isChapterMode = mode === 'write-chapter';

    // Autosave (apenas para capítulos, não séries)
    const autosave = useAutosave({
        chapterId: isChapterMode && action === 'edit' ? editId : undefined,
        content: editor.content,
        title: editor.title,
        enabled: isChapterMode && action === 'edit' && !!editId,
    });

    // Aceitar recuperação de rascunho
    useEffect(() => {
        if (autosave.hasPendingRecovery && autosave.recoveredContent) {
            // Não aplicar automaticamente — o usuário vê o alert e decide
        }
    }, [autosave.hasPendingRecovery]);

    const handleAcceptRecovery = () => {
        if (autosave.recoveredContent) {
            editor.setContent(autosave.recoveredContent);
            if (autosave.recoveredTitle) editor.setTitle(autosave.recoveredTitle);
        }
        autosave.acceptRecovery();
    };

    const handleVersionRestore = (content: any, title: string | null) => {
        editor.setContent(content);
        if (title) editor.setTitle(title);
    };

    // Data Loading
    useEffect(() => {
        async function loadData() {
            try {
                const catRes = await fetch('/api/categories');
                if (catRes.ok) {
                    const data = await catRes.json();
                    setCategories(data.categories?.map((c: { name: string }) => c.name) || []);
                }
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUserId(user.id);
                    const { data: profile } = await (supabase.from('profiles').select('xp, role').eq('id', user.id).single() as any);
                    if (profile) {
                        setUserXP(profile.xp || 0);
                        setIsAdmin(profile.role === 'admin' || profile.role === 'moderator');
                        // In writing mode, isAuthor is usually true if we passed the AuthGuard
                        setIsAuthor(true);
                    }
                }
            } catch (err) {
                console.error("Erro ao carregar dados do editor:", err);
            }
        }
        loadData();
    }, [supabase]);

    // Handle firstChapterType param — set title and chapter number after hook initializes
    React.useEffect(() => {
        if (!firstChapterType || !editor.isFirstChapterCreation) return;
        const prefix = firstChapterType === 'prologue' ? 'Prólogo' : 'Capítulo 1 - ';
        editor.setTitle(prefix);
        if (firstChapterType === 'prologue') {
            editor.setChapterNumber(0);
        } else {
            editor.setChapterNumber(1);
        }
        editor.setIsFirstChapterCreation(false);
    }, [firstChapterType, editor.isFirstChapterCreation]);

    // Handlers
    // const handleAIInsert = (text: string) => { ... } // Removed

    const handleVideoConfirm = () => {
        if (!tiptapEditor || !videoUrl) return;
        let finalUrl = videoUrl;
        if (videoUrl.includes('youtube.com/watch?v=')) {
            const videoId = videoUrl.split('v=')[1]?.split('&')[0];
            if (videoId) finalUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (videoUrl.includes('youtu.be/')) {
            const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
            if (videoId) finalUrl = `https://www.youtube.com/embed/${videoId}`;
        }
        tiptapEditor.chain().focus().setVideo({ src: finalUrl }).run();
        setVideoUrl('');
        setIsVideoDialogOpen(false);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !tiptapEditor) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { compressImage } = await import("@/lib/utils");
            const compressedFile = await compressImage(file, 1200, 0.7);

            const formData = new FormData();
            formData.append('file', compressedFile);
            formData.append('type', 'chapter');
            formData.append('userId', user.id);

            const response = await fetch('/api/upload', { method: 'POST', body: formData });
            if (response.ok) {
                const { url } = await response.json();
                tiptapEditor.chain().focus().setImage({ src: url, ownerId: user.id }).run();
            }
        } catch (err) {
            console.error("Upload failed", err);
        } finally {
            if (imageInputRef.current) imageInputRef.current.value = '';
        }
    };

    const coverInputRef = useRef<HTMLInputElement>(null);

    const editorContent = mode === 'edit-work' ? (
        <WorkMetadataForm
            editor={editor}
            categories={categories}
            hasMounted={true}
            fileInputRef={coverInputRef}
            onCoverChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                    editor.setCoverFile(file);
                    const r = new FileReader();
                    r.onload = (ev) => editor.setCoverPreview(ev.target?.result as string);
                    r.readAsDataURL(file);
                }
            }}
            onSubmit={(isDraft) => editor.handleSubmit(isDraft).then(res => {
                if (res.success && res.data?.slug) {
                    window.location.href = `/series/${res.data.slug}`;
                }
            })}
            isEditing={true}
        />
    ) : mode === 'create-work' ? (
        <WorkCreationWizard
            editor={editor}
            categories={categories}
            hasMounted={true}
            fileInputRef={coverInputRef}
            onCoverChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                    editor.setCoverFile(file);
                    const r = new FileReader();
                    r.onload = (ev) => editor.setCoverPreview(ev.target?.result as string);
                    r.readAsDataURL(file);
                }
            }}
        />
    ) : (
        <div className="min-h-screen flex flex-col bg-background">
            <MobileContentEditorHeader
                title={editor.title}
                seriesTitle={editor.seriesTitle}
                seriesId={editor.loadedSeriesId as any}
                onBack={() => router.back()}
                action={action as any}
                type={editType as any}
            />

            <DesktopHeader
                seriesTitle={editor.seriesTitle}
                seriesId={editor.loadedSeriesId as any}
                pageTitle={editor.title || (action === 'edit' ? 'Editando' : 'Novo Capítulo')}
                onBack={() => router.back()}
                actions={
                    <div className="flex items-center gap-3">
                        {isChapterMode && action === 'edit' && editId && (
                            <AutosaveIndicator status={autosave.status} lastSavedAt={autosave.lastSavedAt} />
                        )}
                        {isChapterMode && action === 'edit' && editId && (
                            <VersionHistory chapterId={editId} onRestore={handleVersionRestore} />
                        )}
                    </div>
                }
            />

            <div className="flex-1">
                <EditorAlerts error={editor.error && !editor.error.includes('Título Inválido:') ? editor.error : null} success={editor.success} onClearError={() => editor.setError(null)} />

                {/* Alerta de recuperação de rascunho */}
                {autosave.hasPendingRecovery && (
                    <div className="mx-auto max-w-3xl px-4 mb-4">
                        <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
                            <p className="text-sm text-foreground">Encontramos um rascunho não salvo. Deseja restaurar?</p>
                            <div className="flex items-center gap-2 shrink-0">
                                <Button size="sm" variant="outline" onClick={autosave.dismissRecovery}>Descartar</Button>
                                <Button size="sm" onClick={handleAcceptRecovery}>Restaurar</Button>
                            </div>
                        </div>
                    </div>
                )}

                <main className="mx-auto relative content-wrapper py-12">
                    <ContentTitleHeader title={editor.title} setTitle={editor.setTitle} error={editor.error?.includes('Título Inválido:') ? editor.error : undefined} isEditable={true} className="mb-12" />

                    <div className="grid gap-4 items-start relative max-w-[1400px] mx-auto grid-cols-1 lg:grid-cols-[1fr_320px]">
                        <div className="w-full relative space-y-8">
                            <div className="bg-background rounded-2xl border border-border overflow-hidden p-6">
                                <TiptapEditor
                                    key={editId || 'new'}
                                    content={editor.content}
                                    onChange={editor.setContent}
                                    onEditorReady={(ed) => { setTiptapEditor(ed); setLastSelectionUpdate(Date.now()); }}
                                    userId={userId || undefined}
                                    isAdmin={isAdmin}
                                    isAuthor={isAuthor}
                                />
                            </div>

                            {isChapterMode && (
                                <Card className="bg-background border-border shadow-sm p-6">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="space-y-1 text-center md:text-left">
                                            <h4 className="text-sm font-semibold text-foreground">
                                                Finalizou a escrita do capítulo?
                                            </h4>
                                            <p className="text-xs text-muted-foreground">
                                                Escolha entre salvar como rascunho para continuar editando mais tarde ou publicar agora para seus leitores.
                                            </p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto justify-end shrink-0">
                                            <Button
                                                variant="outline"
                                                size="default"
                                                onClick={() => {
                                                    editor.setIsDraft(true);
                                                    if (editId) autosave.forceSave('manual');
                                                    editor.handleSubmit(true).then(res => {
                                                        if (res.success && res.data?.id && action !== 'edit') {
                                                            router.replace(`/escrever?action=edit&type=chapter&id=${res.data.id}&seriesId=${urlSeriesId || editor.loadedSeriesId}`);
                                                        }
                                                    });
                                                }}
                                                disabled={editor.isSaving || editor.isPublishing}
                                                className="h-10 px-5 gap-2 font-semibold w-full sm:w-auto text-xs"
                                            >
                                                {editor.isSaving ? <ButtonSpinner /> : <FileText className="h-4 w-4" />}
                                                Salvar Rascunho
                                            </Button>

                                            <Button
                                                variant="default"
                                                size="default"
                                                onClick={() => {
                                                    editor.setIsDraft(false);
                                                    if (editId) autosave.forceSave('publish');
                                                    editor.handleSubmit(false).then(res => {
                                                        if (res.success && res.data?.slug) {
                                                            if (res.data.isFirstChapter) {
                                                                setPublishedChapterSlug(res.data.slug as string);
                                                                setFirstChapterModalOpen(true);
                                                            } else {
                                                                router.push(`/capitulo/${res.data.slug as string}`);
                                                            }
                                                        }
                                                    });
                                                }}
                                                disabled={editor.isSaving || editor.isPublishing}
                                                className="h-10 px-6 gap-2 font-bold bg-primary text-primary-foreground shadow-sm w-full sm:w-auto text-xs"
                                            >
                                                {editor.isPublishing ? <ButtonSpinner /> : <Send className="h-4 w-4 text-primary-foreground" />}
                                                Publicar Capítulo
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </div>

                        <ChapterEditorSidebar
                            tiptapEditor={tiptapEditor}
                            selectionTrigger={lastSelectionUpdate}
                            contentEditor={editor}
                            hasMounted={true}
                            imageInputRef={imageInputRef}
                            onInfoBlockInsert={() => tiptapEditor?.chain().focus().toggleInfoBlock().run()}
                            onImageChange={handleImageUpload}
                            onVideoInsert={() => setIsVideoDialogOpen(true)}
                        />
                    </div>

                    <MobileEditorialStatus editor={editor} mode={mode} />
                </main>
            </div>
        </div>
    );

    return (
        <EditorAuthGuard loadedAuthorId={editor.loadedAuthorId} isLoading={editor.isLoading}>
            {editorContent}

            <EditorModals
                isVideoDialogOpen={isVideoDialogOpen}
                setIsVideoDialogOpen={setIsVideoDialogOpen}
                videoUrl={videoUrl}
                setVideoUrl={setVideoUrl}
                handleVideoConfirm={handleVideoConfirm}
                editor={editor}
                userXP={userXP}
                setUserXP={setUserXP}
                xpErrorModalOpen={xpErrorModalOpen}
                setXpErrorModalOpen={setXpErrorModalOpen}
                xpErrorData={xpErrorData}
            />

            <FirstChapterCongratsModal
                isOpen={firstChapterModalOpen}
                onClose={() => {
                    setFirstChapterModalOpen(false);
                    router.push(`/capitulo/${publishedChapterSlug}`);
                }}
            />
        </EditorAuthGuard>
    );
}
