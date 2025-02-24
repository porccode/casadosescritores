"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DeleteAccountModal from "@/components/DeleteAccountModal";

interface ProfileSecurityCardProps {
    isAdmin: boolean;
    username: string;
}

export function ProfileSecurityCard({ isAdmin, username }: ProfileSecurityCardProps) {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    if (isAdmin) {
        return (
            <Card className="shadow-none border-primary/10 bg-primary/5 overflow-hidden">
                <CardHeader className="bg-primary/10 border-b py-4 px-6">
                    <CardTitle className="text-sm font-semibold text-primary">Status de Autoridade</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white shadow-sm">
                            <span className="font-semibold text-sm">A</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-semibold">Conta Administrativa</p>
                            <p className="text-xs text-muted-foreground">
                                Seu perfil possui privilégios de moderação e governança.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* LGPD Data Portability Card */}
            <Card className="shadow-none border-primary/20 bg-primary/5 overflow-hidden">
                <CardHeader className="py-4 border-b border-primary/10 px-6">
                    <CardTitle className="text-sm font-semibold text-primary">Privacidade e Dados (LGPD)</CardTitle>
                </CardHeader>
                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-1 text-center md:text-left">
                        <p className="text-sm font-semibold">Portabilidade de Dados (Art. 18, V da LGPD)</p>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                            Baixe uma cópia completa dos seus dados cadastrais, obras, comentários e histórico de leitura em formato JSON estruturado.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        className="shrink-0 gap-2 border-primary/30 hover:bg-primary/10"
                        onClick={() => window.open("/api/profile/export", "_blank")}
                    >
                        Exportar Meus Dados (JSON)
                    </Button>
                </CardContent>
            </Card>

            {/* Danger Zone / Delete Account */}
            <Card className="shadow-none border-destructive/20 bg-destructive/5 overflow-hidden">
                <CardHeader className="py-4 border-b border-destructive/10 px-6">
                    <CardTitle className="text-sm font-semibold text-destructive">Zona de Perigo</CardTitle>
                </CardHeader>
                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-1 text-center md:text-left">
                        <p className="text-sm font-semibold">Excluir Conta</p>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                            Esta ação removerá permanentemente seu perfil, obras e interações. Não há reversão após a confirmação.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="destructive"
                        className="shrink-0"
                        onClick={() => setIsDeleteModalOpen(true)}
                    >
                        Excluir minha conta
                    </Button>

                    <DeleteAccountModal
                        isOpen={isDeleteModalOpen}
                        onClose={() => setIsDeleteModalOpen(false)}
                        userNickname={username}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
