# Casa dos Escritores — Documentação Técnica & Guia de Arquitetura

> Este documento é um manual de referência técnica exaustivo. Ele descreve a arquitetura, o Design System, a pilha de tecnologias, o mapeamento completo de rotas e o propósito exato de **todos os arquivos** presentes no projeto.

---

## 📋 Sumário
1. [Visão Geral & Stack de Tecnologias](#1-visão-geral--stack-de-tecnologias)
2. [Design System & Padrões Visuais](#2-design-system--padrões-visuais)
3. [Sitemap de Páginas & Funcionalidades](#3-sitemap-de-páginas--funcionalidades)
4. [Mapeamento Completo de Arquivos e Pastas](#4-mapeamento-completo-de-arquivos-e-pastas)
   - [Configurações e Raiz do Projeto](#41-configurações-e-raiz-do-projeto)
   - [Aplicação / Rotas (src/app)](#42-aplicação--rotas-srcapp)
   - [APIs e Server Actions (src/app/api & src/app/actions)](#43-apis-e-server-actions)
   - [Componentes UI e Funcionais (src/components)](#44-componentes-ui-e-funcionais-srccomponents)
   - [Custom Hooks (src/hooks)](#45-custom-hooks-srchooks)
   - [Bibliotecas e Utilitários (src/lib & src/services)](#46-bibliotecas-e-utilitários-srclib--srcservices)
   - [Estilos e Tokens (src/styles)](#47-estilos-e-tokens-srcstyles)
   - [Tipagem TypeScript (src/types)](#48-tipagem-typescript-srctypes)
   - [Banco de Dados e Migrações (supabase/migrations)](#49-banco-de-dados-e-migrações-supabasemigrations)
5. [Recursos Descontinuados e Atualizações Recentes](#5-recursos-descontinuados-e-atualizações-recentes)
6. [Oportunidades de Melhoria e Problemas a Resolver](#6-oportunidades-de-melhoria-e-problemas-a-resolver)

---

## 1. Visão Geral & Stack de Tecnologias

A **Casa dos Escritores** é uma plataforma literária moderna voltada para autores independentes publicarem histórias, contos, fanfics e livros de forma 100% gratuita. A plataforma conta com leitura imersiva, fóruns comunitários, sistema unificado de mensagens, perfil de autor, e um motor de gamificação por XP.

### Core Stack
* **Framework Web**: [Next.js 16](https://nextjs.org/) (com Turbopack, App Router, SSR e ISR).
* **Linguagem**: [TypeScript 5.8](https://www.typescriptlang.org/) (Tipagem estática rigorosa).
* **Biblioteca de UI**: [React 19](https://react.dev/).
* **Estilização**: Tailwind CSS v4, PostCSS, Radix UI Primitives (headless components) e CSS Custom Properties (Tokens).
* **Ícones & Animações**: Lucide React Icons (`lucide-react`) e Framer Motion (`framer-motion`).
* **Editor de Texto Rico**: Tiptap v3 (`@tiptap/react` e `@tiptap/starter-kit`) com extensões personalizadas.
* **Banco de Dados & Autenticação**: [Supabase](https://supabase.com/) (PostgreSQL, Supabase Auth SSR, RLS, Storage e Triggers).
* **Testes Automatizados**: Vitest e React Testing Library.

---

## 2. Design System & Padrões Visuais

A interface segue rigorosamente o ecossistema **Pure Shadcn UI** (Radix UI + Tailwind CSS) com paleta de cores HSL customizada em variáveis CSS:

* **Modo Claro / Escuro (Dark Mode)**: Suportado nativamente via `next-themes` e variáveis CSS root em `src/styles/tokens.css`.
* **Cores Principais**:
  * **Primary (Roxo Literário)**: HSL `243 43% 50%` (`#484DB5`)
  * **Accent / Highlight (Âmbar)**: HSL `38 92% 50%` (`#F59E0B`)
  * **Superfícies**: Card, Popover e Muted configurados com bordas suaves (`rounded-xl` e `rounded-lg`).
* **Tipografia**:
  * `font-sans`: Outfit / Inter (Interface limpa).
  * `font-serif`: Merriweather / Georgia (Experiência de leitura imersiva).
* **Regra de Componentes**: É estritamente proibido criar estilos arbitrários desalinhados com os primitivos Shadcn localizados em `src/components/ui`.

---

## 3. Sitemap de Páginas & Funcionalidades

| Rota | Descrição e Funcionalidades |
| :--- | :--- |
| `/` | **Home Page**: Destaques, Ranking de Escritores, Novas Séries, Obras Completas, Mais Comentadas e Feed. |
| `/series` | **Catálogo de Obras**: Listagem geral de séries com filtros de gênero, status e ordenação. |
| `/series/[slug]` | **Página da Série**: Detalhes do livro, capítulos, autor, sinopse, resenhas e salvamento em playlists. |
| `/capitulo/[slug]` | **Leitor de Capítulos**: Leitura imersiva, tamanho de fonte ajustável, modo escuro, comentários por parágrafo e atalhos. |
| `/profile/[username]` | **Perfil do Autor**: Obras do autor, playlists, feed de postagens, seguidores/seguindo e progresso de XP. |
| `/profile/[username]/followers` | Lista de leitores que seguem o autor. |
| `/profile/[username]/following` | Lista de autores que o usuário segue. |
| `/profile/edit` | **Edição de Perfil**: Alteração de dados pessoais, foto, redes sociais, senha e verificação de idade. |
| `/rankings` | **Hall da Fama**: Ranking público de Escritores e Leitores ranqueados por engajamento e XP. |
| `/escrever` | **Estúdio de Criação**: Wizard para publicar novas obras e editor TipTap para escrever capítulos. |
| `/explorar` / `/explorar/[category]` | **Explorar**: Navegação por categorias literárias (Romance, Fantasia, Sci-Fi, Terror, etc.). |
| `/comunidades` | **Fórum / Comunidades**: Espaço para discussões literárias, sugestões e bate-papo entre leitores. |
| `/comunidades/[slug]` | Tópicos específicos de uma comunidade. |
| `/comunidades/post/[id]` | Leitura de post específico com respostas encadeadas. |
| `/messages` | **Mensagens Diretas**: Bate-papo privado em tempo real entre leitores e autores. |
| `/notifications` | **Central de Notificações**: Alertas de novos capítulos, comentários, curtidas e seguidores. |
| `/search` | **Busca Global**: Pesquisa inteligente de obras, autores e capítulos com autocompletar. |
| `/admin` | **Painel Administrativo**: Visão geral de métricas, tráfego, denúncias e status de servidores. |
| `/admin/users` | Gestão de usuários, controle de permissões (role) e alteração manual de XP. |
| `/admin/publications` | Moderação de obras e capítulos publicados. |
| `/admin/comments` | Moderação e remoção de comentários. |
| `/admin/announcements` | Gerenciador de banners e comunicados oficiais. |
| `/admin/audit` / `/admin/audit/user/[userId]` | Log de auditoria de segurança e ações administrativas. |
| `/admin/categories` | Gestão de categorias literárias. |
| `/admin/comunidades` | Gestão de comunidades e moderação de posts do fórum. |
| `/admin/deleted` | Fila de contas marcadas para soft-delete (exclusão em 30 dias). |
| `/admin/inbox` | Caixa de entrada de sugestões e feedbacks enviados pelos usuários. |
| `/admin/componentes` | Guia de testes visuais dos componentes do sistema. |
| `/about` / `/docs` / `/docs/[slug]` | Documentação do usuário, regras de XP, guias de publicação e FAQs. |
| `/login` / `/register` / `/forgot-password` / `/reset-password` | Autenticação (OAuth Google/Facebook e login tradicional). |
| `/politica-de-privacidade` / `/terms` / `/privacy` / `/guidelines` | Políticas legais e regras da comunidade. |
| `/support` | Central de suporte e contato. |

---

## 4. Mapeamento Completo de Arquivos e Pastas

Nesta seção, **todos os arquivos** do repositório estão listados e detalhados.

### 4.1 Configurações e Raiz do Projeto

* `.env.local`: Arquivo local de variáveis de ambiente (chaves do Supabase e URLs da aplicação).
* `.gitignore`: Define quais arquivos e diretórios são ignorados pelo controle de versão Git.
* `components.json`: Configuração da CLI do Shadcn UI (diretórios de componentes, estilos e aliases).
* `eslint.config.mjs`: Configuração do linter ESLint para o Next.js 16.
* `LICENSE`: Licença de software do projeto (MIT).
* `next-env.d.ts`: Declarações de tipos globais do Next.js geradas automaticamente.
* `next.config.mjs`: Configuração do Next.js (domínios de imagem permitidos, turbopack, headers de segurança).
* `package.json`: Manifesto de dependências do Node.js, scripts de build, teste e desenvolvimento.
* `package-lock.json`: Trava de versões exatas das dependências instanciadas via npm.
* `postcss.config.js`: Configuração do PostCSS e Tailwind CSS v4.
* `README.md`: Este arquivo manual de consulta técnica.
* `rules.md`: Regras de desenvolvimento do agente Antigravity sobre a utilização do Pure Shadcn UI.
* `tsconfig.json`: Configuração do compilador TypeScript (paths `@/*`, target ESNext, strict mode).
* `vercel.json`: Configurações de deploy no ambiente Vercel.
* `vitest.config.mjs`: Configuração do executor de testes automatizados Vitest.
* `vitest.setup.mjs`: Setup de mocks globais para o ambiente de testes (Jest DOM, matchers).

---

### 4.2 Aplicação / Rotas (`src/app`)

* `src/app/layout.tsx`: Layout raiz da aplicação. Inicializa os Providers (`AuthProvider`, `SWRProvider`, `RealtimeProvider`, `ThemeProvider`), cabeçalhos globais e modais.
* `src/app/page.tsx`: Página inicial (Home Page) com ISR (`revalidate = 60`).
* `src/app/about/page.tsx`: Página "Sobre a Casa dos Escritores".
* `src/app/escrever/page.tsx`: Página do Estúdio do Escritor (Criação e edição de obras/capítulos).
* `src/app/explorar/page.tsx`: Página principal de navegação por categorias.
* `src/app/explorar/[category]/page.tsx`: Filtro de conteúdo por categoria específica.
* `src/app/forgot-password/page.tsx`: Formulário de solicitação de redefinição de senha.
* `src/app/guidelines/page.tsx`: Regras de conduta e diretrizes da comunidade.
* `src/app/login/page.tsx`: Tela de login.
* `src/app/messages/page.tsx`: Interface de chat e bate-papo em tempo real.
* `src/app/notifications/page.tsx`: Central de notificações do usuário.
* `src/app/politica-de-privacidade/page.tsx`: Termos da Política de Privacidade.
* `src/app/privacy/page.tsx`: Atalho/Redirecionamento para a Política de Privacidade.
* `src/app/rankings/page.tsx`: Página do Hall da Fama (Rankings de Escritores e Leitores) com ISR (`revalidate = 3600`).
* `src/app/register/page.tsx`: Formulário de cadastro de novos usuários.
* `src/app/regras-de-publicacao/page.tsx`: Diretrizes editoriais para publicação de obras.
* `src/app/regras-de-uso/page.tsx`: Termos de uso do serviço.
* `src/app/reset-password/page.tsx`: Formulário para digitar a nova senha após link recebido.
* `src/app/robots.txt/route.ts`: Gerador dinâmico do arquivo `robots.txt` para motores de busca.
* `src/app/search/page.tsx`: Página com os resultados da busca global.
* `src/app/series/page.tsx`: Catálogo completo de séries.
* `src/app/series/[slug]/page.tsx`: Página principal da obra (visão pública com SEO e JSON-LD).
* `src/app/capitulo/[slug]/page.tsx`: Página de leitura de capítulo com renderizador imersivo.
* `src/app/comunidades/page.tsx`: Lista de fóruns e comunidades públicas.
* `src/app/comunidades/[slug]/page.tsx`: Feed de postagens de uma comunidade específica.
* `src/app/comunidades/post/[id]/page.tsx`: Detalhe e comentários de um post da comunidade.
* `src/app/docs/page.tsx` & `src/app/docs/[slug]/page.tsx`: Central de documentação e ajuda.
* `src/app/profile/[username]/page.tsx`: Perfil público do usuário/autor.
* `src/app/profile/[username]/followers/page.tsx`: Lista de seguidores de um perfil.
* `src/app/profile/[username]/following/page.tsx`: Lista de perfis seguidos.
* `src/app/profile/edit/page.tsx`: Painel de edição do perfil logado.
* `src/app/sitemap.xml/route.ts`: Gerador de Sitemap XML dinâmico para SEO.
* `src/app/support/page.tsx`: Formulário de atendimento e suporte técnico.
* `src/app/terms/page.tsx`: Termos de Serviço.
* `src/app/unauthorized/page.tsx`: Tela exibida quando o usuário não possui permissão de acesso.
* `src/app/anuncios/page.tsx` & `src/app/anuncios/[slug]/page.tsx`: Mural de comunicados e anúncios oficiais.
* `src/app/post/[slug]/page.tsx`: Visualização direta de uma postagem do feed.
* **Painel Administrativo (`src/app/admin/`)**:
  * `src/app/admin/page.tsx`: Visão geral do Dashboard de Administração.
  * `src/app/admin/announcements/page.tsx`: Gestão de comunicados.
  * `src/app/admin/audit/page.tsx` & `src/app/admin/audit/user/[userId]/page.tsx`: Logs de auditoria de ações.
  * `src/app/admin/categories/page.tsx`: Gerenciador de categorias literárias.
  * `src/app/admin/comments/page.tsx`: Moderação de comentários.
  * `src/app/admin/componentes/page.tsx`: Showcase visual dos componentes do sistema.
  * `src/app/admin/comunidades/page.tsx`: Gestão das comunidades.
  * `src/app/admin/deleted/page.tsx`: Fila de contas em soft-delete.
  * `src/app/admin/inbox/page.tsx`: Caixa de mensagens e feedbacks.
  * `src/app/admin/publications/page.tsx`: Moderação de séries e capítulos.
  * `src/app/admin/users/page.tsx`: Gerenciador de usuários (roles e XP).

---

### 4.3 APIs e Server Actions

#### Server Actions (`src/app/actions/`)
* `src/app/actions/posts.ts`: Actions para criação, exclusão, curtida e repost de postagens do feed.
* `src/app/actions/series.actions.ts`: Actions para arquivamento, exclusão e alteração de status de séries.
* `src/app/admin/actions.ts`: Actions exclusivas para administração (aprovações, bloqueios, métricas).

#### Endpoints de API (`src/app/api/`)
* `src/app/api/admin/announcements/get-series/route.ts`: Busca de séries atreladas a anúncios.
* `src/app/api/admin/delete-user/route.ts`: Marcação de conta para soft-delete (30 dias).
* `src/app/api/admin/reset-age-verification/route.ts`: Liberação de nova tentativa de alteração de data de nascimento.
* `src/app/api/admin/restore-user/route.ts`: Restauração de conta marcada para exclusão.
* `src/app/api/admin/security-stats/route.ts`: Métricas de segurança para o painel admin.
* `src/app/api/admin/update-user/route.ts`: Atualização de perfil/role de usuário via admin.
* `src/app/api/admin/update-xp/route.ts`: Alteração manual de XP de usuário via admin.
* `src/app/api/analytics/visit/route.ts`: Registro de visualizações no site (`site_visits`).
* `src/app/api/auth/callback/route.ts`: Callback do fluxo de autenticação Supabase OAuth.
* `src/app/api/auth/signout/route.ts`: Rota de logout da sessão.
* `src/app/api/blog/redirect/route.ts`: Redirecionamentos legados de posts.
* `src/app/api/categories/route.ts`: Listagem de categorias.
* `src/app/api/chapters/route.ts` & `src/app/api/chapters/view/route.ts`: Operações CRUD e contagem de views em capítulos.
* `src/app/api/comments/route.ts` & `src/app/api/comments/vote/route.ts`: Criação e votos em comentários.
* `src/app/api/follow/route.ts`: Rota para seguir/deixar de seguir autores.
* `src/app/api/giphy/route.ts`: Proxy seguro para busca de GIFs na API do Giphy.
* `src/app/api/likes/route.ts`: Rota de curtidas em obras e capítulos.
* `src/app/api/messages/xp/route.ts`: Atribuição de XP por envio de mensagens ativas.
* `src/app/api/most-commented/route.ts`: Endpoint RPC para conteúdos mais comentados.
* `src/app/api/notifications/route.ts`, `notify-followers/route.ts` e `xp/route.ts`: Gerenciamento e disparo de notificações.
* `src/app/api/og/route.ts`: Gerador dinâmico de imagens OpenGraph (OG Images) com `@vercel/og`.
* `src/app/api/playlists/route.ts`, `[id]/route.ts`, `items/route.ts`: Gestão de listas de leitura do usuário.
* `src/app/api/posts/route.ts`, `like/route.ts`, `repost/route.ts`: Endpoints do feed de postagens.
* `src/app/api/profile/route.ts`, `age-verification/route.ts`, `export/route.ts`: Gestão de perfil e exportação de dados (LGPD).
* `src/app/api/reading-history/route.ts`: Histórico de leitura do usuário ("Continue Lendo").
* `src/app/api/recent-content/route.ts`: Listagem de conteúdos publicados recentemente.
* `src/app/api/register/route.ts`: Endpoint de cadastro.
* `src/app/api/search/suggestions/route.ts` e `search/xp/route.ts`: Autocompletar e busca por XP.
* `src/app/api/series/route.ts`, `archive/route.ts`, `complete/route.ts`, `delete/route.ts`, `follow/route.ts`, `view/route.ts`: Operações nas séries literárias.
* `src/app/api/suggestions/route.ts` e `reply/route.ts`: Envio de feedbacks/sugestões e respostas da administração.
* `src/app/api/upload/route.ts`: Upload seguro de mídias (capas, avatares) para o Supabase Storage.

---

### 4.4 Componentes UI e Funcionais (`src/components/`)

#### Primitivos de UI (`src/components/ui/`)
* `alert-dialog.tsx`, `alert.tsx`, `avatar.tsx`, `back-button.tsx`, `badge.tsx`, `breadcrumb.tsx`, `button.tsx`, `calendar.tsx`, `card.tsx`, `carousel.tsx`, `checkbox.tsx`, `collapsible.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `hover-card.tsx`, `input.tsx`, `label.tsx`, `loading-states.tsx`, `navigation-menu.tsx`, `optimized-image.tsx`, `pagination.tsx`, `popover.tsx`, `progress.tsx`, `radio-group.tsx`, `scroll-area.tsx`, `select.tsx`, `separator.tsx`, `sheet.tsx`, `skeleton.tsx`, `slider.tsx`, `sonner.tsx`, `stack.tsx`, `switch.tsx`, `table.tsx`, `tabs.tsx`, `textarea.tsx`, `tooltip.tsx`, `CoverPlaceholder.tsx`, `GuestCTA.tsx`, `InfiniteScrollList.tsx`, `LoadMoreButton.tsx`.

#### Componentes de Negócio e Layout
* `AccessTracker.tsx`: Rastreador de sessões e visualizações no cliente.
* `Comments.tsx`: Seção completa de comentários com suporte a respostas.
* `ConfirmModal.tsx`: Modal genérico de confirmação de ações destrutivas.
* `ContentCard.tsx`: Card padrão de exibição de séries/livros.
* `ContentListItem.tsx`: Item em lista para exibição de séries em linhas.
* `ContinueLendo.tsx`: Carrossel com o progresso de leitura do usuário logado.
* `HomeFeed.tsx`, `HomeHero.tsx`, `HomeMobileTabs.tsx`, `HomeAnnouncementHero.tsx`: Componentes da Home Page.
* `InfinitePostList.tsx`: Lista de rolagens infinitas de posts.
* `MostCommentedList.tsx`, `RankedSeriesList.tsx`, `RecentContentList.tsx`, `UserRankingList.tsx`: Carrosséis da home page.
* `Pagination.tsx`: Componente de paginação.
* `SaveToPlaylistModal.tsx`: Modal para salvar obra em playlists personalizadas.
* `SearchFilterBar.tsx` & `SearchResults.tsx`: Interface da página de busca.
* `SeriesChaptersList.tsx`, `SeriesActions.tsx`: Ações e lista de capítulos na página da série.
* `SuggestionModal.tsx`: Modal para envio de sugestões à equipe.
* `UserAvatar.tsx` & `UserFollowButton.tsx`: Avatar padrão e botão de seguir autor.
* `ViewIncrementer.tsx`: Componente invisível para incrementar visualizações únicas.
* `WelcomeBack.tsx`: Banner de boas-vindas para o usuário retornado.
* **Módulos Internos (`src/components/`)**:
  * `admin/`: Componentes do painel administrativo (`AdminPathAnalytics.tsx`, `AnnouncementModal.tsx`, `DataTable.tsx`, `EditUserDialog.tsx`, `PageHeader.tsx`).
  * `comments/`: Subcomponentes de comentários (`CommentItem.tsx`, `CommentReply.tsx`).
  * `comunidades/`: Componentes do fórum (`CommunityDetailClient.tsx`).
  * `content/` & `content-viewer/`: Interface de leitura e escrita (`ChapterEditorSidebar.tsx`, `ContentTitleHeader.tsx`, `MobileEditorialStatus.tsx`, `RetentionModals.tsx`, `UniversalContentEditor.tsx`, `WorkCreationWizard.tsx`, `WorkMetadataForm.tsx`, `ContentFooter.tsx`, `ContentViewer.tsx`, `ParagraphCommentPanel.tsx`, `RelatedContent.tsx`).
  * `editor/`: Utilitários do editor de capítulos (`AutosaveIndicator.tsx`, `ColorPicker.tsx`, `EditorAlerts.tsx`, `EditorAuthGuard.tsx`, `EditorModals.tsx`, `FirstChapterTypeModal.tsx`, `MobileContentEditorHeader.tsx`, `MobileContentEditorStats.tsx`, `VersionHistory.tsx`).
  * `header/` & `navigation/`: Navegação da aplicação (`HeaderLogo.tsx`, `HeaderMobileMenu.tsx`, `HeaderNav.tsx`, `HeaderSearch.tsx`, `HeaderUserMenu.tsx`, `DesktopHeader.tsx`, `MobileHeader.tsx`, `MobileAppSidebarTabs.tsx`, `BreadcrumbStandard.tsx`).
  * `layout/`: Grids e containers estruturais (`Container.tsx`, `ContentBlock.tsx`, `LegalContainer.tsx`, `LegalPageHeader.tsx`, `MobileFooter.tsx`, `MobilePageHeader.tsx`, `PageLayout.tsx`, `Section.tsx`, `Stack.tsx`).
  * `messages/`: Componentes do chat (`ChatConversationList.tsx`, `ChatMessageWindow.tsx`, `ConversationSkeleton.tsx`, `NewConversationDialog.tsx`).
  * `notifications/`: Notificações (`NotificationBell.tsx`, `NotificationItem.tsx`).
  * `profile/`: Perfil e edição (`ProfileHeader.tsx`, `ProfileSidebar.tsx`, `ProfileContentManager.tsx`, `ProfileWorks.tsx`, `ProfilePlaylists.tsx`, `ProfileComments.tsx`, `LevelProgress.tsx`, `XPInfoModal.tsx`, `PostCard.tsx`, `PostComposer.tsx`, `PostDetailReplies.tsx`, `PostFeed.tsx`, `ProfileAgeBadge.tsx`, `WorkManagerCard.tsx`, `SeriesPreviewCard.tsx`, `AvatarUploadCard.tsx`, `ProfileInfoCard.tsx`, `ProfileSecurityCard.tsx`, `ProfileSocialCard.tsx`, `ProfileAgeVerificationCard.tsx`).
  * `providers/`: Provedores de contexto React (`AuthProvider.tsx`, `RealtimeProvider.tsx`, `SWRProvider.tsx`).
  * `series/`: Componentes da obra (`AdultContentModal.tsx`, `CategoryInfiniteList.tsx`, `CollapsibleDescription.tsx`, `DiscoveryHeader.tsx`, `SeriesEconomicInfo.tsx`, `SeriesHero.tsx`, `SeriesHubClient.tsx`, `SeriesMetadata.tsx`, `SeriesMobileHero.tsx`, `ShareNudge.tsx`).
  * `tiptap/`: Editor WYSIWYG Tiptap v3 (`TiptapEditor.tsx`, `EditorViewer.tsx`, `BubbleMenu.tsx`, `Sidebar.tsx`, `WritingResources.tsx`) e extensões customizadas em `tiptap/extensions/` (`Dropcap.ts`, `Verse.ts`, `InfoBlock.ts`, `InfoBlockComponent.tsx`, `YoutubeExtension.ts`, `YoutubeComponent.tsx`, `ImageExtension.ts`, `ImageComponent.tsx`, `PreventConsecutiveEmptyParagraphs.ts`).

---

### 4.5 Custom Hooks (`src/hooks/`)

* `src/hooks/useAdminAnnouncements.ts`: Hook de controle dos comunicados administrativos.
* `src/hooks/useAdminAudit.ts`: Hook para consulta aos logs de auditoria.
* `src/hooks/useAdminCategories.ts`: Hook de gestão de categorias.
* `src/hooks/useAdminComments.ts`: Hook de moderação de comentários.
* `src/hooks/useAdminCommunityPosts.ts`: Hook de moderação de posts do fórum.
* `src/hooks/useAdminConversations.ts`: Hook para gerenciamento de mensagens no admin.
* `src/hooks/useAdminDashboard.ts`: Hook de carregamento das métricas gerais do admin.
* `src/hooks/useAdminPublications.ts`: Hook para moderação de séries/capítulos.
* `src/hooks/useAdminStats.ts`: Hook para dados analíticos do painel admin.
* `src/hooks/useAdminSuggestions.ts`: Hook para consulta às sugestões dos usuários.
* `src/hooks/useAdminUsers.ts`: Hook para gestão de usuários e edição de XP.
* `src/hooks/useAgeVerification.ts`: Hook para controle da confirmação de idade do usuário (+18).
* `src/hooks/useAuthForm.ts`: Hook de gerenciamento do formulário de auth.
* `src/hooks/useCachedData.ts`: Hook para gerenciamento de cache local e SWR.
* `src/hooks/useContentEditor.ts`: Hook central com o estado e métodos do editor de capítulos.
* `src/hooks/use-debounce.ts`: Hook para aplicar debounce em inputs (ex: busca com delay).
* `src/hooks/useDeletedUsers.ts`: Hook de controle da fila de soft-delete.
* `src/hooks/useInfiniteScroll.ts`: Hook para gerenciar rolagem infinita de listas.
* `src/hooks/useMobile.ts`: Hook de detecção de viewport mobile.
* `src/hooks/useNotifications.ts`: Hook para buscar e atualizar notificações em tempo real.
* `src/hooks/usePasswordRecovery.ts`: Hook para o fluxo de recuperação de senha.
* `src/hooks/useProfileEditor.ts`: Hook com o estado de edição do perfil.
* `src/hooks/useReaderSettings.ts`: Hook para persistir preferências do leitor (fonte, tamanho, espaçamento).
* `src/hooks/useUserRole.ts`: Hook para checagem rápida das permissões e papéis do usuário.
* `src/hooks/editor/`: Sub-hooks do editor (`useAutosave.ts`, `useEditorMedia.ts`, `useEditorPersistence.ts`, `useEditorState.ts`, `useEditorStats.ts`).

---

### 4.6 Bibliotecas e Utilitários (`src/lib/` & `src/services/`)

* `src/lib/age-verification.ts`: Validações de data de nascimento e regras de idade mínima.
* `src/lib/api-client.ts`: Cliente HTTP configurado com tratamento de erros.
* `src/lib/categories.ts`: Definição e constantes das categorias literárias.
* `src/lib/comment-utils.ts`: Funções auxiliares para formatação e ordenação de comentários.
* `src/lib/csrf-protection.ts`: Proteção e validação de tokens CSRF em formulários sensíveis.
* `src/lib/delete-user.ts`: Lógica de remoção de dados do usuário em conformidade com a LGPD.
* `src/lib/gamification.ts`: Fórmulas matemáticas de nível e XP (`calculateLevel`, `getLevelProgress`).
* `src/lib/ip-hash.ts`: Utilitário para anonymizar e aplicar hash em IPs de acessos.
* `src/lib/lexical-converter.ts`: Conversor legado de estruturas Lexical para HTML/JSON.
* `src/lib/playlist-service.ts`: Métodos de serviço para gestão de playlists.
* `src/lib/quality-check.ts`: Validador de qualidade de texto de capítulos antes da publicação.
* `src/lib/rate-limit.ts`: Middleware de rate-limiting para rotas de API sensíveis.
* `src/lib/roles.ts`: Definições das permissões do sistema (`user`, `admin`, `moderator`).
* `src/lib/sanitize.ts`: Sanitização de HTML contra ataques XSS usando DOMPurify.
* `src/lib/security-logger.ts`: Logger de auditoria e segurança de acessos administrativos.
* `src/lib/subscription.ts`: Utilitários de verificação de planos de assinatura.
* `src/lib/supabase-admin.ts`: Inicializador do cliente Supabase Admin com `SERVICE_ROLE_KEY` (RLS Bypass).
* `src/lib/supabase-browser.ts`: Inicializador do cliente Supabase para o navegador (Nativo Browser).
* `src/lib/supabase-server.ts`: Inicializador do cliente Supabase para o Next.js Server Components.
* `src/lib/toast.ts` & `src/lib/xp-toast.tsx`: Utilitários para exibição de toasts de notificação e alertas de XP.
* `src/lib/utils.ts`: Utilitário global (`cn` para mesclagem Tailwind, formatação de datas e mídias).
* `src/services/audit.ts`: Serviço de registro de auditoria.
* `src/services/notifications.ts`: Serviço de disparo de notificações.
* `src/services/series.service.ts`: Serviço de dados de séries.
* `src/services/xp.ts`: Serviço de concessão de pontos de XP.
* `src/config/xp.ts`: Tabela de constantes com os valores de XP concedidos por ação.
* `src/lib/__tests__/`: Suíte de testes unitários (`age-verification.test.ts`, `csrf-protection.test.ts`, `gamification.test.ts`, `roles.test.ts`, `sanitize.test.ts`, `utils.test.ts`).

---

### 4.7 Estilos e Tokens (`src/styles/`)

* `src/styles/tokens.css`: Declaração das variáveis CSS root da paleta de cores (HSL), radii e sombras.
* `src/styles/base.css`: Estilos base globais, resets HTML e regras de tipografia.
* `src/styles/utilities.css`: Classes utilitárias personalizadas do Tailwind CSS (esconder scrollbars, animações).

---

### 4.8 Tipagem TypeScript (`src/types/`)

* `src/types/admin.ts`: Tipos do painel administrativo e tabelas de gestão.
* `src/types/content.types.ts`: Tipos do editor, capítulos e obras.
* `src/types/database.types.ts`: Definição automática de tipos do banco de dados Supabase (Gerado via CLI).
* `src/types/home.ts`: Tipos das coleções e itens exibidos na Home Page.
* `src/types/messages.ts`: Tipos do sistema de chat e conversas.
* `src/types/notifications.ts`: Tipos das notificações.
* `src/types/post.ts`: Tipos de postagens do feed comunitário.
* `src/types/search.ts`: Tipos dos resultados de busca.

---

### 4.9 Banco de Dados e Migrações (`supabase/migrations/`)

* `20260403_gamification_01_core_functions.sql`: Função `grant_xp` em PL/pgSQL para atualização de XP no banco.
* `20260403_gamification_README.sql`: Documentação das tabelas de pontuação de XP por ação.
* `20260521070000_unify_community_comments_in_core_comments.sql`: Migração unificando comentários em uma tabela central.
* `20260723_add_recursive_reply_count.sql`: Adição de função para contagem recursiva de respostas.
* `20260723_update_get_user_timeline.sql`: Atualização da função RPC da timeline do usuário.
* `20260724_database_optimization.sql`: Criação de índices de busca e otimizações gerais de tabelas.

---

## 5. Recursos Descontinuados e Atualizações Recentes

### ❌ Recursos Descontinuados
1. **Resend Email Service**: O envio de e-mails automatizados via API da Resend e cron jobs associados foi totalmente removido para simplificar a arquitetura e eliminar custos operacionais desnecessários.
2. **Editor Lexical**: O editor de texto rico antigo (Lexical) foi descontinuado em favor da migração total para o **Tiptap v3**.
3. **Cron Jobs Externos**: Cron jobs de transmissões automáticas e disparos foram desativados.

### 🌟 Atualizações Recentes Realizadas
* **Cálculo Dinâmico do Nível nos Rankings**: Os rankings de usuários na Home Page e na página `/rankings` foram ajustados para exibir o **Nível Geral / Perfil** (`calculateLevel(profile.xp)`) em vez dos níveis setorizados.
* **Limitação de Alteração de Data de Nascimento**: A alteração da data de nascimento no perfil foi limitada a 1 única oportunidade por conta por razões de conformidade de conteúdo sensível (+18).
* **Índices de Banco de Dados**: Criados os índices `idx_site_visits_session_path` na tabela `site_visits` e `idx_series_created_at_desc` / `idx_series_updated_at_desc` na tabela `series`.
* **Code-Splitting na Home Page**: Componentes pesados abaixo da dobra foram convertidos para carregamento dinâmico via `next/dynamic`.

---

## 6. Oportunidades de Melhoria e Problemas a Resolver

1. **Ajuste de Mocks de Testes Automatizados (Vitest)**:
   * **Situação**: O arquivo de teste `src/app/api/admin/update-user/__tests__/route.test.ts` falha em ambiente de integração contínua por falta da exportação `logSecurityEvent` no mock do `@/lib/security-logger`.
   * **Solução recomendada**: Atualizar a declaração `vi.mock("@/lib/security-logger")` nos testes para incluir a função `logSecurityEvent`.

2. **Paginação Real no Banco de Dados para a View de Rankings**:
   * **Situação**: Atualmente a ordenação por engajamento é feita na memória do Next.js.
   * **Solução recomendada**: Criar uma View no Postgres que já pré-calcule o engajamento acumulado por autor, permitindo que a consulta no Next.js use `.limit(15)` nativo no Supabase.

3. **Opt-in de Verificação de Idade no Leitor de Capítulos**:
   * Garantir que todas as obras com a flag `is_explicit = true` acionem automaticamente o modal de verificação `AdultContentModal.tsx` caso o usuário não tenha o atributo `age_verified` confirmado em seu perfil.

---

*Documento atualizado e mantido pela equipe de engenharia da **Casa dos Escritores**.*
