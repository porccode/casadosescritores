"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import { toast } from "@/lib/toast";
import { showXPToast } from "@/lib/xp-toast";
import { XP_CONFIG } from "@/config/xp";
import { useAuth } from "@/components/providers/AuthProvider";
import {
    Edit,
    Trash2,
    Plus,
    Flag,
    CheckCircle2,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    BookOpen,
    MoreVertical,
    MessageSquare
} from "lucide-react";
import { createSummary, formatDate, generateSlug, sanitizeSlug, cn } from "@/lib/utils";
import { useConfirm } from "@/components/ConfirmModal";
import { ContentBlock } from "@/components/layout/ContentBlock";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadMoreButton } from "@/components/ui/LoadMoreButton";
import { FirstChapterTypeModal } from "@/components/editor/FirstChapterTypeModal";
import { ADMIN_ACCESS_PROFILE_SELECT, isAdminRole } from "@/lib/roles";

interface Chapter {
    id: string;
    title: string;
    chapter_number: number;
    series_id: string;
    author_id: string;
    published_at?: string;
    created_at: string;
    updated_at: string;
    is_scheduled?: boolean;
    is_archived?: boolean;
    is_draft?: boolean;
    slug?: string;
}

interface SeriesChaptersListProps {
    initialChapters: Chapter[];
    seriesId: string;
    seriesTitle: string;
    initialIsAuthor?: boolean;
    initialIsAdmin?: boolean;
    isCompleted: boolean;
    collapsible?: boolean;
    seriesAuthorId?: string;
}

