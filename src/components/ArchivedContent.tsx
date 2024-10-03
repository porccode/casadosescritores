"use client";

import Link from "next/link";
import { Archive, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ArchivedContent() {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-6">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Conteúdo Arquivado</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                    Esta série foi arquivada pelo autor. O acesso a este conteúdo agora é restrito apenas ao autor original.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild variant="default">
                    <Link href="/">
                        Página Inicial
                    </Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/series">
                        Ver Outras Séries
                    </Link>
                </Button>
            </div>

            <p className="text-xs text-muted-foreground italic pt-4">
                Se você é o autor, certifique-se de estar conectado à sua conta.
            </p>
        </div>
    );
}

