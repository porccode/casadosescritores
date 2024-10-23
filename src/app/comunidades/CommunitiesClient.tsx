"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Users, Search, Plus, Shield, ShieldAlert, Loader2, ArrowRight, 
  ArrowDownUp, Flame, Calendar, Sparkles, Star, ChevronLeft, 
  ChevronRight, MessageSquare, Settings
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { createBrowserClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn, getMediaUrl } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_color: string;
  avatar_color: string;
  creator_id: string;
  is_private: boolean;
  member_count?: number;
  user_status?: string; 
  creator_username?: string;
  creator_avatar_url?: string;
  avatar_url?: string | null;
  cover_url?: string | null;
  is_featured?: boolean;
  tags?: string[];
  rules?: string[];
  post_count?: number;
  created_at: string;
}

const PALETTE_OPTIONS = [
  { name: "Sunset", cover: "bg-gradient-to-r from-orange-200 via-rose-200 to-amber-200 dark:from-orange-950/60 dark:via-rose-950/60 dark:to-amber-950/60", avatar: "bg-rose-600 text-white" },
  { name: "Aurora", cover: "bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-200 dark:from-emerald-950/60 dark:via-teal-950/60 dark:to-cyan-950/60", avatar: "bg-emerald-600 text-white" },
  { name: "Cosmic", cover: "bg-gradient-to-r from-purple-200 via-indigo-200 to-blue-200 dark:from-purple-950/60 dark:via-indigo-950/60 dark:to-blue-950/60", avatar: "bg-purple-600 text-white" },
  { name: "Crimson", cover: "bg-gradient-to-r from-red-200 via-rose-200 to-pink-200 dark:from-red-950/60 dark:via-rose-950/60 dark:to-pink-950/60", avatar: "bg-red-600 text-white" },
  { name: "Slate", cover: "bg-slate-200 dark:bg-slate-800", avatar: "bg-slate-600 text-white" },
  { name: "Ocean", cover: "bg-blue-100 dark:bg-blue-900/40", avatar: "bg-blue-600 text-white" },
  { name: "Forest", cover: "bg-emerald-100 dark:bg-emerald-900/40", avatar: "bg-emerald-600 text-white" },
  { name: "Rose", cover: "bg-rose-100 dark:bg-rose-900/40", avatar: "bg-rose-600 text-white" },
  { name: "Amber", cover: "bg-amber-100 dark:bg-amber-900/40", avatar: "bg-amber-600 text-white" },
  { name: "Lilac", cover: "bg-purple-100 dark:bg-purple-900/40", avatar: "bg-purple-600 text-white" },
];

const AVAILABLE_TAGS = [
  "Fantasia", "Romance", "Terror", "Suspense", "Poesia", 
  "Ficção Científica", "Drama", "Contos", "Brasileiro", "LGBTQ+"
];

