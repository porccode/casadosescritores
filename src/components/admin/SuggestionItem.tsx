"use client";

import { useState } from "react";
import {
    Mail, Calendar, Paperclip, Eye, Check, Trash2,
    Reply, Send, Loader2, CheckCircle2, UserCheck, UserX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import { Suggestion } from "@/types/admin";

interface SuggestionItemProps {
    suggestion: Suggestion;
    onToggleRead: (id: string, isRead: boolean) => void;
    onDelete: (id: string) => void;
    onReply: (id: string, content: string) => Promise<boolean>;
}

export function SuggestionItem({ suggestion: s, onToggleRead, onDelete, onReply }: SuggestionItemProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [wasReplied, setWasReplied] = useState(false);

    const handleSendReply = async () => {
        if (!replyContent.trim()) return;
        setIsSending(true);
        const success = await onReply(s.id, replyContent);
        setIsSending(false);
        if (success) {
            setIsReplying(false);
            setReplyContent("");
            setWasReplied(true);
        }
    };

    return (
        <div
            className={cn(
                "p-5 rounded-lg border transition-colors",
                !s.is_read && !wasReplied
                    ? "bg-primary/[0.03] border-primary/20"
                    : wasReplied
                    ? "bg-emerald-50/40 border-emerald-200/60 dark:bg-emerald-950/20 dark:border-emerald-800/40"
                    : "border-border hover:bg-muted/30"
            )}
        >
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    {!s.is_read && !wasReplied && (
                        <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                    )}
                    <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="font-medium text-foreground">{s.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground/70">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(s.created_at)}</span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Badge de usuário registrado/anônimo */}
                    {s.user_id ? (
                        <Badge variant="secondary" className="gap-1 text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                            <UserCheck className="h-3 w-3" />
                            Usuário registrado
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="gap-1 text-xs text-muted-foreground hover:bg-secondary" title="Mensagem enviada antes do sistema exigir login">
                            <UserX className="h-3 w-3" />
                            Anônimo (Legado)
                        </Badge>
                    )}

                    {wasReplied && (
                        <Badge className="gap-1 text-xs bg-emerald-500 text-white hover:bg-emerald-500 border-none">
                            <CheckCircle2 className="h-3 w-3" />
                            Respondido
                        </Badge>
                    )}
                </div>
            </div>

            {/* Mensagem */}
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap mb-4">
                {s.message}
            </p>

            {/* Anexo */}
            {s.image_url && (
                <a
                    href={s.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm text-primary hover:bg-primary/5 transition-colors mb-4"
                >
                    <Paperclip className="h-3.5 w-3.5" />
                    Ver anexo
                </a>
            )}

            {/* Painel de resposta */}
            {isReplying && (
                <div className="mt-2 mb-4 space-y-3 p-4 bg-muted/50 rounded-md border">
                    {!s.user_id && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <UserX className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>Mensagem antiga (antes da obrigatoriedade de login). Sua resposta ficará registrada apenas para histórico, pois <strong>não há como notificar</strong> este visitante.</span>
                        </p>
                    )}
                    {s.user_id && (
                        <p className="text-xs text-muted-foreground">
                            A resposta será enviada como notificação para o usuário na plataforma.
                        </p>
                    )}
                    <Textarea
                        placeholder="Digite sua resposta..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="min-h-[100px] resize-none"
                        disabled={isSending}
                        autoFocus
                    />
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setIsReplying(false); setReplyContent(""); }}
                            disabled={isSending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSendReply}
                            disabled={isSending || !replyContent.trim()}
                        >
                            {isSending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Send className="h-3.5 w-3.5 mr-2" />
                                    Enviar Resposta
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* Barra de ações — sempre visível */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/60">
                {/* Botão de resposta */}
                {!isReplying ? (
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 h-8 text-xs"
                        onClick={() => setIsReplying(true)}
                    >
                        <Reply className="h-3.5 w-3.5" />
                        {wasReplied ? "Responder novamente" : "Responder"}
                    </Button>
                ) : (
                    <div />
                )}

                {/* Ações secundárias */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-8 w-8 text-muted-foreground", !s.is_read && "text-primary")}
                        onClick={() => onToggleRead(s.id, s.is_read)}
                        title={s.is_read ? "Marcar como não lida" : "Marcar como lida"}
                    >
                        {s.is_read ? <Eye className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(s.id)}
                        title="Excluir"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
