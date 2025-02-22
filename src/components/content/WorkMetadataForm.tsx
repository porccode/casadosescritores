'use client';

import React, { RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import {
    Loader2,
    UploadCloud,
    AlertTriangle,
    CheckCircle2,
    MessageSquare,
    Plus,
    X,
} from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { LoadingSpinner, ButtonSpinner } from '@/components/ui/loading-states';
import type { UseContentEditorReturn } from '@/types/content.types';

interface WorkMetadataFormProps {
    editor: UseContentEditorReturn;
    categories: string[];
    hasMounted: boolean;
    fileInputRef: RefObject<HTMLInputElement | null>;
    onCoverChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (isDraft: boolean) => void;
    isEditing: boolean;
}

export default function WorkMetadataForm({
    editor,
    categories,
    hasMounted,
    fileInputRef,
    onCoverChange,
    onSubmit,
    isEditing,
}: WorkMetadataFormProps) {
    const router = useRouter();
    const [isExplicitConfirmOpen, setIsExplicitConfirmOpen] = React.useState(false);
    const [isQualityWarningOpen, setIsQualityWarningOpen] = React.useState(false);
    const [authorSeriesList, setAuthorSeriesList] = React.useState<{ id: string; title: string }[]>([]);

    React.useEffect(() => {
        let isMounted = true;
        async function fetchUserSeries() {
            try {
                const supabase = createBrowserClient();
                let authorId = editor.loadedAuthorId;
                if (!authorId) {
                    const { data: sessionData } = await supabase.auth.getSession();
                    authorId = sessionData.session?.user?.id || null;
                }
                if (!authorId) {
                    const { data: userData } = await supabase.auth.getUser();
                    authorId = userData.user?.id || null;
                }
                if (authorId) {
                    const { data } = await supabase
                        .from('series')
                        .select('id, title')
                        .eq('author_id', authorId)
                        .order('title');
                    if (isMounted && data) {
                        setAuthorSeriesList(data);
                    }
                }
            } catch (err) {
                console.error("Error fetching author series", err);
            }
        }
        fetchUserSeries();
        return () => { isMounted = false; };
    }, [editor.loadedAuthorId, editor.loadedSeriesId]);

    // Detect quality issues
    const hasCover = !!editor.coverPreview;
    const descriptionText = (editor.description || '').trim();
    const hasSynopsis = descriptionText.length >= 30 && descriptionText !== '...';
    const titleText = (editor.title || '').trim();
    const hasGoodTitle = titleText.length >= 3;
    const qualityIssues = [
        !hasCover && { label: 'Capa da obra', detail: 'Séries sem capa têm muito menos cliques.' },
        !hasSynopsis && { label: 'Sinopse da obra', detail: 'Uma boa sinopse desperta curiosidade e convida à leitura.' },
    ].filter(Boolean) as { label: string; detail: string }[];

    const hasQualityIssues = qualityIssues.length > 0;

    const proceedWithSubmit = () => {
        if (editor.isExplicit) {
            setIsExplicitConfirmOpen(true);
        } else {
            onSubmit(editor.isDraft);
        }
    };

    const handleSubmitClick = () => {
        if (!editor.validateForm()) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        if (hasQualityIssues) {
            setIsQualityWarningOpen(true);
        } else {
            proceedWithSubmit();
        }
    };

    const confirmSubmit = () => {
        if (!editor.validateForm()) return;
        onSubmit(editor.isDraft);
    };

    return (
        <div className="min-h-screen bg-muted/30 pb-12">
            <div className="content-wrapper py-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="space-y-1">
                        <BackButton className="mb-2" />
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                            {isEditing ? 'Editar Obra' : 'Nova Obra'}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {isEditing
                                ? 'Ajuste os detalhes técnicos e visuais da sua série.'
                                : 'Comece sua jornada definindo a alma da sua nova história.'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => router.back()}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmitClick}
                            disabled={editor.isPublishing || editor.isSaving}
                            className="font-bold shadow-sm"
                        >
                            {editor.isPublishing || editor.isSaving ? (
                                <>
                                    <ButtonSpinner className="mr-2" />
                                    Salvando...
                                </>
                            ) : (
                                isEditing ? 'Salvar Alterações' : 'Criar e Continuar'
                            )}
                        </Button>

                        <AlertDialog open={isExplicitConfirmOpen} onOpenChange={setIsExplicitConfirmOpen}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                        <AlertTriangle className="h-5 w-5" />
                                        Conteúdo Sensível
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="space-y-3 pt-2 text-foreground">
                                        <p>
                                            Você classificou esta obra como <strong>Conteúdo Adulto</strong>.
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Ao prosseguir, você confirma que possui todos os direitos sobre o conteúdo postado e assume total responsabilidade legal sobre ele.
                                            A <strong>Casa dos Escritores</strong> atua apenas como plataforma de hospedagem e não se responsabiliza pelo material publicado por seus usuários.
                                        </p>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => confirmSubmit()}
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold"
                                    >
                                        Concordo e Publicar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        {/* Quality Warning Dialog */}
                        <AlertDialog open={isQualityWarningOpen} onOpenChange={setIsQualityWarningOpen}>
                            <AlertDialogContent className="max-w-md">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                        <AlertTriangle className="h-5 w-5 text-red-600" />
                                        Sua obra pode se destacar mais
                                    </AlertDialogTitle>
                                    <AlertDialogDescription asChild>
                                        <div className="space-y-4 pt-1">
                                            <p className="text-sm text-muted-foreground">
                                                Identificamos pontos que podem reduzir o interesse dos leitores. Você pode corrigir agora ou salvar assim mesmo.
                                            </p>
                                            <div className="rounded-lg border bg-muted/40 divide-y">
                                                {[
                                                    { ok: hasCover, label: 'Capa da obra', detail: 'Séries com capa recebem muito mais cliques.' },
                                                    { ok: hasSynopsis, label: 'Sinopse', detail: 'Uma boa sinopse desperta curiosidade e convida à leitura.' },
                                                    { ok: hasGoodTitle, label: 'Título', detail: 'Um título marcante fica na memória dos leitores.' },
                                                ].map(({ ok, label, detail }) => (
                                                    <div key={label} className="flex items-start gap-3 px-4 py-3">
                                                        <span className={ok ? "text-green-500 mt-0.5 shrink-0" : "text-red-500 mt-0.5 shrink-0"}>
                                                            {ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className={`text-sm font-medium ${ok ? "text-foreground" : "text-foreground"}`}>
                                                                {label}
                                                            </p>
                                                            {!ok && (
                                                                <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
                                    <AlertDialogCancel
                                        onClick={() => {
                                            setIsQualityWarningOpen(false);
                                            proceedWithSubmit();
                                        }}
                                        className="w-full sm:w-auto mt-0"
                                    >
                                        Salvar assim mesmo
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => setIsQualityWarningOpen(false)}
                                        className="w-full sm:w-auto"
                                    >
                                        Voltar e Corrigir
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start">
                    <div className="space-y-6">
                        <Card className="overflow-hidden">
                            <CardHeader className="py-4 border-b">
                                <CardTitle className="text-sm font-semibold">Informações Literárias</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {editor.error && (
                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertDescription>{editor.error}</AlertDescription>
                                    </Alert>
                                )}
                                {editor.success && (
                                    <Alert className="border-green-200 bg-green-50 text-green-800">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <AlertDescription>{editor.success}</AlertDescription>
                                    </Alert>
                                )}

                                {editor.isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                                        <LoadingSpinner size="md" message="Carregando..." />
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="work-title">Título da Série</Label>
                                            <Input
                                                id="work-title"
                                                value={editor.title}
                                                onChange={(e) => editor.setTitle(e.target.value)}
                                                placeholder="Como se chama sua obra prima?"
                                                className="h-11"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2 col-span-1">
                                                <Label>Gênero(s)</Label>
                                                {hasMounted ? (
                                                    <div className="space-y-2">
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    className="w-full h-11 justify-between text-left font-normal rounded-md border-input hover:bg-accent/50"
                                                                >
                                                                    <span className="text-muted-foreground text-sm">
                                                                        {editor.genres && editor.genres.length > 0
                                                                            ? `${editor.genres.length} gênero(s) selecionado(s)`
                                                                            : "Selecione os gêneros..."}
                                                                    </span>
                                                                    <Plus className="h-4 w-4 opacity-50 shrink-0" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[300px] p-2 rounded-md" align="start" onWheel={(e) => e.stopPropagation()}>
                                                                <ScrollArea className="h-[250px] pr-2" onWheel={(e) => e.stopPropagation()}>
                                                                    <div className="space-y-1.5 p-1">
                                                                        {categories.map((c) => {
                                                                            const isSelected = editor.genres?.includes(c);
                                                                            return (
                                                                                <div key={c} className="flex items-center space-x-2 py-1 px-1.5 hover:bg-accent/30 rounded-md transition-colors">
                                                                                    <Checkbox
                                                                                        id={`edit-genre-${c}`}
                                                                                        checked={isSelected}
                                                                                        onCheckedChange={(checked) => {
                                                                                            const current = [...(editor.genres || [])];
                                                                                            if (checked) {
                                                                                                current.push(c);
                                                                                            } else {
                                                                                                const index = current.indexOf(c);
                                                                                                if (index > -1) current.splice(index, 1);
                                                                                            }
                                                                                            editor.setGenres(current);
                                                                                            editor.setCategory(current[0] || '');
                                                                                        }}
                                                                                    />
                                                                                    <label
                                                                                        htmlFor={`edit-genre-${c}`}
                                                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                                                                    >
                                                                                        {c}
                                                                                    </label>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </ScrollArea>
                                                            </PopoverContent>
                                                        </Popover>

                                                        {editor.genres && editor.genres.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5 mt-2 p-2 bg-muted/20 border rounded-md min-h-[42px] items-center">
                                                                {editor.genres.map((g: string) => (
                                                                    <Badge key={g} variant="secondary" className="flex items-center gap-1 py-0.5 pl-2.5 pr-1 text-xs font-semibold">
                                                                        {g}
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-4 w-4 p-0 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full"
                                                                            onClick={() => {
                                                                                const next = editor.genres.filter((x: string) => x !== g);
                                                                                editor.setGenres(next);
                                                                                editor.setCategory(next[0] || '');
                                                                            }}
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                        </Button>
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="h-11 w-full border rounded-md bg-muted/20 animate-pulse" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="work-description">Sinopse</Label>
                                            <Textarea
                                                id="work-description"
                                                value={editor.description}
                                                onChange={(e) => editor.setDescription(e.target.value)}
                                                placeholder="Escreva um resumo..."
                                                rows={6}
                                                className="resize-none"
                                            />
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="py-4 border-b">
                                <CardTitle className="text-sm font-semibold">Configurações Avançadas</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* IA Section — two independent selects */}
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-sm font-semibold">Uso de Inteligência Artificial</Label>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Informe leitores e escritores sobre o uso de IA nesta obra.
                                            </p>
                                        </div>
                                        {hasMounted && (
                                            <div className="space-y-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-medium text-muted-foreground">Texto</Label>
                                                    <Select
                                                        value={editor.isAIGenerated || 'no'}
                                                        onValueChange={(v) => editor.setIsAIGenerated(v)}
                                                    >
                                                        <SelectTrigger className="h-10">
                                                            <SelectValue placeholder="Selecione" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="no">Escrito por mim</SelectItem>
                                                            <SelectItem value="assisted">Escrito com auxílio de IA</SelectItem>
                                                            <SelectItem value="generated">Gerado por IA</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-medium text-muted-foreground">Capa</Label>
                                                    <Select
                                                        value={editor.aiCoverGenerated || 'no'}
                                                        onValueChange={(v) => editor.setAiCoverGenerated(v)}
                                                    >
                                                        <SelectTrigger className="h-10">
                                                            <SelectValue placeholder="Selecione" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="no">Arte por humano</SelectItem>
                                                            <SelectItem value="assisted">Arte com auxílio de IA</SelectItem>
                                                            <SelectItem value="generated">Gerada por IA</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Copyright Section — three options */}
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-sm font-semibold">Direitos Autorais</Label>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Define o que leitores podem ou não fazer com sua obra.
                                            </p>
                                        </div>
                                        <RadioGroup
                                            value={editor.copyrightType}
                                            onValueChange={(value) => editor.setCopyrightType(value as any)}
                                            className="grid grid-cols-1 gap-2"
                                        >
                                            <label className={cn(
                                                "flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                                                editor.copyrightType === 'all_rights_reserved' ? "border-primary bg-primary/5" : "bg-muted/50"
                                            )}>
                                                <RadioGroupItem value="all_rights_reserved" id="all_rights_reserved" className="mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium leading-none">© Todos os direitos reservados</p>
                                                    <p className="text-xs text-muted-foreground mt-1">Cópia ou distribuição proibida sem autorização.</p>
                                                </div>
                                            </label>
                                            <label className={cn(
                                                "flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                                                editor.copyrightType === 'cc_by_nc' ? "border-primary bg-primary/5" : "bg-muted/50"
                                            )}>
                                                <RadioGroupItem value="cc_by_nc" id="cc_by_nc" className="mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium leading-none">CC Creative Commons (CC BY-NC)</p>
                                                    <p className="text-xs text-muted-foreground mt-1">Compartilhável com crédito, uso não comercial.</p>
                                                </div>
                                            </label>
                                            <label className={cn(
                                                "flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                                                editor.copyrightType === 'public_domain' ? "border-primary bg-primary/5" : "bg-muted/50"
                                            )}>
                                                <RadioGroupItem value="public_domain" id="public_domain" className="mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium leading-none">Domínio Público</p>
                                                    <p className="text-xs text-muted-foreground mt-1">Qualquer pessoa pode usar livremente.</p>
                                                </div>
                                            </label>
                                        </RadioGroup>
                                    </div>
                                </div>

                                <div className="space-y-4 border-t pt-6">
                                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                                        <div className="space-y-1">
                                            <Label htmlFor="explicit-toggle" className="text-sm font-semibold flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                                Conteúdo Adulto (+18)
                                            </Label>
                                            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                                                Ao marcar esta opção, você declara que sua história contém temas maduros, violência ou conteúdo sexual.
                                                Leia nossas <Link href="/guidelines" target="_blank" className="underline hover:text-foreground">Diretrizes</Link>, <Link href="/terms" target="_blank" className="underline hover:text-foreground">Termos</Link> e <Link href="/privacy" target="_blank" className="underline hover:text-foreground">Privacidade</Link>.
                                            </p>
                                        </div>
                                        <Switch
                                            id="explicit-toggle"
                                            checked={editor.isExplicit}
                                            onCheckedChange={(checked) => editor.setIsExplicit(checked)}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                                        <div className="space-y-1">
                                            <Label htmlFor="comments-toggle" className="text-sm font-semibold flex items-center gap-2">
                                                <MessageSquare className="h-4 w-4 text-primary" />
                                                Permitir Comentários
                                            </Label>
                                            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                                                Permite que leitores comentem e deixem feedbacks no seu livro e capítulos.
                                            </p>
                                        </div>
                                        <Switch
                                            id="comments-toggle"
                                            checked={editor.commentsEnabled}
                                            onCheckedChange={(checked) => editor.setCommentsEnabled(checked)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="py-4 border-b">
                                <CardTitle className="text-sm font-semibold">Notas & Obras Relacionadas (Opcional)</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="work-author-note">Notas ou Avisos do Autor</Label>
                                        <span className="text-xs text-muted-foreground">Opcional</span>
                                    </div>
                                    <Textarea
                                        id="work-author-note"
                                        value={editor.authorNote || ''}
                                        onChange={(e) => editor.setAuthorNote(e.target.value)}
                                        placeholder="Ex: Avisos de gatilhos, classificação indicativa, ordem de leitura, etc."
                                        rows={4}
                                        className="resize-none"
                                    />
                                </div>

                                <div className="border-t pt-4 space-y-4">
                                    <div>
                                        <Label className="text-sm font-semibold">Obra Relacionada / Continuação</Label>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Selecione um livro do seu próprio catálogo para vincular como continuação ou obra do mesmo universo.
                                        </p>
                                    </div>
                                    {hasMounted && (
                                        <Select
                                            value={editor.relatedSeriesId || "none"}
                                            onValueChange={(val) => editor.setRelatedSeriesId(val === "none" ? null : val)}
                                        >
                                            <SelectTrigger id="work-related-select" className="h-10">
                                                <SelectValue placeholder="Selecione um livro do seu catálogo..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Nenhuma (livro único / sem vínculo)</SelectItem>
                                                {authorSeriesList
                                                    .filter((s) => s.id !== (editor.loadedSeriesId || ''))
                                                    .map((s) => (
                                                        <SelectItem key={s.id} value={s.id}>
                                                            {s.title}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <aside className="space-y-6 lg:sticky lg:top-8">
                        <Card>
                            <CardHeader className="py-4 border-b">
                                <CardTitle className="text-sm font-semibold">Capa</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={cn(
                                            "relative w-full aspect-[2/3] group cursor-pointer rounded-lg overflow-hidden border border-dashed border-muted-foreground/30 transition-all",
                                            "hover:bg-muted/50",
                                            editor.coverPreview ? "border-solid" : ""
                                        )}
                                    >
                                        {editor.coverPreview ? (
                                            <>
                                                <img src={editor.coverPreview} className="w-full h-full object-cover" alt="Capa" />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                                    <UploadCloud className="h-6 w-6 mb-2" />
                                                    <span className="text-sm font-medium">Alterar</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                                                <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                                                <p className="text-sm font-medium">Upload da capa</p>
                                                <p className="text-xs text-muted-foreground mt-1">Sugerido: 600×900px (14x21)</p>
                                            </div>
                                        )}
                                    </div>



                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={onCoverChange}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </div>
    );
}
