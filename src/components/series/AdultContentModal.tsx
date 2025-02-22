"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShieldAlert, Home, ArrowRight, Eye, Swords, MessageSquareWarning, Lock, Loader2 } from "lucide-react";
import { useAgeVerification } from "@/hooks/useAgeVerification";

interface AdultContentModalProps {
    isExplicit: boolean;
    bypassCheck?: boolean;
    hideClose?: boolean;
    onClose?: () => void;
}

const CONTENT_WARNINGS = [
    { icon: Eye, label: "Conteúdo sexual explícito" },
    { icon: Swords, label: "Violência gráfica ou moderada" },
    { icon: MessageSquareWarning, label: "Linguagem forte e ofensiva" },
];

/**
 * Modal de barreira para conteúdo adulto/sensível.
 * Garante segurança TOTAL desde o 1º milissegundo de carregamento (sem vazamento de conteúdo).
 */
export function AdultContentModal({ isExplicit, bypassCheck = false, hideClose = true, onClose }: AdultContentModalProps) {
    const router = useRouter();
    const { isAdult, isMinor, loading: ageLoading } = useAgeVerification();
    const [isOpen, setIsOpen] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || !isExplicit || bypassCheck) {
            setIsOpen(false);
            return;
        }

        // Se o usuário é maior de idade confirmado, fecha o modal
        if (isAdult) {
            setIsOpen(false);
            return;
        }

        // Se é menor de idade confirmado ou se a checagem concluiu para não-logados
        if (isMinor) {
            setIsOpen(true);
            return;
        }

        if (!ageLoading) {
            const hasAccepted = sessionStorage.getItem("adult_content_accepted");
            if (hasAccepted) {
                setIsOpen(false);
            } else {
                setIsOpen(true);
            }
        }
    }, [isExplicit, bypassCheck, isAdult, isMinor, ageLoading, mounted]);

    const handleAccept = () => {
        sessionStorage.setItem("adult_content_accepted", "true");
        setIsOpen(false);
    };

    const handleDecline = () => {
        router.push("/");
    };

    // Se a obra NÃO for explícita ou o autor/admin tiver bypass ou for adulto confirmado, não renderiza nada
    if (!isExplicit || bypassCheck || isAdult) return null;

    // Caso 1: Aguardando verificação de idade (Verificação em andamento - Bloqueia visualização instantaneamente)
    if (ageLoading || !mounted) {
        return (
            <Dialog open={true} onOpenChange={() => { }}>
                <DialogContent
                    hideClose={true}
                    className="sm:max-w-[420px]"
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                >
                    <DialogHeader className="text-center sm:text-center items-center py-6">
                        <div className="mx-auto mb-3 h-12 w-12 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                        <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
                            Verificando Permissões...
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                            Aguardando validação de maioridade para acesso a este conteúdo restrito.
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        );
    }

    // Caso 2: Usuário menor de idade confirmado (bloqueio total permanente)
    if (isMinor) {
        return (
            <Dialog open={true} onOpenChange={() => { }}>
                <DialogContent
                    hideClose={true}
                    className="sm:max-w-[420px]"
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                >
                    <DialogHeader className="text-center sm:text-center items-center">
                        <div className="mx-auto mb-2 h-12 w-12 bg-destructive/10 border border-destructive/30 rounded-full flex items-center justify-center text-destructive">
                            <Lock className="h-6 w-6 text-destructive" />
                        </div>
                        <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                            Conteúdo Restrito (+18)
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground leading-relaxed max-w-[320px] mx-auto">
                            Com base na sua confirmação de idade, esta obra não está disponível para o seu perfil para sua proteção.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        <DialogFooter className="pt-2">
                            <Button
                                onClick={handleDecline}
                                variant="default"
                                className="w-full h-10 font-medium"
                            >
                                <Home className="mr-2 h-4 w-4" />
                                Voltar ao Início
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // Caso 3: Visitante não logado / aviso padrão +18 por sessão
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) onClose?.(); }}>
            <DialogContent
                hideClose={hideClose}
                className="sm:max-w-[420px]"
                onPointerDownOutside={(e) => { if (hideClose) e.preventDefault(); }}
                onEscapeKeyDown={(e) => { if (hideClose) e.preventDefault(); }}
            >
                <DialogHeader className="text-center sm:text-center items-center">
                    <div className="relative mx-auto mb-2">
                        <div className="h-12 w-12 bg-destructive/10 border border-destructive/30 rounded-full flex items-center justify-center">
                            <ShieldAlert className="h-6 w-6 text-destructive" />
                        </div>
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-2 px-1.5 py-0 text-[10px] font-bold rounded-sm h-5"
                        >
                            +18
                        </Badge>
                    </div>

                    <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                        Conteúdo Sensível
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground leading-relaxed max-w-[300px] mx-auto">
                        Esta obra é classificada para <strong className="text-foreground">maiores de 18 anos</strong> e pode conter material que alguns leitores podem achar perturbador.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    {/* Lista de avisos de conteúdo */}
                    <div className="rounded-xl border border-border bg-muted/30 divide-y divide-border overflow-hidden">
                        {CONTENT_WARNINGS.map(({ icon: Icon, label }) => (
                            <div key={label} className="flex items-center gap-3 px-4 py-2.5">
                                <div className="h-7 w-7 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                                    <Icon className="h-3.5 w-3.5 text-destructive" />
                                </div>
                                <span className="text-xs text-muted-foreground">{label}</span>
                            </div>
                        ))}
                    </div>

                    <Separator />

                    {/* Termos de responsabilidade */}
                    <p className="text-[11px] text-muted-foreground/70 text-center leading-relaxed px-2">
                        Ao continuar, você confirma ter <strong className="text-muted-foreground">idade legal</strong> e que deseja visualizar este conteúdo por sua própria conta e risco, de acordo com as <strong className="text-muted-foreground">Regras da Comunidade</strong>.
                    </p>

                    {/* Botões */}
                    <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-1">
                        <Button
                            variant="outline"
                            onClick={handleDecline}
                            className="w-full sm:flex-1 h-10 font-medium text-muted-foreground"
                        >
                            <Home className="h-4 w-4" />
                            Voltar ao Início
                        </Button>
                        <Button
                            onClick={handleAccept}
                            variant="destructive"
                            className="w-full sm:flex-1 h-10 font-semibold gap-1.5"
                        >
                            Tenho +18 anos
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
