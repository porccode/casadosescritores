"use client";

import { useState, useEffect, useCallback } from "react";
import { History, RotateCcw, Loader2 } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

interface Version {
    id: string;
    title: string | null;
    word_count: number;
    source: "autosave" | "manual" | "publish";
    created_at: string;
    content: any;
}

interface VersionHistoryProps {
    chapterId: string;
    onRestore: (content: any, title: string | null) => void;
}

const sourceLabels: Record<string, string> = {
    autosave: "Auto",
    manual: "Manual",
    publish: "Publicação",
};

/**
 * Sheet com histórico de versões de um capítulo.
 * Permite visualizar e restaurar versões anteriores.
 */
export default function VersionHistory({ chapterId, onRestore }: VersionHistoryProps) {
    const [versions, setVersions] = useState<Version[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const supabase = createBrowserClient();

    const fetchVersions = useCallback(async () => {
        if (!chapterId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("chapter_versions")
                .select("id, title, word_count, source, created_at, content")
                .eq("chapter_id", chapterId)
                .order("created_at", { ascending: false })
                .limit(30);

            if (error) throw error;
            setVersions((data as Version[]) || []);
        } catch (err) {
            console.error("Erro ao carregar versões:", err);
        } finally {
            setLoading(false);
        }
    }, [chapterId, supabase]);

    useEffect(() => {
        if (open) fetchVersions();
    }, [open, fetchVersions]);

    const handleRestore = (version: Version) => {
        onRestore(version.content, version.title);
        setOpen(false);
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <History className="h-4 w-4" />
                    <span className="hidden sm:inline">Histórico</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Histórico de Versões</SheetTitle>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : versions.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Nenhuma versão salva ainda.</p>
                            <p className="text-xs mt-1">O autosave criará versões automaticamente.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {versions.map((version, index) => (
                                <div key={version.id}>
                                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors group">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-medium truncate">
                                                    {version.title || "Sem título"}
                                                </span>
                                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 shrink-0">
                                                    {sourceLabels[version.source] || version.source}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span>{formatDate(version.created_at)}</span>
                                                {version.word_count > 0 && (
                                                    <span>{version.word_count.toLocaleString("pt-BR")} palavras</span>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRestore(version)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 gap-1.5"
                                        >
                                            <RotateCcw className="h-3.5 w-3.5" />
                                            Restaurar
                                        </Button>
                                    </div>
                                    {index < versions.length - 1 && <Separator />}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