export function CommunitiesClient({ 
  initialCommunities,
  recommendedGenres = [],
  isUserAdmin = false
}: { 
  initialCommunities: Community[];
  recommendedGenres?: string[];
  isUserAdmin?: boolean;
}) {
  const { user, loading: authLoading } = useAuth();
  const supabase = createBrowserClient() as any;
  const router = useRouter();

  const [communities, setCommunities] = useState<Community[]>(initialCommunities);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("discover");
  const [sortOrder, setSortOrder] = useState<"recent" | "popular">("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state if initialCommunities change (SSR update)
  useEffect(() => {
    setCommunities(initialCommunities);
  }, [initialCommunities]);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Reset page on filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, sortOrder, activeTab]);

  const newSlug = useMemo(() => {
    return newName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }, [newName]);

  const handleJoin = async (comm: Community) => {
    if (!user) {
      toast.error("Você precisa estar logado para entrar em uma comunidade!");
      router.push(`/login?redirectTo=/comunidades`);
      return;
    }

    try {
      const status = comm.is_private ? "requested" : "joined";
      const { error } = await supabase.from("community_members").insert({
        community_id: comm.id,
        user_id: user.id,
        role: "member",
        status: status,
      });

      if (error) throw error;

      if (comm.is_private) {
        toast.success(`Solicitação de entrada enviada para a comunidade ${comm.name}!`);
        setCommunities((prev) => 
          prev.map((c) => c.id === comm.id ? { ...c, user_status: "requested" } : c)
        );
      } else {
        toast.success(`Você entrou na comunidade ${comm.name}!`);
        setCommunities((prev) => 
          prev.map((c) => c.id === comm.id ? { ...c, user_status: "joined", member_count: (c.member_count || 0) + 1 } : c)
        );
        router.push(`/comunidades/${comm.slug}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível processar a solicitação.");
    }
  };

  const handleToggleFeatured = async (comm: Community, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isUserAdmin) return;
    const newFeatured = !comm.is_featured;

    try {
      const { error } = await supabase
        .from("communities")
        .update({ is_featured: newFeatured })
        .eq("id", comm.id);

      if (error) throw error;

      toast.success(
        newFeatured 
          ? `Comunidade "${comm.name}" destacada com sucesso!` 
          : `Destaque removido de "${comm.name}".`
      );

      setCommunities((prev) =>
        prev.map((c) => c.id === comm.id ? { ...c, is_featured: newFeatured } : c)
      );
    } catch (err) {
      console.error(err);
      toast.error("Erro ao alterar destaque da comunidade.");
    }
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newName.trim()) {
      toast.error("Insira o nome da comunidade.");
      return;
    }

    if (!newSlug.trim()) {
      toast.error("O link amigável (slug) é obrigatório.");
      return;
    }

    setIsSubmitting(true);
    try {
      const randomPalette = PALETTE_OPTIONS[Math.floor(Math.random() * PALETTE_OPTIONS.length)];

      const { data: comm, error: commError } = await supabase
        .from("communities")
        .insert({
          name: newName.trim(),
          slug: newSlug.trim(),
          description: newDescription.trim() || null,
          cover_color: randomPalette.cover,
          avatar_color: randomPalette.avatar,
          creator_id: user.id,
          is_private: isPrivate,
          tags: [],
          rules: [],
        })
        .select()
        .single();

      if (commError) {
        if (commError.code === "23505") {
          throw new Error("Já existe uma comunidade com este nome ou link amigável.");
        }
        throw commError;
      }

      const { error: memberError } = await supabase.from("community_members").insert({
        community_id: comm.id,
        user_id: user.id,
        role: "owner",
        status: "joined",
      });

      if (memberError) throw memberError;

      toast.success("Comunidade criada com sucesso!");
      setIsCreateOpen(false);
      
      setNewName("");
      setNewDescription("");
      setIsPrivate(false);

      router.push(`/comunidades/${comm.slug}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao criar a comunidade.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filterList = (list: Community[]) => {
    return list.filter((c) => {
      const matchesSearch = 
        c.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
      return matchesSearch;
    });
  };

  const myCommunities = communities.filter(
    (c) => c.creator_id === user?.id || c.user_status === "joined"
  );
  
  const discoverComms = communities;



  const displayedDiscover = useMemo(() => {
    const list = filterList(discoverComms);
    if (sortOrder === "popular") {
      return [...list]
        .sort((a, b) => {
          const scoreA = (a.member_count || 0) * 3 + (a.post_count || 0);
          const scoreB = (b.member_count || 0) * 3 + (b.post_count || 0);
          return scoreB - scoreA;
        })
        .slice(0, 10);
    }
    // "Mais Recentes" (recent): Slice to top 10 most recent communities
    return [...list]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  }, [communities, debouncedSearchTerm, sortOrder]);

  const displayedMy = useMemo(() => filterList(myCommunities), [communities, debouncedSearchTerm]);

  const totalPages = Math.ceil(displayedDiscover.length / ITEMS_PER_PAGE);
  const paginatedDiscover = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return displayedDiscover.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [displayedDiscover, currentPage]);

  return (
    <div className="w-full">
      <section className="relative w-full py-12 lg:py-16 bg-gradient-to-br from-primary/10 via-background to-secondary/5 border-b overflow-hidden">
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
        <div className="w-full max-w-[75rem] mx-auto px-4 relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
              Comunidades de Escritores
            </h1>
            <p className="text-muted-foreground text-base lg:text-lg">
              Crie ou participe de comunidades literárias para debater gêneros, compartilhar feedbacks e conversar com outros leitores e autores.
            </p>
          </div>
          <div className="flex items-center shrink-0">
            {user ? (
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="rounded-full shadow-md gap-2 font-semibold">
                    <Plus className="h-5 w-5" />
                    Criar Comunidade
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px]">
                  <form onSubmit={handleCreateCommunity}>
                    <DialogHeader>
                      <DialogTitle className="text-xl">Nova Comunidade</DialogTitle>
                      <DialogDescription>
                        Monte seu espaço literário personalizado. Escolha se ele será público ou privado.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="comm-name">Nome da Comunidade</Label>
                        <Input
                          id="comm-name"
                          placeholder="Ex: Fantasia Medieval Br"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          maxLength={50}
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="comm-slug">Link da Comunidade</Label>
                        <div className="flex items-center gap-1 bg-secondary px-3 py-2 rounded-lg text-sm text-muted-foreground">
                          <span>casadosescritores.com.br/comunidades/</span>
                          <span className="font-semibold text-foreground truncate max-w-[150px]">
                            {newSlug || "fantasia-medieval-br"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="comm-desc">Descrição / Diretrizes</Label>
                        <Textarea
                          id="comm-desc"
                          placeholder="Sobre o que é esta comunidade? Quais regras os membros devem seguir?"
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          maxLength={300}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Privacidade do Espaço</Label>
                        <RadioGroup
                          value={isPrivate ? "private" : "public"}
                          onValueChange={(val) => setIsPrivate(val === "private")}
                          className="grid grid-cols-1 gap-3"
                        >
                          <div 
                            onClick={() => setIsPrivate(false)}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-xl border cursor-pointer hover:bg-accent/40 transition-all",
                              !isPrivate ? "border-primary bg-primary/[0.02]" : "border-border bg-card"
                            )}
                          >
                            <RadioGroupItem value="public" id="privacy-public" className="mt-1" />
                            <div className="flex-1 space-y-0.5">
                              <label htmlFor="privacy-public" className="text-sm font-bold flex items-center gap-1.5 text-foreground cursor-pointer">
                                <Users className="h-4 w-4 text-emerald-600" />
                                Comunidade Pública
                              </label>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                Qualquer pessoa pode visualizar as discussões, membros e entrar livremente. Ideal para debates abertos.
                              </p>
                            </div>
                          </div>

                          <div 
                            onClick={() => setIsPrivate(true)}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-xl border cursor-pointer hover:bg-accent/40 transition-all",
                              isPrivate ? "border-primary bg-primary/[0.02]" : "border-border bg-card"
                            )}
                          >
                            <RadioGroupItem value="private" id="privacy-private" className="mt-1" />
                            <div className="flex-1 space-y-0.5">
                              <label htmlFor="privacy-private" className="text-sm font-bold flex items-center gap-1.5 text-foreground cursor-pointer">
                                <Shield className="h-4 w-4 text-primary" />
                                Comunidade Privada
                              </label>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                As discussões e membros são ocultos. Apenas membros convidados ou aprovados pelo dono podem ler e participar.
                              </p>
                            </div>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsCreateOpen(false)}
                        disabled={isSubmitting}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmitting} className="gap-2">
                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        Criar Espaço
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            ) : (
              <Button asChild size="lg" className="rounded-full shadow-md font-semibold gap-2">
                <Link href={`/login?redirectTo=/comunidades`}>
                  <Plus className="h-5 w-5" />
                  Criar Comunidade
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <main className="w-full max-w-[75rem] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar comunidades pelo nome ou assunto..."
                className="pl-11 h-12 bg-card rounded-xl border shadow-sm focus-visible:ring-1 focus-visible:ring-primary/20 text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 p-1 bg-muted rounded-xl h-11">
                <TabsTrigger value="discover" className="rounded-lg font-semibold h-9 transition-all">
                  Descobrir
                </TabsTrigger>
                <TabsTrigger value="my-communities" className="rounded-lg font-semibold h-9 transition-all">
                  Minhas Comunidades
                  {myCommunities.length > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-accent text-foreground">
                      {myCommunities.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="discover" className="mt-6 space-y-6">


                <div className="flex items-center justify-between pb-1">
                  <h2 className="text-lg font-bold text-foreground">
                    Todas as Comunidades
                  </h2>
                  <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                    <Button 
                      variant={sortOrder === "recent" ? "default" : "ghost"} 
                      size="sm" 
                      onClick={() => setSortOrder("recent")}
                      className={`h-7 text-xs px-3 rounded-md ${sortOrder === "recent" ? "shadow-sm" : ""}`}
                    >
                      Mais Recentes
                    </Button>
                    <Button 
                      variant={sortOrder === "popular" ? "default" : "ghost"} 
                      size="sm" 
                      onClick={() => setSortOrder("popular")}
                      className={`h-7 text-xs px-3 rounded-md gap-1 ${sortOrder === "popular" ? "shadow-sm" : ""}`}
                    >
                      <Flame className="h-3 w-3" /> Populares
                    </Button>
                  </div>
                </div>

                {paginatedDiscover.length === 0 ? (
                  <Card className="text-center py-16 border-dashed shadow-none bg-muted/30">
                    <CardContent className="flex flex-col items-center justify-center space-y-3 pb-0">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-2">
                        <Users className="h-8 w-8 text-muted-foreground/60" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">Nenhuma comunidade encontrada</h3>
                      <p className="text-muted-foreground text-sm max-w-sm">
                        {searchTerm 
                          ? "Não encontramos comunidades correspondentes à sua busca. Tente usar termos diferentes." 
                          : "Ainda não há novas comunidades disponíveis para você participar."
                        }
                      </p>
                      {searchTerm && (
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSearchTerm("");
                          }} 
                          className="mt-4 rounded-full"
                        >
                          Limpar Filtros
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {paginatedDiscover.map((comm) => (
                        <CommunityCard
                          key={comm.id}
                          comm={comm}
                          onJoin={() => handleJoin(comm)}
                          isUserAdmin={isUserAdmin}
                          onToggleFeatured={handleToggleFeatured}
                          currentUserId={user?.id}
                        />
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-border pt-4 mt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="rounded-full gap-1 h-8 text-xs font-semibold"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                        </Button>
                        <span className="text-xs font-semibold text-muted-foreground">
                          Página {currentPage} de {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="rounded-full gap-1 h-8 text-xs font-semibold"
                        >
                          Próxima <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="my-communities" className="mt-6">
                {!user && !authLoading ? (
                  <Card className="text-center py-16 border shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center space-y-3 pb-0">
                      <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-2">
                        <ShieldAlert className="h-8 w-8 text-amber-500" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">Acesso Restrito</h3>
                      <p className="text-muted-foreground text-sm max-w-sm">
                        Faça login para gerenciar ou visualizar as comunidades em que você já está inscrito.
                      </p>
                      <Button asChild className="mt-6 rounded-full px-8">
                        <Link href={`/login?redirectTo=/comunidades`}>Fazer Login</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : displayedMy.length === 0 ? (
                  <Card className="text-center py-16 border-dashed shadow-none bg-muted/30">
                    <CardContent className="flex flex-col items-center justify-center space-y-3 pb-0">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-2">
                        <Users className="h-8 w-8 text-muted-foreground/60" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">Você não participa de nenhuma comunidade</h3>
                      <p className="text-muted-foreground text-sm max-w-sm mb-4">
                        Explore a aba "Descobrir" e faça novas conexões com outros escritores apaixonados por literatura!
                      </p>
                      <Button onClick={() => setActiveTab("discover")} variant="default" className="rounded-full mt-2">
                        Descobrir Comunidades
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayedMy.map((comm) => (
                      <CommunityCard
                        key={comm.id}
                        comm={comm}
                        onJoin={() => {}}
                        isUserAdmin={isUserAdmin}
                        onToggleFeatured={handleToggleFeatured}
                        currentUserId={user?.id}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card className="shadow-sm border">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Diretrizes do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <span className="font-bold text-primary shrink-0">1.</span>
                  <p>Respeite a diversidade de opiniões. Feedbacks devem ser construtivos e focados na escrita.</p>
                </div>
                <div className="flex gap-3">
                  <span className="font-bold text-primary shrink-0">2.</span>
                  <p>Comunidades Privadas mantêm as discussões seguras para grupos de leitura beta específicos.</p>
                </div>
                <div className="flex gap-3">
                  <span className="font-bold text-primary shrink-0">3.</span>
                  <p>Nossos planos são totalmente gratuitos! Não realizamos cobranças por criação de espaços.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function CommunityCard({
  comm,
  onJoin,
  isUserAdmin,
  onToggleFeatured,
  currentUserId
}: {
  comm: Community;
  onJoin: () => void;
  isUserAdmin?: boolean;
  onToggleFeatured?: (comm: Community, e: React.MouseEvent) => void;
  currentUserId?: string;
}) {
  const initials = comm.name.charAt(0).toUpperCase();

  function formatRelativeTime(dateString: string) {
    try {
      const created = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - created.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) return "Criada hoje";
      if (diffDays === 2) return "Criada ontem";
      return `Ativa há ${diffDays} dias`;
    } catch (e) {
      return "Ativa";
    }
  }

  const isFeatured = comm.is_featured;
  const isCreator = currentUserId && comm.creator_id === currentUserId;

  return (
    <Card 
      className={`overflow-hidden hover:shadow-lg transition-all flex flex-col h-full border group relative ${
        isFeatured 
          ? "border-amber-400/60 dark:border-amber-500/40 shadow-md shadow-amber-500/[0.02] bg-gradient-to-br from-amber-500/[0.02] via-background to-secondary/[0.02]" 
          : ""
      }`}
    >
      {/* Featured Badge or Admin Toggle */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
        {isFeatured && (
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Destaque
          </Badge>
        )}
        {isCreator && (
          <Button
            size="icon"
            type="button"
            variant="ghost"
            asChild
            className="h-7 w-7 rounded-full bg-background/80 hover:bg-background border shadow-sm text-muted-foreground hover:text-primary transition-all"
            title="Editar Comunidade"
          >
            <Link href={`/comunidades/${comm.slug}?tab=settings`}>
              <Settings className="h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
        {isUserAdmin && onToggleFeatured && (
          <Button
            size="icon"
            type="button"
            variant="ghost"
            onClick={(e) => onToggleFeatured(comm, e)}
            className={`h-7 w-7 rounded-full bg-background/80 hover:bg-background border shadow-sm transition-all ${
              isFeatured ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground hover:text-amber-500"
            }`}
            title={isFeatured ? "Remover Destaque" : "Destacar Comunidade"}
          >
            <Star className={`h-3.5 w-3.5 ${isFeatured ? "fill-amber-500 text-amber-500" : ""}`} />
          </Button>
        )}
      </div>

      <div className={`h-16 w-full relative ${comm.cover_color} flex items-end px-4`}>
        <Avatar className="h-12 w-12 border border-background translate-y-4 shadow-sm shrink-0">
          {comm.avatar_url && (
            <AvatarImage src={getMediaUrl(comm.avatar_url, 'covers')} alt={comm.name} className="object-cover" />
          )}
          <AvatarFallback className={`font-semibold text-sm ${comm.avatar_color}`}>
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>

      <CardHeader className="pt-6 pb-2">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <Link href={`/comunidades/${comm.slug}`} className="hover:underline min-w-0">
            <CardTitle className="text-base font-semibold text-foreground truncate">
              {comm.name}
            </CardTitle>
          </Link>
          <div className="flex items-center gap-1.5 shrink-0">
            {isCreator && (
              <Badge 
                variant="outline"
                className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary border-primary/20 shrink-0"
              >
                Dono
              </Badge>
            )}
            <Badge
              variant={comm.is_private ? "destructive" : "secondary"}
              className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
            >
              {comm.is_private ? "Privada" : "Pública"}
            </Badge>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 font-medium">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-muted-foreground/80" />
            {comm.member_count === 1
              ? "1 membro"
              : `${comm.member_count || 0} membros`}
          </span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground/80" />
            {comm.post_count === 1
              ? "1 publicação"
              : `${comm.post_count || 0} publicações`}
          </span>
        </div>

        {/* Creator Info */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <Avatar className="h-5 w-5 shrink-0">
            {comm.creator_avatar_url ? (
              <AvatarImage src={comm.creator_avatar_url} alt={comm.creator_username || "Criador"} />
            ) : (
              <AvatarFallback className="text-[10px] bg-accent text-foreground font-semibold flex items-center justify-center">
                {(comm.creator_username || "C").charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <span className="text-xs text-muted-foreground">
            Criada por <span className="font-medium text-foreground">{comm.creator_username || "Escritor"}</span>
          </span>
        </div>
      </CardHeader>

      <CardContent className="pb-4 flex-1 flex flex-col justify-between">
        {comm.rules && comm.rules.length > 0 ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full text-xs gap-1.5 h-9 font-medium border-primary/20 hover:bg-primary/5 hover:text-primary text-primary bg-primary/[0.02] rounded-lg"
              >
                <Shield className="h-3.5 w-3.5 text-primary" />
                Leia as regras antes de entrar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] max-h-[85vh] flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Regras da Comunidade
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Siga as diretrizes abaixo para manter um ambiente saudável em <strong>{comm.name}</strong>.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-3 overflow-y-auto max-h-[55vh] pr-1.5 scrollbar-thin">
                {comm.rules.map((rule, idx) => (
                  <div key={idx} className="flex gap-3 text-sm items-start leading-relaxed bg-muted dark:bg-card/40 p-3 rounded-lg border border-border/60">
                    <span className="font-semibold text-primary bg-primary/10 h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-xs">
                      {idx + 1}
                    </span>
                    <p className="text-foreground pt-0.5 whitespace-pre-wrap leading-relaxed">{rule}</p>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {comm.description || "Esta comunidade ainda não possui uma descrição definida."}
          </p>
        )}

        {/* Tags list */}
        {comm.tags && comm.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {comm.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs px-2 py-0.5 rounded-md font-medium bg-muted/40 text-muted-foreground border-muted-foreground/10 shrink-0"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 border-t bg-muted/40 dark:bg-card/30 px-4 py-3 flex items-center justify-between mt-auto">
        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {formatRelativeTime(comm.created_at)}
        </span>

        {comm.user_status === "joined" ? (
          <Button asChild size="sm" variant="outline" className="rounded-full h-8 gap-1.5 font-semibold text-xs border bg-white hover:bg-secondary">
            <Link href={`/comunidades/${comm.slug}`}>
              Acessar
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        ) : comm.user_status === "requested" ? (
          <Button disabled size="sm" variant="secondary" className="rounded-full h-8 font-semibold text-xs gap-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Solicitado
          </Button>
        ) : comm.user_status === "invited" ? (
          <Button asChild size="sm" className="rounded-full h-8 font-semibold text-xs bg-primary hover:bg-primary/95 text-primary-foreground">
            <Link href={`/comunidades/${comm.slug}`}>Ver Convite</Link>
          </Button>
        ) : comm.is_private ? (
          <Button onClick={onJoin} size="sm" variant="outline" className="rounded-full h-8 font-semibold text-xs border border-primary/30 hover:bg-primary/5 text-primary">
            Solicitar
          </Button>
        ) : (
          <Button onClick={onJoin} size="sm" className="rounded-full h-8 gap-1 font-semibold text-xs bg-primary hover:bg-primary/95 text-primary-foreground">
            <Plus className="h-3.5 w-3.5" /> Entrar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
