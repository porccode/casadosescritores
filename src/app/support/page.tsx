import React from "react";
import { BookOpen, PenTool, MessageSquare, Settings, Mail } from "lucide-react";
import { LegalPageHeader } from "@/components/layout/LegalPageHeader";
import { LegalContainer } from "@/components/layout/LegalContainer";
import { PageLayout } from "@/components/layout/PageLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Ajuda e Suporte | Casa dos Escritores",
    description: "Tudo o que você precisa saber para publicar suas histórias, contos e livros online, ler e acompanhar obras e interagir com a comunidade.",
    alternates: {
        canonical: "https://casadosescritores.com.br/support",
    },
};

export default function SupportPage() {
    return (
        <PageLayout>
            <LegalPageHeader
                title="Ajuda e Suporte"
                description="Tudo o que você precisa saber para aproveitar ao máximo a Casa dos Escritores."
            />

            <LegalContainer asCard={false}>
                <div className="grid gap-6 md:grid-cols-2 not-prose">
                    <div className="p-6 border border-border bg-card rounded-xl shadow-sm space-y-3">
                        <PenTool className="h-8 w-8 text-primary" />
                        <h3 className="text-xl font-bold">Como Publicar</h3>
                        <p className="text-sm text-muted-foreground">
                            Clique no botão "Escrever" no menu superior. Lá você pode criar uma nova série e adicionar capítulos. Lembre-se de preencher a sinopse e as tags!
                        </p>
                    </div>

                    <div className="p-6 border border-border bg-card rounded-xl shadow-sm space-y-3">
                        <BookOpen className="h-8 w-8 text-primary" />
                        <h3 className="text-xl font-bold">Lendo e Acompanhando</h3>
                        <p className="text-sm text-muted-foreground">
                            Você pode explorar séries por categorias ou popularidade. Adicione suas histórias favoritas à sua biblioteca para receber atualizações.
                        </p>
                    </div>

                    <div className="p-6 border border-border bg-card rounded-xl shadow-sm space-y-3">
                        <MessageSquare className="h-8 w-8 text-primary" />
                        <h3 className="text-xl font-bold">Comentários e Chat</h3>
                        <p className="text-sm text-muted-foreground">
                            Interaja com os autores através dos comentários em cada capítulo ou inicie uma conversa privada clicando no ícone de mensagem no perfil.
                        </p>
                    </div>

                    <div className="p-6 border border-border bg-card rounded-xl shadow-sm space-y-3">
                        <Settings className="h-8 w-8 text-primary" />
                        <h3 className="text-xl font-bold">Configurações de Conta</h3>
                        <p className="text-sm text-muted-foreground">
                            Personalize seu perfil, altere sua senha e gerencie suas notificações na área "Editar Perfil" disponível no seu menu de usuário.
                        </p>
                    </div>
                </div>

                <div className="bg-muted/50 p-8 rounded-2xl border border-border text-center space-y-4 not-prose mt-12">
                    <Mail className="h-10 w-10 mx-auto text-primary" />
                    <h2 className="text-2xl font-bold">Ainda precisa de ajuda?</h2>
                    <p className="text-muted-foreground">
                        Se você encontrou um bug ou tem uma dúvida que não foi respondida acima, use o formulário de sugestões no rodapé ou entre em contato pelos nossos canais oficiais.
                    </p>
                </div>
            </LegalContainer>
        </PageLayout>
    );
}
