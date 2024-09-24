"use client";

import { useEffect, useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ViewIncrementerProps {
    id: string;
    type: 'series' | 'chapter';
}

export default function ViewIncrementer({ id, type }: ViewIncrementerProps) {
    const hasFired = useRef(false);
    const [showAbuseModal, setShowAbuseModal] = useState(false);
    const [modalConfig, setModalConfig] = useState<{
        title: string;
        description: string;
        isPenalty: boolean;
    }>({
        title: "Acesso muito rápido!",
        description: "Notamos que você está atualizando a página muito rápido. Para manter as estatísticas justas, as visualizações foram bloqueadas temporariamente.",
        isPenalty: false
    });

    useEffect(() => {
        // ✅ SEGURANÇA: Evitar disparos duplicados em Strict Mode (Dev)
        if (hasFired.current) return;
        
        const incrementView = async () => {
            try {
                // Marcar como disparado apenas após o início bem-sucedido
                hasFired.current = true;
                
                let endpoint = '';
                if (type === 'series') {
                    endpoint = `/api/series/view?id=${id}`;
                } else if (type === 'chapter') {
                    endpoint = `/api/chapters/view?id=${id}`;
                }

                if (endpoint) {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        cache: 'no-store'
                    });

                    const data = await response.json().catch(() => ({}));

                    if (response.status === 429 || response.status === 403) {
                        if (data.isAbuse) {
                            setModalConfig({
                                title: "Acesso muito rápido!",
                                description: "Você está atualizando a página muito rápido (F5). Na 3ª tentativa seguida em menos de 10 segundos, um alerta é gerado. Se continuar, a série poderá ser bloqueada ou arquivada.",
                                isPenalty: false
                            });
                            setShowAbuseModal(true);
                        } else if (data.isPenalty || data.blockedUntil || data.isPermanent) {
                            let desc = "Esta série foi bloqueada ou arquivada por abuso de visualizações.";
                            if (data.infractionLevel) {
                                const levels = ["1 minuto", "1 dia", "1 semana", "PERMANENTE"];
                                const levelName = levels[Math.min(data.infractionLevel - 1, 3)];
                                desc = `Infração nível ${data.infractionLevel} detectada. A série foi bloqueada por: ${levelName}.`;
                            } else if (data.blockedUntil) {
                                const date = new Date(data.blockedUntil).toLocaleString('pt-BR');
                                desc = `Esta série está temporariamente bloqueada até ${date} devido a abusos detectados.`;
                            } else if (data.isPermanent) {
                                desc = "Esta série foi arquivada PERMANENTEMENTE por abuso recorrente de visualizações. Apenas administradores podem reverter esta ação.";
                            }

                            setModalConfig({
                                title: "Série Bloqueada / Arquivada",
                                description: desc,
                                isPenalty: true
                            });
                            setShowAbuseModal(true);
                        }
                        return;
                    }

                    if (!response.ok) {
                        console.warn(`View increment failed for ${type} (${id}): ${response.status}`, data);
                    }
                }
            } catch (error) {
                console.error(`Error incrementing ${type} view count:`, error);
            }
        };

        if (id) {
            incrementView();
        }
    }, [id, type]);

    return (
        <Dialog open={showAbuseModal} onOpenChange={setShowAbuseModal}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full mb-4 ${modalConfig.isPenalty ? 'bg-red-100' : 'bg-orange-100'}`}>
                        <AlertTriangle className={`h-6 w-6 ${modalConfig.isPenalty ? 'text-red-600' : 'text-orange-600'}`} aria-hidden="true" />
                    </div>
                    <DialogTitle className="text-center">{modalConfig.title}</DialogTitle>
                    <DialogDescription className="text-center">
                        {modalConfig.description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-center mt-2">
                    <Button 
                        type="button" 
                        variant={modalConfig.isPenalty ? "destructive" : "default"}
                        onClick={() => setShowAbuseModal(false)}
                    >
                        {modalConfig.isPenalty ? "Fechar" : "Entendi"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
