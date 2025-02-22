import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PenLine, AlertTriangle, X } from 'lucide-react';

interface ThreeDaysDeadlineModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function ThreeDaysDeadlineModal({ isOpen, onClose, onConfirm }: ThreeDaysDeadlineModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="flex flex-col items-center text-center sm:text-center">
                    <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <DialogTitle className="text-xl">Falta Pouco!</DialogTitle>
                    <DialogDescription className="pt-2">
                        Sua obra foi criada com sucesso, mas lembre-se: <br/><br/>
                        <strong className="text-foreground font-semibold">Obras vazias (sem nenhum capítulo) por mais de 3 dias serão ocultadas automaticamente </strong>
                        para manter a qualidade da Casa dos Escritores.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col sm:flex-col gap-3 mt-4">
                    <Button 
                        onClick={onConfirm} 
                        className="w-full text-sm font-semibold h-11" 
                    >
                        <PenLine className="w-4 h-4 mr-2" />
                        ESCREVER PRIMEIRO CAPÍTULO
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={onClose}
                        className="w-full text-xs text-muted-foreground"
                    >
                        Talvez mais tarde
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

import { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, HeartHandshake } from 'lucide-react';

interface FirstChapterCongratsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FirstChapterCongratsModal({ isOpen, onClose }: FirstChapterCongratsModalProps) {
    const [step, setStep] = useState(1);

    const handleClose = () => {
        setStep(1);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) handleClose();
        }}>
            <DialogContent className="sm:max-w-md overflow-hidden p-0">
                <div className="w-full overflow-hidden">
                    <div className="flex w-full transition-transform duration-300 ease-in-out" style={{ transform: `translateX(-${(step - 1) * 100}%)` }}>
                        
                        {/* Step 1: Parabéns */}
                        <div className="w-full shrink-0 flex flex-col p-6 items-center text-center">
                            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 mt-4">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <DialogTitle className="text-2xl mb-2">Parabéns!</DialogTitle>
                            <DialogDescription className="text-base">
                                Você acaba de dar vida à sua série publicando o <strong className="text-foreground">primeiro capítulo</strong>. <br/><br/>
                                O mundo já pode começar a ler e acompanhar sua história incrível.
                            </DialogDescription>
                            
                            <div className="mt-8 flex w-full">
                                <Button onClick={() => setStep(2)} className="w-full h-11">
                                    Continuar <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>

                        {/* Step 2: Cuidado com o Abandono */}
                        <div className="w-full shrink-0 flex flex-col p-6 items-center text-center">
                            <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-6 mt-4">
                                <HeartHandshake className="w-8 h-8" />
                            </div>
                            <DialogTitle className="text-2xl mb-2">Mantenha o Ritmo!</DialogTitle>
                            <DialogDescription className="text-base">
                                Séries <strong className="text-foreground">não finalizadas</strong> que não recebem atualizações por <strong className="text-foreground">mais de 15 dias</strong> recebem um selo de <strong className="text-red-500 font-semibold">"Abandonada"</strong>.<br/><br/>
                                Os leitores adoram consistência. Continue escrevendo e cultivando o seu público!
                            </DialogDescription>
                            
                            <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full">
                                <Button variant="outline" onClick={() => setStep(1)} className="w-full sm:w-auto px-4 h-11">
                                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                                </Button>
                                <Button onClick={handleClose} className="w-full flex-1 h-11">
                                    Entendido!
                                </Button>
                            </div>
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
