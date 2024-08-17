import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    ChevronRight,
    ArrowLeft
} from "lucide-react";
import Link from "next/link";

interface DocContent {
    title: string;
    description: string;
    content: React.ReactNode;
}

const DOCS_CONTENT: Record<string, DocContent> = {
    "cadastro-e-perfil": {
        title: "Cadastro e Perfil",
        description: "Configure sua conta e personalize sua identidade literária.",
        content: (
            <div className="space-y-10">
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">Iniciando sua Jornada</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Para começar na Casa dos Escritores, você precisa ter 16 anos ou mais. O cadastro é simples e permite que você comece a publicar e interagir imediatamente.
                    </p>
                </section>
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">Personalização</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Seu perfil é sua vitrine. Recomendamos adicionar uma foto de avatar nítida, uma biografia atraente e links para suas outras redes sociais. Isso ajuda os leitores a confiarem e se conectarem com você.
                    </p>
                </section>
                <section className="space-y-4">
                    <h3 className="text-xl font-bold text-destructive">Desativação de Conta</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Contas inativas por mais de 30 dias podem entrar em processo de exclusão automática. Fique atento aos e-mails de lembrete que enviamos a cada 5 dias de inatividade. Para reativar, basta fazer login.
                    </p>
                </section>
            </div>
        )
    },
    "sistema-de-xp": {
        title: "Sistema de XP e Níveis",
        description: "Entenda como você ganha prestígio e evolui na Casa dos Escritores.",
        content: (
            <div className="space-y-10">
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">O que é XP?</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        XP (Experience Points) é a medida de sua atividade e contribuição. Quanto mais você escreve, comenta e interage, maior o seu nível e prestígio.
                    </p>
                </section>
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">Tabela de Atividades</h3>
                    <div className="grid gap-2 text-sm">
                        <div className="flex justify-between p-3 rounded border"><span>Publicar Capítulo</span> <span className="font-bold">+20 XP</span></div>
                        <div className="flex justify-between p-3 rounded border"><span>Perfil Completo</span> <span className="font-bold">+50 XP</span></div>
                        <div className="flex justify-between p-3 rounded border"><span>Interação no Feed</span> <span className="font-bold">+5 XP</span></div>
                        <div className="flex justify-between p-3 rounded border text-primary"><span>Receber Favorito</span> <span className="font-bold">+10 XP</span></div>
                    </div>
                </section>
            </div>
        )
    },
    "series-e-obras": {
        title: "Séries e Obras",
        description: "Guia completo para organizar suas produções literárias.",
        content: (
            <div className="space-y-10">
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">Série vs Obra</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Uma Série é o projeto principal. Dentro dela, você organiza seus capítulos. Você pode selecionar até 3 gêneros para cada série, facilitando a descoberta por novos leitores.
                    </p>
                </section>
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">Metadados Importantes</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li><strong>Sinopse:</strong> Deve ser curta e impactante.</li>
                        <li><strong>Capa:</strong> Priorize imagens originais e de boa qualidade.</li>
                        <li><strong>Status:</strong> Mantenha atualizado se a obra está concluída ou em andamento.</li>
                    </ul>
                </section>
            </div>
        )
    },
    "capitulos-e-edicao": {
        title: "Capítulos e Edição",
        description: "Como utilizar nosso editor para criar textos impecáveis.",
        content: (
            <div className="space-y-8">
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">O Editor Casa</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Nosso editor é baseado em blocos. Você pode inserir citações, listas, imagens e até vídeos do YouTube para enriquecer sua narrativa.
                    </p>
                </section>
                <section className="space-y-4 p-4 border border-dashed rounded-lg bg-muted/20">
                    <h4 className="font-bold text-sm">Dica de Produtividade</h4>
                    <p className="text-xs text-muted-foreground leading-normal">
                        Use o salvamento automático para nunca perder seu progresso. Recomendamos revisar o texto antes de clicar em publicar para garantir a melhor experiência ao leitor.
                    </p>
                </section>
            </div>
        )
    },
    "escrita-assistida": {
        title: "Escrita Assistida (IA)",
        description: "Como a inteligência artificial pode ajudar seu processo criativo.",
        content: (
            <div className="space-y-10">
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">IA como Aliada</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Oferecemos ferramentas de IA integradas para ajudar você a polir seus capítulos, sugerir melhorias de tom ou expandir ideias travadas.
                    </p>
                </section>
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">Políticas de Uso</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        É obrigatório sinalizar na sinopse se sua obra utiliza IA generativa de forma extensiva. Acreditamos na transparência para com os leitores e na valorização do talento humano.
                    </p>
                </section>
            </div>
        )
    },
    "posts-e-interacao": {
        title: "Feed e Interação",
        description: "Compartilhe micro-textos e conquiste novos leitores no feed.",
        content: (
            <div className="space-y-10">
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">O Poder do Micro-texto</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        O feed é o lugar para postagens rápidas, avisos de novos capítulos e reflexões literárias. Utilize imagens e GIFs para atrair mais atenção para suas postagens.
                    </p>
                </section>
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">Vincular Obras</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Ao mencionar suas obras em posts, o sistema cria links automáticos, facilitando o acesso dos leitores ao seu conteúdo principal.
                    </p>
                </section>
            </div>
        )
    },
    "comentarios": {
        title: "Comentários e Feedback",
        description: "A importância do diálogo entre autor e leitor.",
        content: (
            <div className="space-y-10">
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">Engajamento</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Comentários construtivos são a alma da comunidade. Autores que respondem aos seus leitores tendem a crescer muito mais rápido e criar uma base de fãs sólida.
                    </p>
                </section>
                <section className="space-y-4 p-4 border rounded-xl">
                    <h4 className="font-bold text-sm">Privacidade de Comentários</h4>
                    <p className="text-xs text-muted-foreground leading-normal">
                        Você pode gerenciar os comentários em suas obras através do painel de controle, garantindo um ambiente de críticas saudáveis.
                    </p>
                </section>
            </div>
        )
    },
    "busca-e-rankings": {
        title: "Busca e Rankings",
        description: "Como ser descoberto e acompanhar o topo da comunidade.",
        content: (
            <div className="space-y-10">
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">Descoberta</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Nossa busca utiliza filtros avançados. Use tags relevantes para que sua obra apareça para os leitores que procuram exatamente o que você escreve.
                    </p>
                </section>
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">O Topo do Ranking</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Escritores com maior acúmulo de XP e séries mais favoritas ganham destaque nos rankings semanais e mensais da página inicial.
                    </p>
                </section>
            </div>
        )
    },
    "notificacoes-e-chat": {
        title: "Mensagens e Chat",
        description: "Comunicação direta e alertas em tempo real.",
        content: (
            <div className="space-y-10">
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">Chat Privado</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Inicie conversas privadas com outros autores para trocar feedbacks detalhados ou planejar colaborações. O chat suporta mensagens em tempo real e compartilhamento de links internos.
                    </p>
                </section>
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">Alertas</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Fique por dentro de tudo: novos seguidores, curtidas, comentários e menções em posts. Configure suas notificações para não perder nada de importante.
                    </p>
                </section>
            </div>
        )
    },
    "seguranca-e-regras": {
        title: "Segurança e Regras",
        description: "Como garantimos um ambiente seguro para todos.",
        content: (
            <div className="space-y-10">
                <section className="space-y-6">
                    <h3 className="text-xl font-bold text-destructive">Tolerância Zero</h3>
                    <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 space-y-3">
                        <p className="text-sm font-semibold text-destructive">Banimento permanente imediato para:</p>
                        <ul className="text-sm list-disc pl-5 text-destructive underline-offset-4">
                            <li>Plágio sistemático comprovado.</li>
                            <li>Ataques de ódio ou preconceito.</li>
                            <li>Exposição de dados privados (Doxxing).</li>
                            <li>Apologia a crimes.</li>
                        </ul>
                    </div>
                </section>
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">Classificação Indicativa</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        É de responsabilidade do autor definir a classificação etária correta de suas obras. Conteúdos adultos sem a devida sinalização serão removidos.
                    </p>
                </section>
            </div>
        )
    },
    "suporte-e-feedback": {
        title: "Suporte e Feedback",
        description: "Precisou de ajuda ou tem uma sugestão? Fale conosco.",
        content: (
            <div className="space-y-10">
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">Central de Ajuda</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Se você encontrou um bug ou tem dificuldades técnicas, utilize nosso sistema de sugestões oficial. Nossa equipe analisa cada pedido para melhorar a plataforma.
                    </p>
                </section>
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">Comunidade de Escritores</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Muitas dúvidas podem ser sanadas conversando com autores mais experientes no feed. A troca de conhecimento é incentivada e gera XP para todos os envolvidos.
                    </p>
                    <Button size="sm" variant="outline" className="mt-4" asChild>
                        <Link href="/support">Abrir Ticket de Suporte</Link>
                    </Button>
                </section>
            </div>
        )
    },
    "regras-de-uso": {
        title: "Termos de Uso",
        description: "As diretrizes legais e regras gerais de utilização da Casa dos Escritores.",
        content: (
            <div className="space-y-10">
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">1. Aceitação dos Termos</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Ao acessar e utilizar a Casa dos Escritores, você concorda em cumprir estes Termos de Uso e nossa Política de Privacidade. A plataforma destina-se a maiores de 16 anos. Se você não concorda com qualquer parte destes termos, deve interromper o uso do site.
                    </p>
                </section>
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">2. Propriedade Intelectual</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Você retém os direitos autorais de todos os textos originais que publicar aqui. Ao enviar seu conteúdo, você concede à Casa dos Escritores uma licença mundial, não exclusiva e gratuita para hospedar, exibir e distribuir sua obra na plataforma. Não vendemos suas histórias a terceiros.
                    </p>
                </section>
                <section className="space-y-4">
                    <h3 className="text-xl font-bold text-destructive">3. Diretrizes de Conduta (Tolerância Zero)</h3>
                    <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 space-y-3">
                        <p className="text-sm font-semibold text-destructive">Banimento permanente imediato para:</p>
                        <ul className="text-sm list-disc pl-5 text-destructive">
                            <li>Plágio sistemático comprovado.</li>
                            <li>Ataques de ódio ou preconceito.</li>
                            <li>Exposição de dados privados (Doxxing).</li>
                            <li>Apologia a crimes ou conteúdo abusivo com menores.</li>
                        </ul>
                    </div>
                </section>
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">4. Responsabilidades</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        O autor é o único responsável legal pelo conteúdo que publica. A Casa dos Escritores fornece apenas a hospedagem técnica e reserva-se o direito de remover conteúdos denunciados que infrinjam os termos.
                    </p>
                </section>
            </div>
        )
    },
    "regras-de-publicacao": {
        title: "Diretrizes de Publicação",
        description: "Normas de originalidade, classificação indicativa e formatação para suas obras.",
        content: (
            <div className="space-y-10">
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">1. Autoria e Fanfics</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Todas as histórias publicadas devem ser de autoria própria ou devidamente autorizadas. Plágio acarreta a exclusão da conta. Obras do gênero Fanfic são permitidas, desde que indicado que pertencem aos criadores originais do universo.
                    </p>
                </section>
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">2. Uso de IA Generativa</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        É permitido o uso de ferramentas de Inteligência Artificial para auxílio criativo e revisão. No entanto, é obrigatório sinalizar na sinopse se o texto possui conteúdo gerado por IA. Obras puramente geradas sem revisão humana de qualidade podem ser removidas.
                    </p>
                </section>
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">3. Classificação Indicativa</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Selecione as classificações de faixa etária corretas para sua obra. Se o texto contiver linguagem explícita ou temas maduros (+18), você deve ativá-lo como "Conteúdo Adulto" nas opções de metadados. Capas e títulos não devem conter nudez ou teor vulgar.
                    </p>
                </section>
            </div>
        )
    },
    "politica-de-privacidade": {
        title: "Política de Privacidade (LGPD)",
        description: "Como coletamos, tratamos e protegemos seus dados pessoais de acordo com a lei.",
        content: (
            <div className="space-y-10">
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">1. Coleta de Dados</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Coletamos dados necessários para autenticação (nome de usuário, e-mail e senha criptografada), personalização de perfil (avatar, bio) e métricas básicas de uso. Seus logs de acesso são mantidos temporariamente conforme exigido pelo Marco Civil da Internet.
                    </p>
                </section>
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">2. Compromisso de Não-Comercialização</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Garantimos que a Casa dos Escritores nunca venderá ou alugará suas informações pessoais para anunciantes ou empresas parceiras. A plataforma é livre de rastreadores invasivos de terceiros.
                    </p>
                </section>
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">3. Seus Direitos (LGPD)</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Você tem o direito de acessar, retificar e excluir permanentemente seus dados a qualquer momento. Ao apagar sua conta nas configurações do perfil, todas as suas informações, obras, comentários e curtidas são removidos permanentemente do banco de dados ativo.
                    </p>
                </section>
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">4. Cookies de Terceiros e Publicidade (Google AdSense)</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Fornecedores terceirizados, incluindo o Google, utilizam cookies para veicular anúncios com base em visitas anteriores do usuário a este ou a outros sites. O uso de cookies de publicidade pelo Google permite que ele e seus parceiros veiculem anúncios com base nas visitas a este site e/ou a outros sites na Internet. Os usuários podem optar por desativar a publicidade personalizada acessando as Configurações de Anúncios do Google.
                    </p>
                </section>
                <section className="space-y-4">
                    <h3 className="text-xl font-bold">5. Contato da Privacidade</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Caso queira tirar dúvidas ou realizar solicitações quanto aos seus dados, mande um e-mail para <span className="font-semibold text-primary">privacidade@casadosescritores.com.br</span>.
                    </p>
                </section>
            </div>
        )
    }
};

export default async function DocSlugPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const content = DOCS_CONTENT[slug];

    if (!content) {
        notFound();
    }

    return (
        <article className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
            <div className="space-y-6">
                <Link
                    href="/docs"
                    className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
                >
                    <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
                    Voltar para Documentação
                </Link>

                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight">{content.title}</h1>
                    <p className="text-lg text-muted-foreground leading-relaxed italic">{content.description}</p>
                </div>
                <Separator />
            </div>

            <div className="max-w-none prose prose-neutral dark:prose-invert prose-p:text-muted-foreground prose-headings:font-bold prose-headings:tracking-tight">
                {content.content}
            </div>

            <div className="pt-20 border-t flex items-center justify-between text-[11px] text-muted-foreground/60 uppercase tracking-widest font-bold">
                <div className="flex gap-4">
                    <span>Casa dos Escritores</span>
                    <span>•</span>
                    <span>Guia Oficial</span>
                </div>
                <div className="tabular-nums">
                    Ref: {new Date().getFullYear()}
                </div>
            </div>
        </article>
    );
}
export async function generateStaticParams() {
    return Object.keys(DOCS_CONTENT).map((slug) => ({
        slug,
    }));
}