export default function SeriesChaptersList({
    initialChapters,
    seriesId,
    seriesTitle,
    initialIsAuthor = false,
    initialIsAdmin = false,
    isCompleted: initialIsCompleted,
    collapsible = false,
    seriesAuthorId
}: SeriesChaptersListProps) {
    const [isAuthor, setIsAuthor] = useState(initialIsAuthor);
    const [isAdmin, setIsAdmin] = useState(initialIsAdmin);
    const router = useRouter();
    const supabase = createBrowserClient();
    const { user } = useAuth();

    const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
    const [isCompleted, setIsCompleted] = useState(initialIsCompleted);
    const [isExpanded, setIsExpanded] = useState(!collapsible);
    const [showAll, setShowAll] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [firstChapterModalOpen, setFirstChapterModalOpen] = useState(false);

    // Forçar recálculo de datas após hidratação no cliente
    // Isso resolve o problema de capítulos agendados que já passaram da hora de publicação
    const [clientNow, setClientNow] = useState<Date | null>(null);
    const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        // Atualizar para hora atual do cliente após hidratação
        setClientNow(new Date());
    }, []);

    useEffect(() => {
        if (chapters.length === 0) return;
        const fetchCommentCounts = async () => {
            try {
                const { data, error } = await supabase
                    .from("comments")
                    .select("chapter_id")
                    .in("chapter_id", chapters.map(c => c.id));
                if (error) {
                    console.error("Erro ao carregar contagem de comentários:", error);
                    return;
                }
                if (data) {
                    const counts: Record<string, number> = {};
                    data.forEach((item: any) => {
                        if (item.chapter_id) {
                            counts[item.chapter_id] = (counts[item.chapter_id] || 0) + 1;
                        }
                    });
                    setCommentCounts(counts);
                }
            } catch (err) {
                console.error("Exceção ao buscar contagem de comentários:", err);
            }
        };
        fetchCommentCounts();
    }, [chapters, supabase]);

    const { confirm: openConfirmDialog } = useConfirm();

    // Re-verify permissions on client to support ISR
    useEffect(() => {
        if (user) {
            // Usar o seriesAuthorId se fornecido, senão tentar pegar dos capítulos
            const authorId = seriesAuthorId || (chapters.length > 0 ? chapters[0].author_id : null);

            if (authorId && user.id === authorId) {
                setIsAuthor(true);
            }

            const checkAdmin = async () => {
                const { data } = await supabase
                    .from("profiles")
                    .select(ADMIN_ACCESS_PROFILE_SELECT)
                    .eq("id", user.id)
                    .single();
                if (isAdminRole(data)) setIsAdmin(true);
            };
            checkAdmin();
        }
    }, [user, chapters, supabase, seriesAuthorId]);

    const formatChapterDate = (dateString: string, includeTime = false) => {
        const date = new Date(dateString);
        const datePart = date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });

        if (includeTime) {
            const timePart = date.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit"
            });
            return `${datePart} às ${timePart}`;
        }

        return datePart;
    };

    const handleFinishSeries = async () => {
        const confirmed = await openConfirmDialog({
            title: "Finalizar Série",
            message: "Tem certeza que deseja finalizar esta série? O status mudará para 'Concluído!'.",
            confirmText: "Finalizar",
            type: "warning"
        });

        if (!confirmed) return;

        const { error } = await (supabase as any)
            .from("series")
            .update({ is_completed: true })
            .eq("id", seriesId);

        if (error) {
            setErrorMessage("Erro ao finalizar série: " + error.message);
            toast.error("Erro ao finalizar série: " + error.message);
            return;
        }

        setIsCompleted(true);
        showXPToast({
            amount: XP_CONFIG.WORK_FINISH.xp,
            action: XP_CONFIG.WORK_FINISH.action,
            message: "Série concluída com sucesso!"
        });
        router.refresh();
        setTimeout(() => setSuccessMessage(""), 3000);
    };

    const handleUnfinishSeries = async () => {
        const confirmed = await openConfirmDialog({
            title: "Reabrir Série",
            message: "Tem certeza que deseja reabrir esta série? O status mudará para 'Em andamento'.",
            confirmText: "Reabrir",
            type: "warning"
        });

        if (!confirmed) return;

        const { error } = await (supabase as any)
            .from("series")
            .update({ is_completed: false })
            .eq("id", seriesId);

        if (error) {
            setErrorMessage("Erro ao reabrir série: " + error.message);
            toast.error("Erro ao reabrir série: " + error.message);
            return;
        }

        setIsCompleted(false);
        toast.success("Série reaberta com sucesso!");
        router.refresh();
    };

    const handleConfirmDelete = async (id: string, title: string) => {
        const confirmed = await openConfirmDialog({
            title: "Excluir Capítulo",
            message: `Tem certeza que deseja excluir o capítulo "${title || 'este capítulo'}"? Esta ação não pode ser desfeita.`,
            confirmText: "Excluir",
            type: "danger"
        });

        if (!confirmed) return;

        setDeleting(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const response = await fetch(`/api/chapters?id=${id}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Erro ao excluir capítulo");
            }

            setChapters(chapters.filter((chapter) => chapter.id !== id));
            setSuccessMessage("Capítulo excluído com sucesso!");
            router.refresh();

            setTimeout(() => setSuccessMessage(""), 3000);

        } catch (err: any) {
            console.error("Erro ao excluir capítulo:", err);
            setErrorMessage(`Erro ao excluir capítulo: ${err.message}`);
            setTimeout(() => setErrorMessage(""), 5000);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
        <TooltipProvider>
            <ContentBlock
                title="Capítulos"
                variant="outline"
                icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
                count={chapters.length}
                headerActions={
                    <div className="flex items-center gap-2">
                        {(isAuthor || isAdmin) && (
                            <div className="flex items-center gap-2 ml-1">
                                {/* Finalizar: só aparece se tiver pelo menos 1 capítulo */}
                                {chapters.length > 0 && (
                                    !isCompleted ? (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    onClick={handleFinishSeries}
                                                    className="h-8 bg-green-500 hover:bg-green-600 text-white border-none"
                                                >
                                                    <Flag className="h-4 w-4 sm:mr-2" />
                                                    <span className="hidden sm:inline">Finalizar</span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Marcar série como concuída</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    ) : (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={handleUnfinishSeries}
                                                    className="h-8"
                                                >
                                                    <Flag className="h-4 w-4 sm:mr-2" />
                                                    <span className="hidden sm:inline">Reabrir</span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Reabrir série (voltar para em andamento)</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )
                                )}

                                {/* Botão principal: muda conforme os capítulos */}
                                {chapters.length === 0 ? (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                size="sm"
                                                onClick={() => setFirstChapterModalOpen(true)}
                                                className="h-8 bg-primary hover:bg-primary/90 text-white border-none shadow-sm font-bold gap-2 animate-pulse"
                                            >
                                                <Plus className="h-4 w-4" strokeWidth={3} />
                                                <span>Escreva o Primeiro Capítulo</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Comece escrevendo o primeiro capítulo da sua obra</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ) : (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button size="sm" asChild className="h-8 bg-primary hover:bg-primary/90 text-white border-none shadow-sm font-bold">
                                                <Link href={`/escrever?seriesId=${seriesId}`}>
                                                    <Plus className="h-4 w-4 sm:mr-2" strokeWidth={3} />
                                                    <span className="hidden sm:inline">Novo Capítulo</span>
                                                </Link>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Adicionar novo capítulo</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                        )}
                    </div>
                }
                bodyClassName="p-0"
            >
                {/* Feedback Messages */}
                {successMessage && (
                    <Alert className="mb-4 bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700 font-medium">
                            {successMessage}
                        </AlertDescription>
                    </Alert>
                )}
                {errorMessage && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="font-medium">{errorMessage}</AlertDescription>
                    </Alert>
                )}

                {/* Chapter List */}
                <div className="transition-all duration-300 ease-in-out">
                    {chapters.length === 0 ? (
                        <div className="p-8 text-center bg-muted/10">
                            <p className="text-sm text-muted-foreground">
                                Nenhum capítulo disponível ainda.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col relative">
                            {(() => {
                                let scheduledCounter = 0;
                                return chapters.map((chapter, index) => {
                                    // Recalcular is_scheduled no cliente para evitar problemas de cache ISR
                                    // Usa clientNow (atualizado após hidratação) para garantir hora correta do cliente
                                    const publishedAt = chapter.published_at ? new Date(chapter.published_at) : null;
                                    const now = clientNow || new Date();
                                    const isScheduled = !chapter.is_draft && publishedAt && publishedAt.getTime() > now.getTime();

                                    if (isScheduled) scheduledCounter++;
                                    const isEvenScheduled = scheduledCounter % 2 === 0;

                                    const isLocked = ((isScheduled || chapter.is_draft) && !isAuthor && !isAdmin);
                                    const isLast = index === chapters.length - 1;

                                    return (
                                        <div
                                            key={chapter.id}
                                            className={cn(
                                                "group flex items-center justify-between p-4 border-b border-border transition-colors relative overflow-hidden",
                                                isScheduled
                                                    ? cn(
                                                        "bg-slate-50/30 bg-[length:200%_100%]",
                                                        !isEvenScheduled
                                                            ? "bg-[linear-gradient(90deg,transparent_0%,rgba(255,210,215,0.4)_25%,rgba(146,151,255,0.4)_50%,rgba(255,210,215,0.4)_75%,transparent_100%)] animate-[ai-shimmer-reverse_12s_infinite_linear]"
                                                            : "bg-[linear-gradient(90deg,transparent_0%,rgba(168,85,247,0.4)_25%,rgba(34,211,238,0.4)_50%,rgba(168,85,247,0.4)_75%,transparent_100%)] animate-[ai-shimmer_12s_infinite_linear]"
                                                    )
                                                    : (isLocked ? "opacity-40 grayscale pointer-events-none select-none" : "hover:bg-muted/50 cursor-pointer"),
                                                isScheduled && isLocked && "pointer-events-none select-none",
                                                isLast && "border-b-0 rounded-b-xl"
                                            )}
                                            onClick={() => {
                                                if (isLocked) return;
                                                // @ts-ignore - slug existe no banco
                                                router.push(`/capitulo/${chapter.slug || generateSlug(chapter.title, chapter.id)}`);
                                            }}
                                            onMouseEnter={() => {
                                                if (isLocked || isScheduled) return;
                                                // @ts-ignore
                                                router.prefetch(`/capitulo/${chapter.slug || generateSlug(chapter.title, chapter.id)}`);
                                            }}
                                        >
                                            <div className="flex flex-col flex-grow min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className={cn(
                                                        "text-base font-semibold truncate",
                                                        isScheduled
                                                            ? "text-muted-foreground/60 italic"
                                                            : (chapter.is_draft ? 'text-muted-foreground' : 'text-foreground group-hover:underline')
                                                    )}>
                                                        {chapter.is_draft
                                                            ? `Em edição pelo autor`
                                                            : chapter.title
                                                        }
                                                    </h4>
                                                    {chapter.is_draft && (isAuthor || isAdmin) && (
                                                        <Badge variant="outline" className="text-[10px] font-medium bg-yellow-500/10 text-yellow-700 border-yellow-200 py-0 h-4">
                                                            Rascunho
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                                                    {isScheduled && !chapter.is_draft ? (
                                                        <span className="text-red-600 font-bold text-[10px]">
                                                            Agendado para {formatChapterDate(chapter.published_at!, true)}
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            {formatChapterDate(chapter.published_at || chapter.created_at)}
                                                            {chapter.updated_at && (new Date(chapter.updated_at).getTime() - new Date(chapter.published_at || chapter.created_at).getTime() > 60000) && (
                                                                <span className="ml-1 text-muted-foreground/50 italic">(editado)</span>
                                                            )}
                                                        </span>
                                                    )}

                                                </div>
                                            </div>

                                            {/* Row Actions (Comments Badge and Kebab Menu) */}
                                            <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                {((commentCounts && commentCounts[chapter.id]) || 0) > 0 && (
                                                    <Badge className="flex items-center gap-1 h-5 px-2 text-[10px] font-bold bg-primary text-white hover:bg-primary border-none rounded-full shrink-0">
                                                        <MessageSquare className="h-3 w-3 fill-current" />
                                                        {commentCounts[chapter.id]}
                                                    </Badge>
                                                )}

                                                {(isAuthor || isAdmin) && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-32">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/escrever?action=edit&type=chapter&id=${chapter.id}`} className="flex items-center gap-2">
                                                                    <Edit className="h-4 w-4" />
                                                                    Editar
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive flex items-center gap-2"
                                                                onClick={() => handleConfirmDelete(chapter.id, chapter.title)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                Excluir
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            })()}

                        </div>
                    )}
                </div>
            </ContentBlock>

        </TooltipProvider>

        {/* Modal de escolha do primeiro capítulo — só disparado aqui */}
        <FirstChapterTypeModal
            isOpen={firstChapterModalOpen}
            onSelect={(choice) => {
                setFirstChapterModalOpen(false);
                const titleParam = choice === 'prologue'
                    ? 'Pr%C3%B3logo'
                    : 'Cap%C3%ADtulo+1+-+'; // URL-encoded defaults
                router.push(
                    `/escrever?seriesId=${seriesId}&firstChapterType=${choice}`
                );
            }}
        />
        </>
    );
}
