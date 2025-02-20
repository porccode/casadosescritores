import React from "react";
import { ShieldCheck, AlertTriangle, UserX, ImageIcon, Flame } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LegalPageHeader } from "@/components/layout/LegalPageHeader";
import { LegalContainer } from "@/components/layout/LegalContainer";
import { PageLayout } from "@/components/layout/PageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Diretrizes da Comunidade | Casa dos Escritores",
    description: "Conheça as diretrizes da comunidade, regras de conduta, respeito aos direitos autorais e boas práticas na Casa dos Escritores.",
    alternates: {
        canonical: "https://casadosescritores.com.br/guidelines",
    },
};

export default function GuidelinesPage() {
    return (
        <PageLayout>
            <LegalPageHeader
                title="Diretrizes da Comunidade"
                description="Regras essenciais para manter nossa casa segura, original e acolhedora."
            />

            <LegalContainer asCard={false}>
                <div className="space-y-8 not-prose">
                    {/* 1. Originalidade */}
                    <div className="p-6 rounded-xl border border-border bg-card space-y-4">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl font-bold">1. Originalidade e Créditos</h2>
                        </div>
                        <p className="text-muted-foreground">
                            Nossa plataforma foca na <strong>originalidade</strong>. Não copie material para divulgar em outras plataformas sem dar o merecido crédito. A violação persistente desta regra pode resultar em **banimento permanente**.
                        </p>
                    </div>

                    {/* 2. Pirataria */}
                    <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/5 space-y-4">
                        <div className="flex items-center gap-3 text-destructive">
                            <AlertTriangle className="h-6 w-6" />
                            <h2 className="text-2xl font-bold">2. Plágio e Pirataria</h2>
                        </div>
                        <p className="text-muted-foreground">
                            Não é permitido publicar material de outras pessoas sem autorização. Pirataria não é tolerada em nenhuma circunstância. Respeite a propriedade intelectual de seus colegas escritores.
                        </p>
                    </div>

                    {/* 3. Idade */}
                    <div className="p-6 rounded-xl border border-orange-500/20 bg-orange-500/5 space-y-4">
                        <div className="flex items-center gap-3 text-orange-600">
                            <UserX className="h-6 w-6" />
                            <h2 className="text-2xl font-bold">3. Restrição de Idade</h2>
                        </div>
                        <p className="text-muted-foreground">
                            **Menores de 16 anos não podem criar conta.** É terminantemente proibido, pois hospedamos conteúdo sensível e explícito que não é adequado para menores dessa idade.
                        </p>
                    </div>

                    {/* 4. Conteúdo Sensível */}
                    <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5 space-y-4">
                        <div className="flex items-center gap-3 text-red-600">
                            <Flame className="h-6 w-6" />
                            <h2 className="text-2xl font-bold">4. Conteúdo Adulto e Respeito</h2>
                        </div>
                        <p className="text-muted-foreground">
                            Se você publicar conteúdo contendo palavrões, temas sexuais ou sensíveis:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>Não pode envolver menores de idade.</li>
                            <li>Não pode conter agressão a crenças, gêneros, raças ou orientações sexuais.</li>
                            <li>Deve ser devidamente marcado como "Conteúdo Explícito".</li>
                        </ul>
                    </div>

                    {/* 5. Mídia e Fotos */}
                    <div className="p-6 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-4">
                        <div className="flex items-center gap-3 text-blue-600">
                            <ImageIcon className="h-6 w-6" />
                            <h2 className="text-2xl font-bold">5. Imagens e Fotos</h2>
                        </div>
                        <p className="text-muted-foreground">
                            O uso de fotos de outras pessoas sem autorização não é permitido. Fotos sensíveis ou pornografia são estritamente proibidas.
                        </p>
                        <Alert variant="default" className="bg-primary/5 border-primary/20 text-primary">
                            <AlertTitle className="font-bold">Dica Literária</AlertTitle>
                            <AlertDescription>
                                Se o seu material (incluindo a capa) for um trabalho exclusivo e original, não esqueça de marcar isso na página da sua série para ganhar o selo de originalidade!
                            </AlertDescription>
                        </Alert>
                    </div>
                </div>

                <div className="text-center mt-12 pt-12 border-t border-border">
                    <p className="text-sm text-muted-foreground italic">
                        Ao usar a Casa dos Escritores, você concorda em seguir estas diretrizes para o bem-estar de toda a nossa comunidade.
                    </p>
                </div>
            </LegalContainer>
        </PageLayout>
    );
}
