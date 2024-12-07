"use client";

import React, { useState } from "react";
import { toast } from "@/lib/toast";
import { showXPToast } from "@/lib/xp-toast";
import { useConfirm } from "@/components/ConfirmModal";
import DeleteAccountModal from "@/components/DeleteAccountModal";
import SaveToPlaylistModal from "@/components/SaveToPlaylistModal";
import SuggestionModal from "@/components/SuggestionModal";
import XPInfoModal from "@/components/profile/XPInfoModal";
import FollowersModal from "@/components/profile/FollowersModal";
import { AdultContentModal } from "@/components/series/AdultContentModal";
import { FirstChapterTypeModal } from "@/components/editor/FirstChapterTypeModal";
import { ThreeDaysDeadlineModal, FirstChapterCongratsModal } from "@/components/content/RetentionModals";
import { EditorModals } from "@/components/editor/EditorModals";
import DonationModal from "@/components/header/DonationModal";
import ReplyModal from "@/components/profile/ReplyModal";
import WorkCreationWizard from "@/components/content/WorkCreationWizard";
import { EditUserDialog } from "@/components/admin/EditUserDialog";
import AnnouncementModal from "@/components/admin/AnnouncementModal";
import { AuditLogDetails } from "@/components/admin/AuditLogDetails";
import { NewConversationDialog } from "@/components/messages/NewConversationDialog";
import PlaylistModal from "@/components/profile/PlaylistModal";
import VersionHistory from "@/components/editor/VersionHistory";
import { AdminUser, AuditLog } from "@/types/admin";
import UserFollowButton from "@/components/UserFollowButton";
import BackButton from "@/components/ui/back-button";
import Pagination from "@/components/Pagination";
import SeriesStatusBadge from "@/components/SeriesStatusBadge";
import { KpiCard } from "@/components/admin/KpiCard";
import AnnouncementBanner from "@/components/AnnouncementBanner";

// Shadcn Primitives
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Icons
import {
  Component,
  Bell,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Sparkles,
  ShieldAlert,
  ListPlus,
  Trophy,
  Users,
  Eye,
  MousePointerClick,
  Layers,
  FileText,
  Bookmark,
  Loader2,
  BookOpen,
  Heart,
  Video,
  PenLine,
  MessageCircle,
  X
} from "lucide-react";

