"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useConfirm } from "@/components/ConfirmModal";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
    ArrowRight,
    ArrowLeft,
    AlertTriangle,
    UploadCloud,
    Check,
    Sparkles,
    CheckCircle2,
    Plus,
    X,
    PartyPopper,
    NotebookPen,
    ScrollText,
    Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonSpinner } from "@/components/ui/loading-states";
import confetti from "canvas-confetti";

interface WorkCreationWizardProps {
    editor: any;
    categories: string[];
    hasMounted: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onCoverChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClose?: () => void;
}

type StepType = 1 | 2 | 3 | 4;

export default function WorkCreationWizard({
    editor,
    categories,
    hasMounted,
    fileInputRef,
    onCoverChange,
    onClose,
}: WorkCreationWizardProps) {
    const router = useRouter();
    const { confirm } = useConfirm();
    const [step, setStep] = useState<StepType>(1);
    const [createdSeriesId, setCreatedSeriesId] = useState<string | null>(null);
    const [isFirstBook, setIsFirstBook] = useState(false);
    const [isExplicitConfirmOpen, setIsExplicitConfirmOpen] = useState(false);
    const [isQualityWarningOpen, setIsQualityWarningOpen] = useState(false);
    const [authorSeriesList, setAuthorSeriesList] = useState<{ id: string; title: string }[]>([]);

    React.useEffect(() => {
        let isMounted = true;
        async function fetchUserSeries() {
            try {
                const supabase = createBrowserClient();
                const { data: sessionData } = await supabase.auth.getSession();
                let userId = sessionData.session?.user?.id;
                if (!userId) {
                    const { data: userData } = await supabase.auth.getUser();
                    userId = userData.user?.id;
                }
                if (userId) {
                    const { data } = await supabase
                        .from('series')
                        .select('id, title')
                        .eq('author_id', userId)
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
    }, []);

    // Detect quality issues
    const hasCover = !!editor.coverPreview;
    const descriptionText = (editor.description || '').trim();
    const hasSynopsis = descriptionText.length >= 30 && descriptionText !== '...';
    const titleText = (editor.title || '').trim();
    const hasGoodTitle = titleText.length >= 3;
    const qualityIssues = [
        !hasCover && { label: 'Capa da obra', detail: 'Séries sem capa recebem muito menos cliques.' },
        !hasSynopsis && { label: 'Sinopse da obra', detail: 'Uma boa sinopse desperta curiosidade e convida à leitura.' },
        !hasGoodTitle && { label: 'Título', detail: 'Um título marcante fica na memória dos leitores.' }
    ].filter(Boolean) as { label: string; detail: string }[];
    const hasQualityIssues = qualityIssues.length > 0;

    // Validation for Step 1
    const handleNextFromStep1 = () => {
        editor.setError(null);
        if (!editor.title.trim()) {
            editor.setError("O título da obra é obrigatório.");
            return;
        }
        if (!editor.genres || editor.genres.length === 0) {
            editor.setError("O gênero literário é obrigatório.");
            return;
        }
        if (!editor.description.trim()) {
            editor.setError("A sinopse é obrigatória.");
            return;
        }
        setStep(2);
    };

    const confirmSubmit = async () => {
        editor.setError(null);
        const res = await editor.handleSubmit(editor.isDraft);
        if (res.success && res.data?.id) {
            setCreatedSeriesId(res.data.id);
            const firstBook = !!(res.data as any).isFirstBook;
            setIsFirstBook(firstBook);
            // Confetti sempre — gratuito ou não, é uma conquista!
            confetti({
                particleCount: firstBook ? 120 : 80,
                spread: firstBook ? 80 : 60,
                origin: { y: 0.7 }
            });
            setStep(4);
        }
    };

    const proceedWithSubmit = () => {
        if (editor.isExplicit) {
            setIsExplicitConfirmOpen(true);
        } else {
            confirmSubmit();
        }
    };

    // Handler for creating the work in Step 3
    const handleCreateWork = () => {
        if (hasQualityIssues) {
            setIsQualityWarningOpen(true);
        } else {
            proceedWithSubmit();
        }
    };

    // Handle closing the wizard early (with confirmation)
    const handleOpenChange = async (open: boolean) => {
        if (!open) {
            if (onClose) {
                onClose();
                return;
            }
            if (step === 4) {
                if (createdSeriesId) {
                    router.push(`/series/${createdSeriesId}`);
                } else {
                    router.push("/");
                }
            } else {
                const confirmed = await confirm({
                    title: "Cancelar Criação",
                    message: "Deseja mesmo cancelar a criação da obra? Suas alterações serão perdidas.",
                    confirmText: "Sim, cancelar",
                    cancelText: "Continuar editando",
                    type: "warning",
                });
                if (confirmed) {
                    router.back();
                }
            }
        }
    };

    return (
        <Dialog open={true} onOpenChange={handleOpenChange}>
            <DialogContent 
                className="max-w-2xl w-[94vw] md:w-full overflow-hidden p-0 rounded-xl border bg-background shadow-lg flex flex-col max-h-[90vh]"
                hideClose={step === 4 || editor.isSaving || editor.isPublishing}
                onPointerDownOutside={(e) => { if (!onClose) e.preventDefault(); }}
                onEscapeKeyDown={(e) => { if (!onClose) e.preventDefault(); }}
            >
                {/* Clean, minimalist wizard header */}
                <DialogHeader className={cn("border-b px-6 py-5 bg-background text-left space-y-1.5", step === 4 && "sr-only")}>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                            {step < 4 ? "Nova Obra" : "Obra Criada"}
                        </DialogTitle>
                        {step < 4 && (
                            <span className="text-xs font-medium text-muted-foreground">
                                Passo {step} de 3
                            </span>
                        )}
                    </div>
                    {step < 4 && (
                        <div className="flex gap-1.5 h-1 w-full pt-1">
                            <div className={cn("h-full flex-1 rounded-full transition-all duration-300", step >= 1 ? "bg-primary" : "bg-muted")} />
                            <div className={cn("h-full flex-1 rounded-full transition-all duration-300", step >= 2 ? "bg-primary" : "bg-muted")} />
                            <div className={cn("h-full flex-1 rounded-full transition-all duration-300", step >= 3 ? "bg-primary" : "bg-muted")} />
                        </div>
                    )}
                    <DialogDescription className="sr-only">
                        {step < 4 ? "Preencha as informações para registrar sua nova obra." : "Sua nova obra foi criada com sucesso."}
                    </DialogDescription>
                </DialogHeader>

                <AlertDialog open={isExplicitConfirmOpen} onOpenChange={setIsExplicitConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                <AlertTriangle className="h-5 w-5" />
                                Conteúdo Sensível
                            </AlertDialogTitle>
                            <AlertDialogDescription className="space-y-3 pt-2 text-foreground">
                                <p>Você classificou esta obra como <strong>Conteúdo Adulto</strong>.</p>
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
                                        Identificamos pontos que podem reduzir o interesse dos leitores. Você pode corrigir agora ou criar assim mesmo.
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
                                                    <p className={`text-sm font-medium text-foreground`}>
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
                                Criar assim mesmo
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

                {/* Main Scrollable Form Area */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                    {/* Error Alerts */}
                    {editor.error && (
                        <div className="flex items-start gap-3 p-3.5 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive">
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                            <div className="text-sm font-medium">{editor.error}</div>
                        </div>
                    )}

                    {/* STEP 1: Basic Information */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in-50 duration-200">
                            <div>
                                <h3 className="text-base font-semibold text-foreground">Informações Básicas</h3>
                                <p className="text-sm text-muted-foreground mt-0.5">Defina o título e a categoria principal da sua nova história.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="wiz-title" className="text-sm font-medium">Título da Série</Label>
                                <Input
                                    id="wiz-title"
                                    value={editor.title}
                                    onChange={(e) => editor.setTitle(e.target.value)}
                                    placeholder="Ex: O Peso do Silêncio"
                                    className="h-10 border-input focus-visible:ring-primary rounded-lg"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Gênero(s) Literário(s)</Label>
                                {hasMounted ? (
                                    <div className="space-y-2">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="w-full h-10 justify-between text-left font-normal rounded-lg border-input hover:bg-accent/50"
                                                >
                                                    <span className="text-muted-foreground text-sm">
                                                        {editor.genres && editor.genres.length > 0
                                                            ? `${editor.genres.length} gênero(s) selecionado(s)`
                                                            : "Selecione os gêneros..."}
                                                    </span>
                                                    <Plus className="h-4 w-4 opacity-50 shrink-0" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-2 rounded-lg" align="start" onWheel={(e) => e.stopPropagation()}>
                                                <ScrollArea className="h-[250px] pr-2" onWheel={(e) => e.stopPropagation()}>
                                                    <div className="space-y-1.5 p-1">
                                                        {categories.map((c) => {
                                                            const isSelected = editor.genres?.includes(c);
                                                            return (
                                                                <div key={c} className="flex items-center space-x-2 py-1 px-1.5 hover:bg-accent/30 rounded-md transition-colors">
                                                                    <Checkbox
                                                                        id={`genre-${c}`}
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
                                                                        htmlFor={`genre-${c}`}
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
                                            <div className="flex flex-wrap gap-1.5 mt-2 p-2 bg-muted/20 border rounded-lg min-h-[42px] items-center">
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
                                    <div className="h-10 w-full border rounded-lg bg-muted/20 animate-pulse" />
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="wiz-description" className="text-sm font-medium">Sinopse</Label>
                                    <span className="text-xs text-muted-foreground">
                                        {editor.description?.trim().length || 0} / 30 caracteres mín.
                                    </span>
                                </div>
                                <Textarea
                                    id="wiz-description"
                                    value={editor.description}
                                    onChange={(e) => editor.setDescription(e.target.value)}
                                    placeholder="Apresente os conflitos principais, o protagonista e o tom da história para atrair os leitores..."
                                    rows={5}
                                    className="resize-none border-input focus-visible:ring-primary rounded-lg p-3 leading-relaxed"
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Settings & Rights */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in-50 duration-200">
                            <div>
                                <h3 className="text-base font-semibold text-foreground">Configurações da Obra</h3>
                                <p className="text-sm text-muted-foreground mt-0.5">Configure o licenciamento e declarações de autoria da sua história.</p>
                            </div>

                            {/* IA Section - Pristine, clean, non-gamified */}
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-sm font-semibold text-foreground">
                                        Declaração de Inteligência Artificial
                                    </Label>
                                    <p className="text-xs text-muted-foreground">Indique de forma transparente o uso de ferramentas de IA na sua obra.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="ia-text" className="text-xs font-semibold text-muted-foreground">Texto</Label>
                                        <Select value={editor.isAIGenerated || 'no'} onValueChange={editor.setIsAIGenerated}>
                                            <SelectTrigger id="ia-text" className="h-10 rounded-lg">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="no">100% Humano (Escrito por mim)</SelectItem>
                                                <SelectItem value="assisted">Escrito com auxílio de IA</SelectItem>
                                                <SelectItem value="generated">Gerado inteiramente por IA</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ia-cover" className="text-xs font-semibold text-muted-foreground">Imagem de Capa</Label>
                                        <Select value={editor.aiCoverGenerated || 'no'} onValueChange={editor.setAiCoverGenerated}>
                                            <SelectTrigger id="ia-cover" className="h-10 rounded-lg">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="no">100% Humano (Criada por mim/Designer)</SelectItem>
                                                <SelectItem value="assisted">Arte editada com auxílio de IA</SelectItem>
                                                <SelectItem value="generated">Gerada integralmente por IA</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Copyright Options - Pure, clean Shadcn list */}
                            <div className="space-y-2">
                                <Label htmlFor="copyright-select" className="text-sm font-semibold text-foreground">Direitos Autorais e Licenciamento</Label>
                                <Select value={editor.copyrightType} onValueChange={(val) => editor.setCopyrightType(val as any)}>
                                    <SelectTrigger id="copyright-select" className="h-10 rounded-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all_rights_reserved">Todos os Direitos Reservados (Padrão)</SelectItem>
                                        <SelectItem value="cc_by_nc">Creative Commons (BY-NC - Livre com atribuição, não comercial)</SelectItem>
                                        <SelectItem value="public_domain">Domínio Público (Livre para qualquer uso)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Explicit / 18+ Option - Minimalist & Clean */}
                            <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                                <div className="space-y-0.5 text-left">
                                    <Label htmlFor="wiz-explicit" className="text-sm font-semibold text-foreground">
                                        Conteúdo Sensível (+18)
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Contém cenas de violência explícita, temas sensíveis ou conteúdo adulto.
                                    </p>
                                </div>
                                <Switch
                                    id="wiz-explicit"
                                    checked={editor.isExplicit}
                                    onCheckedChange={(checked) => editor.setIsExplicit(checked)}
                                />
                            </div>

                            {/* Allow Comments Option - Minimalist & Clean */}
                            <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                                <div className="space-y-0.5 text-left">
                                    <Label htmlFor="wiz-comments" className="text-sm font-semibold text-foreground">
                                        Permitir Comentários
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Permite que leitores comentem e deixem feedbacks no seu livro e capítulos.
                                    </p>
                                </div>
                                <Switch
                                    id="wiz-comments"
                                    checked={editor.commentsEnabled}
                                    onCheckedChange={(checked) => editor.setCommentsEnabled(checked)}
                                />
                            </div>

                            {/* Author Note and Related Work Section */}
                            <div className="border-t pt-6 space-y-4">
                                <h4 className="text-sm font-semibold text-foreground">Notas e Recomendações (Opcional)</h4>
                                <div className="space-y-2">
                                    <Label htmlFor="wiz-author-note" className="text-xs font-semibold text-muted-foreground">Notas ou Avisos do Autor</Label>
                                    <Textarea
                                        id="wiz-author-note"
                                        value={editor.authorNote || ''}
                                        onChange={(e) => editor.setAuthorNote(e.target.value)}
                                        placeholder="Ex: Avisos de gatilhos, classificação indicativa, ordem de leitura, etc."
                                        rows={3}
                                        className="resize-none rounded-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="wiz-related-select" className="text-xs font-semibold text-muted-foreground">Obra Relacionada / Continuação</Label>
                                    <Select
                                        value={editor.relatedSeriesId || "none"}
                                        onValueChange={(val) => editor.setRelatedSeriesId(val === "none" ? null : val)}
                                    >
                                        <SelectTrigger id="wiz-related-select" className="h-10 rounded-lg">
                                            <SelectValue placeholder="Selecione um livro do seu catálogo..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Nenhuma (livro único / sem vínculo)</SelectItem>
                                            {authorSeriesList.map((s) => (
                                                <SelectItem key={s.id} value={s.id}>
                                                    {s.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Visual Identity (Cover) */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in-50 duration-200">
                            <div>
                                <h3 className="text-base font-semibold text-foreground">Capa da Obra</h3>
                                <p className="text-sm text-muted-foreground mt-0.5">Envie uma imagem de capa (proporção sugerida 14x21 ou 2:3).</p>
                            </div>

                            <div className="flex flex-col items-center justify-center py-2">
                                <div className="w-48 max-w-full">
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={cn(
                                            "relative w-full aspect-[2/3] group cursor-pointer rounded-xl overflow-hidden border border-dashed border-muted-foreground/30 transition-all duration-300",
                                            "hover:border-primary hover:bg-muted/30 flex flex-col items-center justify-center p-2 text-center",
                                            editor.coverPreview ? "border-solid border-primary" : ""
                                        )}
                                    >
                                        {editor.coverPreview ? (
                                            <>
                                                <img src={editor.coverPreview} className="w-full h-full object-cover rounded-lg" alt="Capa" />
                                                <div className="absolute inset-0 bg-background/85 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-lg">
                                                    <UploadCloud className="h-5 w-5 mb-1.5 text-primary" />
                                                    <span className="text-xs font-semibold text-foreground">Alterar Capa</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center p-4">
                                                <div className="bg-muted p-3 rounded-full mb-3 text-muted-foreground group-hover:text-primary transition-colors">
                                                    <UploadCloud className="h-6 w-6" />
                                                </div>
                                                <p className="text-xs font-bold text-foreground">Escolher Imagem</p>
                                                <p className="text-[10px] text-muted-foreground mt-1.5">Dimensões ideais:<br/>600×900px</p>
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
                            </div>

                            {!editor.coverPreview && (
                                <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive">
                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                    <AlertDescription className="text-xs leading-relaxed font-semibold">
                                        Você pode continuar sem capa por enquanto. Mas lembre-se: adicionar uma imagem futuramente é altamente recomendado para atrair mais leitores!
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}

                    {/* STEP 4: Success & Choices */}
                    {step === 4 && (
                        <div className="py-8 text-center space-y-6 animate-in zoom-in-98 duration-300">
                            <div className="flex flex-col items-center justify-center space-y-3">
                                <div className="h-14 w-14 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                                    <PartyPopper className="h-7 w-7" />
                                </div>
                                <h2 className="text-xl font-semibold text-foreground tracking-tight">
                                    Obra Criada com Sucesso
                                </h2>
                                <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
                                    Sua nova série foi registrada. Escolha como deseja iniciar o conteúdo dela.
                                </p>
                            </div>

                            {isFirstBook ? (
                                <div className="max-w-sm mx-auto bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-1.5 animate-in fade-in-50 duration-500">
                                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
                                        <Sparkles className="h-4 w-4 shrink-0" /> Primeiro Livro Gratuito!
                                    </span>
                                    <p className="text-xs text-muted-foreground text-center leading-normal">
                                        Sua estreia é totalmente gratuita. Publique quantos capítulos quiser e ganhe <strong className="text-foreground">+35 XP por capítulo</strong> publicado!
                                    </p>
                                </div>
                            ) : (
                                <div className="max-w-sm mx-auto bg-muted/50 border border-border rounded-xl p-3 flex items-center gap-3 animate-in fade-in-50 duration-500">
                                    <div className="h-8 w-8 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                                        <Zap className="h-4 w-4" />
                                    </div>
                                    <div className="text-left">
                                        <span className="text-xs font-bold text-foreground block">Energia Criativa Consumida: −500 XP</span>
                                        <p className="text-[11px] text-muted-foreground leading-snug">Você investiu 500 XP do seu saldo de inspiração para dar vida a esta série.</p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto pt-1">
                                {/* Option 1: Chapter 1 */}
                                <button
                                    onClick={() => {
                                        window.location.href = `/escrever?type=chapter&seriesId=${createdSeriesId}&firstChapterType=chapter_1`;
                                    }}
                                    className="group flex flex-col items-center justify-between gap-3 p-5 rounded-2xl border border-border bg-card hover:border-primary hover:shadow-md active:scale-[0.98] transition-all duration-200 text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <div className="h-12 w-12 bg-primary/10 text-primary group-hover:scale-110 rounded-full flex items-center justify-center transition-all duration-300">
                                        <NotebookPen className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors whitespace-nowrap">
                                            Capítulo 1
                                        </h4>
                                        <p className="text-xs text-muted-foreground leading-snug">
                                            Inicie a narrativa diretamente no primeiro capítulo oficial.
                                        </p>
                                    </div>
                                    <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:gap-1.5 transition-all duration-200">
                                        Selecionar <ArrowRight className="h-3 w-3" />
                                    </span>
                                </button>

                                {/* Option 2: Prologue */}
                                <button
                                    onClick={() => {
                                        window.location.href = `/escrever?type=chapter&seriesId=${createdSeriesId}&firstChapterType=prologue`;
                                    }}
                                    className="group flex flex-col items-center justify-between gap-3 p-5 rounded-2xl border border-border bg-card hover:border-primary hover:shadow-md active:scale-[0.98] transition-all duration-200 text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <div className="h-12 w-12 bg-primary/10 text-primary group-hover:scale-110 rounded-full flex items-center justify-center transition-all duration-300">
                                        <ScrollText className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors whitespace-nowrap">
                                            Prólogo
                                        </h4>
                                        <p className="text-xs text-muted-foreground leading-snug">
                                            Apresente o lore ou contexto antes do Capítulo 1.
                                        </p>
                                    </div>
                                    <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:gap-1.5 transition-all duration-200">
                                        Selecionar <ArrowRight className="h-3 w-3" />
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                {step < 4 && (
                    <div className="border-t px-6 py-4 bg-muted/10 flex items-center justify-between">
                        {step > 1 ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStep((step - 1) as any)}
                                disabled={editor.isSaving || editor.isPublishing}
                                className="h-9 px-4 rounded-lg gap-2 text-sm font-medium"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Voltar
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={async () => {
                                    const confirmed = await confirm({
                                        title: "Cancelar Criação",
                                        message: "Deseja mesmo cancelar a criação da obra? Suas alterações serão perdidas.",
                                        confirmText: "Sim, cancelar",
                                        cancelText: "Continuar editando",
                                        type: "warning",
                                    });
                                    if (confirmed) {
                                        router.back();
                                    }
                                }}
                                className="h-9 px-4 rounded-lg text-muted-foreground text-sm font-medium"
                            >
                                Cancelar
                            </Button>
                        )}

                        {step < 3 ? (
                            <Button
                                type="button"
                                onClick={step === 1 ? handleNextFromStep1 : () => setStep((step + 1) as any)}
                                className="h-9 px-4 rounded-lg gap-2 text-sm font-medium"
                            >
                                Avançar
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleCreateWork}
                                disabled={editor.isSaving || editor.isPublishing}
                                className="h-9 px-5 rounded-lg text-sm font-medium min-w-[110px]"
                            >
                                {editor.isSaving || editor.isPublishing ? (
                                    <>
                                        <ButtonSpinner className="mr-2" />
                                        Salvando...
                                    </>
                                ) : (
                                    "Criar Obra"
                                )}
                            </Button>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
