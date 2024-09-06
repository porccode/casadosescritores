"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BookOpen, MessageSquare, User, AlertCircle } from 'lucide-react';

interface EditorModalsProps {
    isVideoDialogOpen: boolean;
    setIsVideoDialogOpen: (open: boolean) => void;
    videoUrl: string;
    setVideoUrl: (url: string) => void;
    handleVideoConfirm: () => void;
    editor: any;
    userXP: number;
    setUserXP: (xp: number) => void;

    // Modal de XP insuficiente
    xpErrorModalOpen: boolean;
    setXpErrorModalOpen: (open: boolean) => void;
    xpErrorData: { currentXp: number; xpRequired: number } | null;
}

export function EditorModals({
    isVideoDialogOpen,
    setIsVideoDialogOpen,
    videoUrl,
    setVideoUrl,
    handleVideoConfirm,
    editor,
    userXP,
    setUserXP,
    xpErrorModalOpen,
    setXpErrorModalOpen,
    xpErrorData,
}: EditorModalsProps) {

    return (
        <>
            {/* Modal de Vídeo (YouTube) */}
            <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Inserir Vídeo (YouTube)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="video-url">URL do Vídeo</Label>
                            <Input
                                id="video-url"
                                placeholder="https://www.youtube.com/watch?v=..."
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleVideoConfirm()}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsVideoDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleVideoConfirm}>
                            Inserir Vídeo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal: Saldo Insuficiente de XP */}
            <Dialog open={xpErrorModalOpen} onOpenChange={setXpErrorModalOpen}>
                <DialogContent className="sm:max-w-[450px] border-destructive/20">
                    <DialogHeader className="flex flex-col items-center justify-center text-center sm:text-center space-y-2 pb-2">
                        <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                            <AlertCircle className="h-7 w-7" />
                        </div>
                        <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                            Inspiração Insuficiente
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Você precisa acumular XP antes de continuar.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2 text-center">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Você precisa de <strong className="text-foreground">{xpErrorData?.xpRequired || 50} XP</strong> para esta ação, mas seu saldo atual é de <strong className="text-primary">{xpErrorData?.currentXp || 0} XP</strong>.
                        </p>

                        <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/40 text-left">
                            <p className="text-xs font-bold text-foreground text-center uppercase tracking-wider mb-2 border-b border-border pb-1.5">
                                Como ganhar Inspiração (XP):
                            </p>

                            <div className="flex items-start gap-3 text-xs leading-relaxed text-muted-foreground">
                                <BookOpen className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-semibold text-foreground">Ler Obras de Colegas (+10 XP)</span>
                                    <p className="text-[10px]">Apoie a comunidade lendo capítulos completos de outros escritores.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 text-xs leading-relaxed text-muted-foreground">
                                <MessageSquare className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-semibold text-foreground">Deixar Comentários (+15 XP)</span>
                                    <p className="text-[10px]">Escreva feedbacks reais para incentivar discussões saudáveis.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 text-xs leading-relaxed text-muted-foreground">
                                <User className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-semibold text-foreground">Completar Perfil (+50 XP)</span>
                                    <p className="text-[10px]">Preencha sua foto, biografia e redes no painel do seu perfil.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setXpErrorModalOpen(false)}
                            className="w-full sm:w-auto text-xs font-semibold"
                        >
                            Voltar ao Rascunho
                        </Button>
                        <Button
                            onClick={() => {
                                setXpErrorModalOpen(false);
                                window.location.href = "/";
                            }}
                            className="w-full sm:flex-1 text-xs font-bold gap-1.5"
                        >
                            <BookOpen className="h-3.5 w-3.5" /> Ir para Leituras
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