export default function AdminComponentesPage() {
  const { confirm } = useConfirm();

  // Modal States
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [savePlaylistOpen, setSavePlaylistOpen] = useState(false);
  const [xpInfoOpen, setXpInfoOpen] = useState(false);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [adultContentOpen, setAdultContentOpen] = useState(false);

  // New Modals States
  const [firstChapterTypeOpen, setFirstChapterTypeOpen] = useState(false);
  const [threeDaysDeadlineOpen, setThreeDaysDeadlineOpen] = useState(false);
  const [firstChapterCongratsOpen, setFirstChapterCongratsOpen] = useState(false);
  const [editorXpErrorOpen, setEditorXpErrorOpen] = useState(false);
  const [editorVideoOpen, setEditorVideoOpen] = useState(false);
  const [editorVideoUrl, setEditorVideoUrl] = useState("");
  const [donationOpen, setDonationOpen] = useState(false);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [workCreationWizardOpen, setWorkCreationWizardOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [auditLogDetailsOpen, setAuditLogDetailsOpen] = useState(false);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [mockAdminUser, setMockAdminUser] = useState<AdminUser>({
    id: "demo-user-1",
    email: "machado@casadosescritores.com.br",
    username: "machadodeassis",
    first_name: "Machado",
    last_name: "de Assis",
    avatar_url: null,
    role: "admin",
    xp: 1450,
    level: 5,
    created_at: new Date().toISOString(),
  });

  const mockAuditLog: AuditLog = {
    id: "log-evt-998231",
    user_id: "user-123",
    admin_id: "admin-456",
    action: "UPDATE_SERIES_SETTINGS",
    entity_type: "series",
    entity_id: "series-456",
    ip_address: "187.54.120.91",
    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    created_at: new Date().toISOString(),
    profiles: {
      id: "user-123",
      username: "autor_exemplar",
      avatar_url: null,
    },
    metadata: {
      changed_fields: ["is_explicit", "copyright_type"],
      old_value: { is_explicit: false },
      new_value: { is_explicit: true },
      performed_by_admin: true,
    },
  };

  const mockAnnouncement = {
    id: "banner-demo-1",
    title: "Inscrições Abertas para o Concurso Literário de Inverno",
    message: "Envie seus contos e concorra a prêmios em XP e destaque na página principal da plataforma.",
    background_color: "#494EB6",
    text_color: "#ffffff",
    link_url: "https://casadosescritores.com.br",
    link_label: "Participar Agora",
    button_bg_color: "#ffffff",
    button_text_color: "#494EB6",
    start_date: new Date().toISOString().slice(0, 16),
    is_active: true,
    type: "short",
    author_id: "admin-1",
    created_at: new Date().toISOString(),
  };

  const mockWorkEditor = {
    title: "Minha Nova Saga Fantástica",
    setTitle: () => {},
    description: "Sinopse completa de demonstração para exibição do wizard de criação de obras na Casa dos Escritores.",
    setDescription: () => {},
    genres: ["Fantasia", "Aventura"],
    setGenres: () => {},
    setCategory: () => {},
    isExplicit: false,
    setIsExplicit: () => {},
    commentsEnabled: true,
    setCommentsEnabled: () => {},
    isAIGenerated: "no",
    setIsAIGenerated: () => {},
    aiCoverGenerated: "no",
    setAiCoverGenerated: () => {},
    copyrightType: "all_rights_reserved",
    setCopyrightType: () => {},
    authorNote: "",
    setAuthorNote: () => {},
    relatedSeriesId: null,
    setRelatedSeriesId: () => {},
    coverPreview: null,
    error: null,
    setError: () => {},
    isDraft: false,
    isSaving: false,
    isPublishing: false,
    handleSubmit: async () => ({ success: true, data: { id: "demo-series-1", isFirstBook: true } }),
  };

  const isAnySampleModalOpen =
    deleteAccountOpen ||
    savePlaylistOpen ||
    xpInfoOpen ||
    followersModalOpen ||
    adultContentOpen ||
    firstChapterTypeOpen ||
    threeDaysDeadlineOpen ||
    firstChapterCongratsOpen ||
    editorXpErrorOpen ||
    editorVideoOpen ||
    donationOpen ||
    replyModalOpen ||
    workCreationWizardOpen ||
    editUserDialogOpen ||
    announcementModalOpen ||
    auditLogDetailsOpen ||
    playlistModalOpen;

  const closeAllSampleModals = () => {
    setDeleteAccountOpen(false);
    setSavePlaylistOpen(false);
    setXpInfoOpen(false);
    setFollowersModalOpen(false);
    setAdultContentOpen(false);
    setFirstChapterTypeOpen(false);
    setThreeDaysDeadlineOpen(false);
    setFirstChapterCongratsOpen(false);
    setEditorXpErrorOpen(false);
    setEditorVideoOpen(false);
    setDonationOpen(false);
    setReplyModalOpen(false);
    setWorkCreationWizardOpen(false);
    setEditUserDialogOpen(false);
    setAnnouncementModalOpen(false);
    setAuditLogDetailsOpen(false);
    setPlaylistModalOpen(false);
  };

  // Form Inputs Demo
  const [inputVal, setInputVal] = useState("Texto de exemplo");
  const [textareaVal, setTextareaVal] = useState("Exemplo de sinopse ou mensagem para consulta.");
  const [switchVal, setSwitchVal] = useState(true);
  const [checkboxVal, setCheckboxVal] = useState(true);
  const [selectVal, setSelectVal] = useState("opcao1");

  // Handlers for confirm dialogs
  const handleConfirmDanger = async () => {
    const result = await confirm({
      title: "Excluir Item Permanentemente?",
      message: "Esta ação apagará os dados do banco de dados e não poderá ser desfeita.",
      type: "danger",
      confirmText: "Sim, Excluir",
      cancelText: "Cancelar",
    });
    if (result) {
      toast.success("Ação confirmada (Danger)!");
    } else {
      toast.info("Ação cancelada pelo usuário.");
    }
  };

  const handleConfirmWarning = async () => {
    const result = await confirm({
      title: "Alterar Configurações?",
      message: "As alterações afetam a visibilidade do conteúdo para outros usuários.",
      type: "warning",
      confirmText: "Prosseguir",
      cancelText: "Manter como está",
    });
    if (result) {
      toast.warning("Ação confirmada (Warning)!");
    }
  };

  const handleConfirmInfo = async () => {
    const result = await confirm({
      title: "Publicar Nova Versão?",
      message: "Uma notificação será enviada para todos os leitores que seguem você.",
      type: "info",
      confirmText: "Publicar Agora",
      cancelText: "Salvar Rascunho",
    });
    if (result) {
      toast.info("Ação confirmada (Info)!");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Estudo de Caso & Catálogo de Componentes
            </h1>
            <Badge variant="outline" className="gap-1 border-primary/30 text-primary bg-primary/10">
              <Component className="w-3.5 h-3.5" />
              UI Live System
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Listagem e teste interativo em tempo real de todas as janelas modais, toasties, botões, alertas e cartões do sistema.
          </p>
        </div>
      </div>

      {/* Tabs Container */}
      <Tabs defaultValue="modais" className="w-full space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="modais" className="gap-2 text-xs md:text-sm font-medium">
            <Layers className="w-4 h-4" />
            Modais & Diálogos
          </TabsTrigger>
          <TabsTrigger value="toasty" className="gap-2 text-xs md:text-sm font-medium">
            <Bell className="w-4 h-4" />
            Toasty & Alertas
          </TabsTrigger>
          <TabsTrigger value="botoes" className="gap-2 text-xs md:text-sm font-medium">
            <MousePointerClick className="w-4 h-4" />
            Botões & Ações
          </TabsTrigger>
          <TabsTrigger value="badges" className="gap-2 text-xs md:text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            Badges & Status
          </TabsTrigger>
          <TabsTrigger value="regras" className="gap-2 text-xs md:text-sm font-medium">
            <FileText className="w-4 h-4" />
            Cards & Limites
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* TAB 1: MODAIS & DIÁLOGOS */}
        {/* ========================================================================= */}
        <TabsContent value="modais" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* FirstChapterTypeModal */}
            <Card className="flex flex-col justify-between border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="default">FirstChapterTypeModal</Badge>
                  <span className="text-xs text-muted-foreground font-mono">Início de Série</span>
                </div>
                <CardTitle className="text-base mt-2">Modal "Como Quer Começar?"</CardTitle>
                <CardDescription className="text-xs">
                  Modal exibido ao criar uma série perguntando se o autor deseja começar com <strong>Prólogo</strong> ou <strong>Primeiro Capítulo</strong>.
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button variant="default" size="sm" className="w-full gap-2 font-bold" onClick={() => setFirstChapterTypeOpen(true)}>
                  <PenLine className="w-4 h-4" /> Abrir Modal (Prólogo / Cap. 1)
                </Button>
              </CardFooter>
            </Card>

            {/* FirstChapterCongratsModal */}
            <Card className="flex flex-col justify-between border-emerald-500/30 bg-emerald-500/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-emerald-500 text-emerald-600 dark:text-emerald-400">CongratsModal</Badge>
                  <span className="text-xs text-muted-foreground font-mono">Engajamento</span>
                </div>
                <CardTitle className="text-base mt-2">Modal de Parabéns (1º Capítulo)</CardTitle>
                <CardDescription className="text-xs">
                  Exibe parabéns ao publicar o 1º capítulo e o aviso explicativo sobre manter frequência e o selo de "Abandonada" após 15 dias.
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button variant="outline" size="sm" className="w-full gap-2 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10" onClick={() => setFirstChapterCongratsOpen(true)}>
                  <Sparkles className="w-4 h-4 text-emerald-500" /> Abrir Modal Parabéns
                </Button>
              </CardFooter>
            </Card>

            {/* ThreeDaysDeadlineModal */}
            <Card className="flex flex-col justify-between border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-amber-500 text-amber-500">RetentionModal</Badge>
                  <span className="text-xs text-muted-foreground font-mono">Retenção</span>
                </div>
                <CardTitle className="text-base mt-2">Alerta de Prazo de 3 Dias</CardTitle>
                <CardDescription className="text-xs">
                  Notifica o autor que séries sem capítulo por mais de 3 dias serão ocultadas automaticamente.
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button variant="outline" size="sm" className="w-full gap-2 border-amber-500/50 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400" onClick={() => setThreeDaysDeadlineOpen(true)}>
                  <AlertTriangle className="w-4 h-4" /> Ver Alerta de 3 Dias
                </Button>
              </CardFooter>
            </Card>

            {/* Editor XP Error Modal */}
            <Card className="flex flex-col justify-between border-destructive/30 bg-destructive/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="destructive">EditorModals</Badge>
                  <span className="text-xs text-muted-foreground font-mono">Saldo XP</span>
                </div>
                <CardTitle className="text-base mt-2">Modal Inspiração Insuficiente (XP)</CardTitle>
                <CardDescription className="text-xs">
                  Modal disparado quando o autor tenta realizar ações sem ter o saldo de XP exigido, com dicas de como acumular.
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button variant="destructive" size="sm" className="w-full gap-2" onClick={() => setEditorXpErrorOpen(true)}>
                  <AlertCircleIcon className="w-4 h-4" /> Testar Modal XP Insuficiente
                </Button>
              </CardFooter>
            </Card>

            {/* Editor Video Modal */}
            <Card className="flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">EditorModals</Badge>
                  <span className="text-xs text-muted-foreground font-mono">Editor</span>
                </div>
                <CardTitle className="text-base mt-2">Modal Inserir Vídeo (YouTube)</CardTitle>
                <CardDescription className="text-xs">
                  Diálogo do editor Tiptap para inserção de links de vídeo do YouTube nas obras.
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button variant="secondary" size="sm" className="w-full gap-2" onClick={() => setEditorVideoOpen(true)}>
                  <Video className="w-4 h-4" /> Abrir Modal Vídeo
                </Button>
              </CardFooter>
            </Card>

            {/* DonationModal */}
            <Card className="flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-rose-500 text-rose-500">DonationModal</Badge>
                  <span className="text-xs text-muted-foreground font-mono">Apoio</span>
                </div>
                <CardTitle className="text-base mt-2">Modal Apoie a Casa dos Escritores</CardTitle>
                <CardDescription className="text-xs">
                  Modal para contribuições via Pix / LivePix para manutenção dos servidores da comunidade.
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button variant="outline" size="sm" className="w-full gap-2 border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10" onClick={() => setDonationOpen(true)}>
                  <Heart className="w-4 h-4 text-rose-500 fill-current" /> Abrir Modal doação
                </Button>
              </CardFooter>
            </Card>

            {/* ReplyModal */}
            <Card className="flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">ReplyModal</Badge>
                  <span className="text-xs text-muted-foreground font-mono">Comentários</span>
                </div>
                <CardTitle className="text-base mt-2">Modal Responder Publicação</CardTitle>
                <CardDescription className="text-xs">
                  Modal de resposta direta para posts do feed e comentários de obras.
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button variant="secondary" size="sm" className="w-full gap-2" onClick={() => setReplyModalOpen(true)}>
                  <MessageCircle className="w-4 h-4" /> Testar Reply Modal
                </Button>
              </CardFooter>
            </Card>

            {/* ConfirmModal Danger */}
            <Card className="flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="destructive">ConfirmModal</Badge>
                  <span className="text-xs text-muted-foreground font-mono">Danger</span>
                </div>
                <CardTitle className="text-base mt-2">Modal de Confirmação (Perigo)</CardTitle>
                <CardDescription className="text-xs">
                  Usado para ações destrutivas como exclusões definitivas de histórias, capítulos ou comentários.
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button variant="destructive" size="sm" className="w-full gap-2" onClick={handleConfirmDanger}>
                  <AlertTriangle className="w-4 h-4" /> Testar Confirm Danger
                </Button>
              </CardFooter>
            </Card>

            {/* ConfirmModal Warning */}
            <Card className="flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-amber-500 text-amber-500">ConfirmModal</Badge>
                  <span className="text-xs text-muted-foreground font-mono">Warning</span>
                </div>
                <CardTitle className="text-base mt-2">Modal de Confirmação (Aviso)</CardTitle>
                <CardDescription className="text-xs">
                  Usado para avisos com impacto moderado ou alteração de visibilidade e permissões.
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button variant="outline" size="sm" className="w-full gap-2 border-amber-500/50 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400" onClick={handleConfirmWarning}>
                  <AlertTriangle className="w-4 h-4" /> Testar Confirm Warning
                </Button>
              </CardFooter>
            </Card>

            {/* ConfirmModal Info */}
            <Card className="flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">ConfirmModal</Badge>
                  <span className="text-xs text-muted-foreground font-mono">Info</span>
                </div>
                <CardTitle className="text-base mt-2">Modal de Confirmação (Info)</CardTitle>
                <CardDescription className="text-xs">
                  Usado para confirmações informativas, como salvar rascunho ou notificar seguidores.
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button variant="secondary" size="sm" className="w-full gap-2" onClick={handleConfirmInfo}>
                  <Info className="w-4 h-4" /> Testar Confirm Info
                </Button>
              </CardFooter>
            </Card>

            {/* DeleteAccountModal */}
            <Card className="flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="destructive">AccountModal</Badge>
                  <span className="text-xs text-muted-foreground font-mono">Dialog</span>
                </div>
                <CardTitle className="text-base mt-2">Modal Exclusão de Conta</CardTitle>
                <CardDescription className="text-xs">
                  Exige digitação exata do nickname e confirmação de senha do usuário.
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button variant="outline" size="sm" className="w-full gap-2 text-destructive hover:bg-destructive/10" onClick={() => setDeleteAccountOpen(true)}>
                  <ShieldAlert className="w-4 h-4" /> Abrir Modal de Exclusão
                </Button>
              </CardFooter>
            </Card>

            {/* SaveToPlaylistModal */}
            <Card className="flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="default">PlaylistModal</Badge>
                  <span className="text-xs text-muted-foreground font-mono">Dialog</span>
                </div>
                <CardTitle className="text-base mt-2">Modal Salvar em Playlist</CardTitle>
                <CardDescription className="text-xs">
                  Permite salvar a obra/capítulo em playlists de leitura criadas pelo leitor.
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button variant="default" size="sm" className="w-full gap-2" onClick={() => setSavePlaylistOpen(true)}>
                  <ListPlus className="w-4 h-4" /> Abrir Playlist Modal
                </Button>
              </CardFooter>
            </Card>

            {/* SuggestionModal */}
            <Card className="flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">SuggestionModal</Badge>
                  <span className="text-xs text-muted-foreground font-mono">Dialog</span>
                </div>
                <CardTitle className="text-base mt-2">Modal de Enviar Sugestão</CardTitle>
                <CardDescription className="text-xs">
                  Formulário para feedback e envio de anexos com verificação de login.
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <div className="w-full">
                  <SuggestionModal />
                </div>
              </CardFooter>
            </Card>

            {/* XPInfoModal */}
            <Card className="flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-primary/40 text-primary">XPInfoModal</Badge>
                  <span className="text-xs text-muted-foreground font-mono">Gamificação</span>
                </div>
                <CardTitle className="text-base mt-2">Modal Níveis & Regras de XP</CardTitle>
                <CardDescription className="text-xs">
                  Exibe o funcionamento de níveis de Escritor, Leitor e a tabela completa de ganhos de XP.
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setXpInfoOpen(true)}>
                  <Trophy className="w-4 h-4 text-primary" /> Abrir Tabela de XP
                </Button>
              </CardFooter>
            </Card>

            {/* FollowersModal */}
            <Card className="flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">FollowersModal</Badge>
                  <span className="text-xs text-muted-foreground font-mono">Perfis</span>
                </div>
                <CardTitle className="text-base mt-2">Modal de Seguidores / Seguindo</CardTitle>
                <CardDescription className="text-xs">
                  Exibe lista de seguidores com botão de seguir/deixar de seguir diretamente.
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button variant="secondary" size="sm" className="w-full gap-2" onClick={() => setFollowersModalOpen(true)}>
                  <Users className="w-4 h-4" /> Ver Seguidores
                </Button>
              </CardFooter>
            </Card>

            {/* AdultContentModal */}
            <Card className="flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="destructive">AdultContentModal</Badge>
                  <span className="text-xs text-muted-foreground font-mono">+18</span>
                </div>
                <CardTitle className="text-base mt-2">Aviso Conteúdo Adulto (+18)</CardTitle>
                <CardDescription className="text-xs">
                  Barreira de confirmação para leitor antes de visualizar obras sensíveis.
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button variant="destructive" size="sm" className="w-full gap-2" onClick={() => setAdultContentOpen(true)}>
                  <Eye className="w-4 h-4" /> Testar Aviso +18
                </Button>
              </CardFooter>
            </Card>

            {/* WorkCreationWizard */}
            <Card className="flex flex-col justify-between border-primary/40 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="default">WorkCreationWizard</Badge>
                  <span className="text-xs text-muted-foreground font-mono">Nova Obra</span>
                </div>
                <CardTitle className="text-base mt-2">Wizard de Criação de Obra (4 Passos)</CardTitle>
                <CardDescription className="text-xs">
                  Modal completo de criação de história/série com 4 passos, avisos de qualidade, opção +18 e tela de conclusão com XP/bônus.
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button variant="default" size="sm" className="w-full gap-2 font-bold" onClick={() => setWorkCreationWizardOpen(true)}>
                  <BookOpen className="w-4 h-4" /> Testar Wizard de Criação
                </Button>
              </CardFooter>
            </Card>

            {/* EditUserDialog */}
            <Card className="flex flex-col justify-between border-indigo-500/30 bg-indigo-500/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-indigo-500 text-indigo-600 dark:text-indigo-400">EditUserDialog</Badge>
                  <span className="text-xs text-muted-foreground font-mono">Admin</span>
                </div>
                <CardTitle className="text-base mt-2">Editar Usuário (Admin)</CardTitle>
                <CardDescription className="text-xs">
                  Diálogo do painel administrativo para alteração de dados de cadastro (username, nome, email).
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button variant="outline" size="sm" className="w-full gap-2 border-indigo-500/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10" onClick={() => setEditUserDialogOpen(true)}>
                  <Users className="w-4 h-4" /> Editar Registro Usuário
                </Button>
              </CardFooter>
            </Card>

            {/* AnnouncementModal */}
            <Card className="flex flex-col justify-between border-purple-500/30 bg-purple-500/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-purple-500 text-purple-600 dark:text-purple-400">AnnouncementModal</Badge>
                  <span className="text-xs text-muted-foreground font-mono">Banners Admin</span>
                </div>
                <CardTitle className="text-base mt-2">Criar / Editar Banner de Anúncio</CardTitle>
                <CardDescription className="text-xs">
                  Modal de configuração de banners (barra superior ou destaques), cores, link e período de exibição.
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button variant="outline" size="sm" className="w-full gap-2 border-purple-500/40 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10" onClick={() => setAnnouncementModalOpen(true)}>
                  <Bell className="w-4 h-4" /> Configurar Banner
                </Button>
              </CardFooter>
            </Card>

            {/* AuditLogDetails */}
            <Card className="flex flex-col justify-between border-slate-500/30 bg-slate-500/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">AuditLogDetails</Badge>
                  <span className="text-xs text-muted-foreground font-mono">Auditoria</span>
                </div>
                <CardTitle className="text-base mt-2">Detalhes de Evento de Auditoria</CardTitle>
                <CardDescription className="text-xs">
                  Inspeção detalhada de payload JSON, IP, User Agent e metadados de segurança.
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button variant="secondary" size="sm" className="w-full gap-2" onClick={() => setAuditLogDetailsOpen(true)}>
                  <ShieldAlert className="w-4 h-4" /> Ver Log de Auditoria
                </Button>
              </CardFooter>
            </Card>

            {/* PlaylistModal */}
            <Card className="flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-primary text-primary">PlaylistModal</Badge>
                  <span className="text-xs text-muted-foreground font-mono">Perfil</span>
                </div>
                <CardTitle className="text-base mt-2">Criar / Editar Playlist</CardTitle>
                <CardDescription className="text-xs">
                  Modal de criação e personalização de playlists de leitura do perfil do escritor.
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setPlaylistModalOpen(true)}>
                  <ListPlus className="w-4 h-4 text-primary" /> Criar Playlist
                </Button>
              </CardFooter>
            </Card>

          </div>

          {/* Active Modal Demonstrations */}
          {firstChapterTypeOpen && (
            <FirstChapterTypeModal
              isOpen={firstChapterTypeOpen}
              onClose={() => setFirstChapterTypeOpen(false)}
              onSelect={(type) => {
                toast.success(`Selecionado: ${type === 'prologue' ? 'Prólogo' : 'Primeiro Capítulo'}`);
                setFirstChapterTypeOpen(false);
              }}
            />
          )}

          {threeDaysDeadlineOpen && (
            <ThreeDaysDeadlineModal
              isOpen={threeDaysDeadlineOpen}
              onClose={() => setThreeDaysDeadlineOpen(false)}
              onConfirm={() => {
                toast.info("Redirecionando para escrever o primeiro capítulo...");
                setThreeDaysDeadlineOpen(false);
              }}
            />
          )}

          {firstChapterCongratsOpen && (
            <FirstChapterCongratsModal
              isOpen={firstChapterCongratsOpen}
              onClose={() => setFirstChapterCongratsOpen(false)}
            />
          )}

          {editorXpErrorOpen && (
            <EditorModals
              isVideoDialogOpen={false}
              setIsVideoDialogOpen={() => {}}
              videoUrl=""
              setVideoUrl={() => {}}
              handleVideoConfirm={() => {}}
              editor={null}
              userXP={10}
              setUserXP={() => {}}
              xpErrorModalOpen={editorXpErrorOpen}
              setXpErrorModalOpen={setEditorXpErrorOpen}
              xpErrorData={{ currentXp: 10, xpRequired: 50 }}
            />
          )}

          {editorVideoOpen && (
            <EditorModals
              isVideoDialogOpen={editorVideoOpen}
              setIsVideoDialogOpen={setEditorVideoOpen}
              videoUrl={editorVideoUrl}
              setVideoUrl={setEditorVideoUrl}
              handleVideoConfirm={() => {
                toast.success(`Vídeo inserido: ${editorVideoUrl}`);
                setEditorVideoOpen(false);
              }}
              editor={null}
              userXP={100}
              setUserXP={() => {}}
              xpErrorModalOpen={false}
              setXpErrorModalOpen={() => {}}
              xpErrorData={null}
            />
          )}

          {donationOpen && (
            <DonationModal
              open={donationOpen}
              onClose={() => setDonationOpen(false)}
            />
          )}

          {replyModalOpen && (
            <ReplyModal
              post={{
                id: "demo-post-1",
                content: "Esta é uma publicação de exemplo no perfil para demonstração da janela modal de resposta.",
                created_at: new Date().toISOString(),
                author: {
                  id: "author-1",
                  username: "escritor_exemplar",
                  first_name: "Machado",
                  last_name: "de Assis",
                }
              }}
              currentUserId="admin-user-id"
              currentUsername="Administrador"
              onClose={() => setReplyModalOpen(false)}
            />
          )}

          {deleteAccountOpen && (
            <DeleteAccountModal
              isOpen={deleteAccountOpen}
              onClose={() => setDeleteAccountOpen(false)}
              userNickname="AutorExemplo"
            />
          )}

          {savePlaylistOpen && (
            <SaveToPlaylistModal
              open={savePlaylistOpen}
              onOpenChange={setSavePlaylistOpen}
              contentId="demo-post-123"
              contentType="series"
              contentTitle="Exemplo de História Fantástica"
            />
          )}

          {xpInfoOpen && (
            <XPInfoModal
              open={xpInfoOpen}
              onOpenChange={setXpInfoOpen}
              totalXP={1250}
            />
          )}

          {followersModalOpen && (
            <FollowersModal
              profileId="demo-id"
              profileUsername="escritor_demo"
              type="followers"
              onClose={() => setFollowersModalOpen(false)}
            />
          )}

          {adultContentOpen && (
            <AdultContentModal
              isExplicit={true}
              hideClose={false}
              onClose={() => setAdultContentOpen(false)}
            />
          )}

          {workCreationWizardOpen && (
            <WorkCreationWizard
              editor={mockWorkEditor}
              categories={["Fantasia", "Ficção Científica", "Romance", "Mistério", "Poesia"]}
              hasMounted={true}
              fileInputRef={fileInputRef}
              onCoverChange={() => {}}
              onClose={() => setWorkCreationWizardOpen(false)}
            />
          )}

          {editUserDialogOpen && (
            <EditUserDialog
              user={mockAdminUser}
              open={editUserDialogOpen}
              onOpenChange={setEditUserDialogOpen}
              onUserChange={setMockAdminUser}
              onSave={() => {
                toast.success("Usuário salvo no modo demonstração!");
                setEditUserDialogOpen(false);
              }}
              saving={false}
            />
          )}

          {announcementModalOpen && (
            <AnnouncementModal
              isOpen={announcementModalOpen}
              onClose={() => setAnnouncementModalOpen(false)}
              onSuccess={() => {
                toast.success("Banner configurado com sucesso!");
                setAnnouncementModalOpen(false);
              }}
              announcement={mockAnnouncement as any}
            />
          )}

          {auditLogDetailsOpen && (
            <AuditLogDetails
              log={mockAuditLog}
              open={auditLogDetailsOpen}
              onOpenChange={setAuditLogDetailsOpen}
              getActionBadgeVariant={() => "default"}
            />
          )}

          {playlistModalOpen && (
            <PlaylistModal
              open={playlistModalOpen}
              onOpenChange={setPlaylistModalOpen}
              onSave={async (data) => {
                toast.success(`Playlist "${data.name}" criada em modo demonstração!`);
                setPlaylistModalOpen(false);
              }}
            />
          )}
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: TOASTY & ALERTAS */}
        {/* ========================================================================= */}
        <TabsContent value="toasty" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Disparadores de Toasty (Notificações Flutuantes)</CardTitle>
              <CardDescription>
                Sistema centralizado de toasts via Sonner (`@/lib/toast` e `@/lib/xp-toast`). Clique nos botões para disparar a notificação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="justify-start gap-2 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                  onClick={() => toast.success("Capítulo salvo com sucesso!")}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Toast Sucesso (success)
                </Button>

                <Button
                  variant="outline"
                  className="justify-start gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => toast.error("Ocorreu um erro ao processar seu pedido.")}
                >
                  <XCircle className="w-4 h-4 text-destructive" />
                  Toast Erro (error)
                </Button>

                <Button
                  variant="outline"
                  className="justify-start gap-2 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                  onClick={() => toast.warning("Você está postando muito rápido! Pausa de XP por 1h.")}
                >
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Toast Aviso (warning)
                </Button>

                <Button
                  variant="outline"
                  className="justify-start gap-2 border-sky-500/40 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10"
                  onClick={() => toast.info("Um novo capítulo da série que você segue foi lançado.")}
                >
                  <Info className="w-4 h-4 text-sky-500" />
                  Toast Info (info)
                </Button>

                <Button
                  variant="outline"
                  className="justify-start gap-2 border-primary/40 text-primary hover:bg-primary/10"
                  onClick={() => showXPToast({ amount: 50, action: "Publicar post", message: "Você ganhou 50 XP por publicar uma nova história!" })}
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  Toast XP Gamificação
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alertas Contextuais (Alert Primitive)</CardTitle>
              <CardDescription>
                Componentes de aviso fixos na página (`components/ui/alert.tsx`).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Alerta Padrão</AlertTitle>
                <AlertDescription>
                  Este é um alerta informativo para comunicar dados importantes ao usuário dentro da página.
                </AlertDescription>
              </Alert>

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Alerta Destrutivo</AlertTitle>
                <AlertDescription>
                  Atenção: Ações irreversíveis executadas nesta área podem excluir dados do seu perfil.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: BOTÕES & AÇÕES */}
        {/* ========================================================================= */}
        <TabsContent value="botoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Variantes de Botões Shadcn UI</CardTitle>
              <CardDescription>
                Modelos de botões disponíveis no sistema em `@/components/ui/button`.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider block mb-3">Variantes de Estilo</Label>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="default">Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider block mb-3">Tamanhos (Sizes)</Label>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small (sm)</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large (lg)</Button>
                  <Button size="icon" variant="outline"><Bookmark className="w-4 h-4" /></Button>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider block mb-3">Estados de Carregamento (Disabled & Loading)</Label>
                <div className="flex flex-wrap items-center gap-3">
                  <Button disabled>Desabilitado</Button>
                  <Button disabled variant="outline">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Botões de Ação Específicos da Plataforma</CardTitle>
              <CardDescription>
                Componentes reutilizáveis de interação social e navegação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <Label className="text-xs text-muted-foreground block mb-2">UserFollowButton (Seguir)</Label>
                  <UserFollowButton profileId="demo-user-1" isFollowing={false} username="autor_demo" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground block mb-2">BackButton (Voltar)</Label>
                  <BackButton />
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground block mb-3">Pagination (Paginação Padrão)</Label>
                <div className="p-4 border rounded-lg bg-muted/20">
                  <Pagination currentPage={2} totalPages={5} onPageChange={() => {}} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 4: BADGES & STATUS */}
        {/* ========================================================================= */}
        <TabsContent value="badges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Badges e Rótulos (Shadcn Badge Primitives)</CardTitle>
              <CardDescription>
                Usados para identificação de categorias, tags e estados rápidos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="default">Default Badge</Badge>
                <Badge variant="secondary">Secondary Badge</Badge>
                <Badge variant="destructive">Destructive Badge</Badge>
                <Badge variant="outline">Outline Badge</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SeriesStatusBadge (Status das Séries)</CardTitle>
              <CardDescription>
                Badges padronizadas para representar o ciclo de vida das séries publicadas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-col gap-1 items-center">
                  <SeriesStatusBadge />
                  <span className="text-[10px] text-muted-foreground font-mono">Em andamento</span>
                </div>
                <div className="flex flex-col gap-1 items-center">
                  <SeriesStatusBadge isCompleted={true} />
                  <span className="text-[10px] text-muted-foreground font-mono">Completa</span>
                </div>
                <div className="flex flex-col gap-1 items-center">
                  <SeriesStatusBadge isDraft={true} />
                  <span className="text-[10px] text-muted-foreground font-mono">Rascunho</span>
                </div>
                <div className="flex flex-col gap-1 items-center">
                  <SeriesStatusBadge isExplicit={true} />
                  <span className="text-[10px] text-muted-foreground font-mono">Conteúdo Explícito</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AnnouncementBanner (Banner de Avisos)</CardTitle>
              <CardDescription>
                Banner destacado para avisos globais da plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnnouncementBanner position="top" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 5: CARDS, ENTRADAS & REGRAS */}
        {/* ========================================================================= */}
        <TabsContent value="regras" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard label="Total de Leituras" value="14.250" subtitle="+12% este mês" icon={<BookOpen className="w-4 h-4 text-primary" />} />
            <KpiCard label="Escritores Ativos" value="842" subtitle="Autores publicados" icon={<Users className="w-4 h-4 text-primary" />} />
            <KpiCard label="Taxa de Engajamento" value="68.4%" subtitle="Curtidas e comentários" icon={<Sparkles className="w-4 h-4 text-primary" />} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Formulários & Entradas de Dados (Primitives)</CardTitle>
              <CardDescription>
                Demonstração visual dos campos de formulário utilizados nos modais e páginas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Campo de Texto (Input)</Label>
                  <Input value={inputVal} onChange={(e) => setInputVal(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Menu Seleção (Select)</Label>
                  <Select value={selectVal} onValueChange={setSelectVal}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="opcao1">Opção 1 - Fantasia</SelectItem>
                      <SelectItem value="opcao2">Opção 2 - Romance</SelectItem>
                      <SelectItem value="opcao3">Opção 3 - Ficção Científica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Área de Texto (Textarea)</Label>
                <Textarea value={textareaVal} onChange={(e) => setTextareaVal(e.target.value)} className="min-h-[90px]" />
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center space-x-2">
                  <Switch id="demo-switch" checked={switchVal} onCheckedChange={setSwitchVal} />
                  <Label htmlFor="demo-switch">Notificações por Email</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="demo-check" checked={checkboxVal} onCheckedChange={(val) => setCheckboxVal(!!val)} />
                  <Label htmlFor="demo-check">Aceito os termos da comunidade</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table of Character Limits and Actions Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tabela de Limites de Caracteres & Regras de Ações</CardTitle>
              <CardDescription>
                Especificações e restrições de validação de formulários e pré-requisitos para criação de conteúdo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campo / Ação</TableHead>
                    <TableHead>Local / Componente</TableHead>
                    <TableHead>Limite de Caracteres / Restrição</TableHead>
                    <TableHead>Pré-requisito do Sistema</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-semibold">Título de Série</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">Editor de Séries</TableCell>
                    <TableCell><Badge variant="outline">Máx. 100 caracteres</Badge></TableCell>
                    <TableCell className="text-xs">Estar autenticado como usuário.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Sinopse de Série</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">Editor de Séries</TableCell>
                    <TableCell><Badge variant="outline">Máx. 500 caracteres</Badge></TableCell>
                    <TableCell className="text-xs">Criação prévia de uma Série registrada.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Título de Capítulo</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">Tiptap / Editor</TableCell>
                    <TableCell><Badge variant="outline">Máx. 150 caracteres</Badge></TableCell>
                    <TableCell className="text-xs">Uma Série existente deve estar selecionada.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Conteúdo de Capítulo</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">Tiptap Editor</TableCell>
                    <TableCell><Badge variant="secondary">Sem limite (Recomendado &gt; 300 palavras)</Badge></TableCell>
                    <TableCell className="text-xs">Ganha +XP após leitura completa por leitores.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Biografia de Usuário</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">Editar Perfil</TableCell>
                    <TableCell><Badge variant="outline">Máx. 300 caracteres</Badge></TableCell>
                    <TableCell className="text-xs">Disponível para todos os perfis cadastrados.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Mensagem de Sugestão</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">SuggestionModal</TableCell>
                    <TableCell><Badge variant="outline">Máx. 1.000 caracteres / Anexo máx 2MB</Badge></TableCell>
                    <TableCell className="text-xs">Requer estar logado no sistema.</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AlertCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return <AlertTriangle {...props} />;
}
