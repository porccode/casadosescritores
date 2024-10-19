"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { XP_METHODS } from "@/config/xp";
import {
    Sparkles,
    BookOpen,
    PenLine,
    MessageSquare,
    Heart,
    Gift,
    BookMarked,
    Bookmark,
    FileText,
    Trophy,
    Globe,
    Flag,
    Pencil,
    Trash2,
    Star,
    Share2
} from "lucide-react";

interface XPInfoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    totalXP: number;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
    "Finalizar série": Flag,
    "Publicar série": PenLine,
    "Perfil completo": Trophy,
    "Publicar capítulo": BookMarked,
    "Retornar após inatividade": Gift,
    "Atualizar redes sociais": Globe,
    "Publicar post": FileText,
    "Ler capítulo completo": BookOpen,
    "Salvar capítulo": Bookmark,
    "Publicar comentário": MessageSquare,
    "Curtir post": Heart,
    "Curtir comentário": Star,
    "Seguir autor": Trophy,
    "Editar série": Pencil,
    "Editar capítulo": Pencil,
    "Editar perfil": Pencil,
    "Adicionar foto de perfil": Sparkles,
    "Criar playlist": Sparkles,
    "Atualizar bio": FileText,
    "Adicionar à playlist": Bookmark,
    "Excluir conteúdo": Trash2,
    "Repostar publicação": Share2,
    "Realizar busca": Sparkles,
    "Ver notificação": Star,
    "Mandar msg": MessageSquare,
    "Primeira msg": MessageSquare,
    "Descobrir série": BookOpen,
    "Primeiro capítulo": BookMarked,
    "Primeiro feedback": Heart,
    
    // Novas chaves mapeadas para as regras de XP correspondentes
    "Criar série": PenLine,
    "Criar comunidade": Globe,
    "Publicar capítulo do primeiro livro": BookMarked,
    "Visualização recebida": BookOpen,
    "Comentário recebido na série": MessageSquare,
    "Frequência Semanal": Trophy,
};

export default function XPInfoModal({ open, onOpenChange }: XPInfoModalProps) {
    const xpGains = XP_METHODS.filter((m) => m.xp > 0);
    const xpCosts = XP_METHODS.filter((m) => m.xp < 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg p-0 gap-0 shadow-none border">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>Sistema de Progressão</DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[70vh]">
                    <div className="p-6 space-y-6">
                        {/* Explicação dos Níveis */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-primary">Como funcionam os níveis</h3>
                            <div className="grid gap-3">
                                <div className="p-3 rounded-lg border bg-muted/30">
                                    <p className="text-xs font-semibold mb-1 flex items-center gap-2">
                                        <Trophy size={14} className="text-primary" /> Nível Geral
                                    </p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Seu prestígio total na comunidade. Representa toda a sua história e veterania na plataforma.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg border bg-muted/10">
                                        <p className="text-xs font-semibold mb-1 flex items-center gap-2 text-foreground/80">
                                            <Star size={13} className="text-foreground/75" /> Escritor
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                            Sua carreira autoral. Aumenta ao publicar capítulos, séries e concluir obras.
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-lg border bg-muted/10">
                                        <p className="text-xs font-semibold mb-1 flex items-center gap-2 text-foreground/80">
                                            <BookOpen size={13} className="text-foreground/75" /> Leitor
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                            Seu engajamento. Aumenta ao ler, comentar, curtir e seguir outros autores.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Listagem de Ações em Abas */}
                        <div className="space-y-4">
                            <Tabs defaultValue="gains" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="gains" className="text-xs">Ganhar XP</TabsTrigger>
                                    <TabsTrigger value="costs" className="text-xs">Gastos e Custos</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="gains" className="space-y-2 pt-3 focus-visible:outline-none focus-visible:ring-0">
                                    {xpGains.map((method) => {
                                        const Icon = ACTION_ICONS[method.action] || Sparkles;
                                        const isWriter = method.type === "writer";
                                        
                                        return (
                                            <div
                                                key={method.action}
                                                className="flex items-center gap-3 p-2.5 rounded-md hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50"
                                            >
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-success/10 text-success">
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-semibold text-foreground truncate">
                                                                {method.action}
                                                            </p>
                                                            <Badge 
                                                                variant="outline" 
                                                                className={`shrink-0 text-[9px] font-medium h-4 px-1.5 ${
                                                                    isWriter 
                                                                        ? "border-muted-foreground/30 text-muted-foreground bg-muted/40" 
                                                                        : "border-primary/20 text-primary bg-primary/5"
                                                                }`}
                                                            >
                                                                {isWriter ? "Escritor" : "Leitor"}
                                                            </Badge>
                                                        </div>
                                                        <span className="shrink-0 text-xs font-bold text-success font-mono">
                                                            +{method.xp} XP
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                                                        {method.description}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </TabsContent>
                                
                                <TabsContent value="costs" className="space-y-2 pt-3 focus-visible:outline-none focus-visible:ring-0">
                                    {xpCosts.map((method) => {
                                        const Icon = ACTION_ICONS[method.action] || Sparkles;
                                        const isWriter = method.type === "writer";
                                        
                                        return (
                                            <div
                                                key={method.action}
                                                className="flex items-center gap-3 p-2.5 rounded-md hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50"
                                            >
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-destructive/10 text-destructive">
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-semibold text-foreground truncate">
                                                                {method.action}
                                                            </p>
                                                            <Badge 
                                                                variant="outline" 
                                                                className={`shrink-0 text-[9px] font-medium h-4 px-1.5 ${
                                                                    isWriter 
                                                                        ? "border-muted-foreground/30 text-muted-foreground bg-muted/40" 
                                                                        : "border-primary/20 text-primary bg-primary/5"
                                                                }`}
                                                            >
                                                                {isWriter ? "Escritor" : "Leitor"}
                                                            </Badge>
                                                        </div>
                                                        <span className="shrink-0 text-xs font-bold text-destructive font-mono">
                                                            {method.xp} XP
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                                                        {method.description}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
