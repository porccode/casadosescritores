"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Users, Shield, Lock, Send, Heart, MessageSquare, 
  Trash2, UserPlus, Check, X, Loader2, ArrowLeft, 
  Settings, PenLine, AlertTriangle, ExternalLink, Camera, Upload, Palette
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { toast } from "sonner";
import Comments from "@/components/Comments";
import { Switch } from "@/components/ui/switch";
import CommentText from "@/components/comments/CommentText";
import { cn, getMediaUrl } from "@/lib/utils";

export const COVER_PALETTES = [
  { id: "rose", name: "Rosa Romance", cover: "bg-rose-100 dark:bg-rose-900/40", preview: "bg-rose-400" },
  { id: "amber", name: "Âmbar Fantasia", cover: "bg-amber-100 dark:bg-amber-900/40", preview: "bg-amber-400" },
  { id: "emerald", name: "Esmeralda", cover: "bg-emerald-100 dark:bg-emerald-900/40", preview: "bg-emerald-400" },
  { id: "blue", name: "Azul Oceano", cover: "bg-blue-100 dark:bg-blue-900/40", preview: "bg-blue-400" },
  { id: "purple", name: "Roxo Místico", cover: "bg-purple-100 dark:bg-purple-900/40", preview: "bg-purple-400" },
  { id: "slate", name: "Grafite Neutro", cover: "bg-slate-200 dark:bg-slate-800", preview: "bg-slate-500" },
  { id: "indigo", name: "Índigo", cover: "bg-indigo-100 dark:bg-indigo-900/40", preview: "bg-indigo-400" },
  { id: "teal", name: "Ciano", cover: "bg-teal-100 dark:bg-teal-900/40", preview: "bg-teal-400" },
  { id: "sunset", name: "Gradiente Pôr do Sol", cover: "bg-gradient-to-r from-orange-200 via-rose-200 to-amber-200 dark:from-orange-950/60 dark:via-rose-950/60 dark:to-amber-950/60", preview: "bg-gradient-to-r from-orange-400 via-rose-400 to-amber-400" },
  { id: "aurora", name: "Gradiente Aurora", cover: "bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-200 dark:from-emerald-950/60 dark:via-teal-950/60 dark:to-cyan-950/60", preview: "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" },
  { id: "cosmic", name: "Gradiente Cósmico", cover: "bg-gradient-to-r from-purple-200 via-indigo-200 to-blue-200 dark:from-purple-950/60 dark:via-indigo-950/60 dark:to-blue-950/60", preview: "bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400" },
  { id: "crimson", name: "Gradiente Carmim", cover: "bg-gradient-to-r from-red-200 via-rose-200 to-pink-200 dark:from-red-950/60 dark:via-rose-950/60 dark:to-pink-950/60", preview: "bg-gradient-to-r from-red-400 via-rose-400 to-pink-400" },
];

export interface Profile {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_color: string;
  avatar_color: string;
  creator_id: string;
  is_private: boolean;
  created_at: string;
  rules?: string[];
  avatar_url?: string | null;
  cover_url?: string | null;
}

export interface Member {
  community_id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  profile: Profile;
}

export interface Post {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author: Profile;
  likes: { user_id: string }[];
  likes_count: number;
  comments_count: number;
  comments?: any[];
}

interface CommunityDetailClientProps {
  initialCommunity: Community;
  initialMembers: Member[];
  initialPosts: Post[];
  slug: string;
}

export default function CommunityDetailClient({
  initialCommunity,
  initialMembers,
  initialPosts,
  slug,
}: CommunityDetailClientProps) {
  const { user, loading: authLoading } = useAuth();
  const supabase = createBrowserClient() as any;
  const router = useRouter();

  // Estados principais
  const [community, setCommunity] = useState<Community>(initialCommunity);
  const [isMember, setIsMember] = useState(false);
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const [currentUserMemberRole, setCurrentUserMemberRole] = useState<string | null>(null);
  const [memberStatus, setMemberStatus] = useState<string | null>(null);

  // Abas e listas
  const [activeTab, setActiveTab] = useState("discussion");
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [members, setMembers] = useState<Member[]>(initialMembers.filter(m => m.status === "joined"));
  const [pendingRequests, setPendingRequests] = useState<Member[]>(initialMembers.filter(m => m.status === "requested"));
  
  // Post & Comentários
  const [newPostContent, setNewPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);

  // Busca para convites
  const [searchUsername, setSearchUsername] = useState("");
  const [searchedUsers, setSearchedUsers] = useState<Profile[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  // Configurações
  const [editDescription, setEditDescription] = useState(initialCommunity.description || "");
  const [editRules, setEditRules] = useState(initialCommunity.rules ? initialCommunity.rules.join("\n") : "");
  const [editIsPrivate, setEditIsPrivate] = useState(initialCommunity.is_private);
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);
  const [isDeletingCommunity, setIsDeletingCommunity] = useState(false);
  const [hasPendingInvite, setHasPendingInvite] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    async function checkUserRelation() {
      if (!user) {
        setIsMember(false);
        setMemberStatus(null);
        setCurrentUserMemberRole(null);
        return;
      }

      const [inviteRes, profileRes, memberRes] = await Promise.all([
        supabase.from("community_invites").select("id").eq("community_id", community.id).eq("invitee_id", user.id).eq("status", "pending").maybeSingle(),
        supabase.from("profiles").select("role, is_admin").eq("id", user.id).single(),
        supabase.from("community_members").select("*").eq("community_id", community.id).eq("user_id", user.id).maybeSingle()
      ]);

      setHasPendingInvite(!!inviteRes.data);

      const isSysAdmin = profileRes.data?.role === "admin" || profileRes.data?.is_admin === true;
      setIsSystemAdmin(isSysAdmin);

      const member = memberRes.data;
      if (member) {
        const joined = member.status === "joined" || isSysAdmin;
        setIsMember(joined);
        setMemberStatus(member.status);
        setCurrentUserMemberRole(member.role || (isSysAdmin ? "admin" : null));
      } else {
        setIsMember(isSysAdmin);
        setMemberStatus(isSysAdmin ? "joined" : null);
        setCurrentUserMemberRole(isSysAdmin ? "admin" : null);
      }
    }

    if (!authLoading) {
      checkUserRelation();
    }
  }, [user, authLoading, community.id]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !community) return;

    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error("O arquivo é muito grande. O limite máximo é 2MB.");
      return;
    }

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Formato não suportado. Envie imagens em JPG, PNG ou WebP.");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const { compressImage } = await import("@/lib/utils");
      const compressedFile = await compressImage(file, 800, 0.8);

      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("type", "community_avatar");
      formData.append("userId", user.id);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Falha ao enviar imagem.");
      }

      const { url } = await res.json();

      const { error: updateError } = await supabase
        .from("communities")
        .update({ avatar_url: url })
        .eq("id", community.id);

      if (updateError) throw updateError;

      setCommunity((prev) => ({ ...prev, avatar_url: url }));
      toast.success("Foto de perfil da comunidade atualizada!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar foto.");
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleSelectCoverColor = async (newCoverColor: string) => {
    if (!community) return;
    const prevColor = community.cover_color;
    setCommunity((prev) => ({ ...prev, cover_color: newCoverColor }));

    try {
      const { error } = await supabase
        .from("communities")
        .update({ cover_color: newCoverColor })
        .eq("id", community.id);

      if (error) throw error;
      toast.success("Cor da capa atualizada!");
    } catch (err) {
      toast.error("Erro ao atualizar cor da capa.");
      setCommunity((prev) => ({ ...prev, cover_color: prevColor }));
    }
  };

  const fetchPosts = async () => {
    try {
      const { data: dbPosts, error } = await supabase
        .from("community_posts")
        .select(`
          *,
          author:profiles!community_posts_author_id_fkey(id, username, first_name, last_name, avatar_url),
          likes:community_post_likes(user_id),
          comments:comments!comments_community_post_id_fkey(id)
        `)
        .eq("community_id", community.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPosts((prevPosts) => {
        return (dbPosts || []).map((post: any) => {
          const existingPost = prevPosts.find((p) => p.id === post.id);
          return {
            ...post,
            author: post.author as unknown as Profile,
            likes: post.likes || [],
            likes_count: post.likes?.length || 0,
            comments_count: post.comments?.length || 0,
            comments: existingPost?.comments,
          };
        });
      });
    } catch (err: any) {
      console.error("Erro ao buscar posts:", err);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !community || !newPostContent.trim()) return;

    setIsPosting(true);
    try {
      const { error } = await supabase.from("community_posts").insert({
        community_id: community.id,
        author_id: user.id,
        content: newPostContent.trim(),
      });

      if (error) throw error;

      setNewPostContent("");
      toast.success("Publicado com sucesso!");
      await fetchPosts();
    } catch (err: any) {
      toast.error(`Erro ao publicar: ${err?.message || err}`);
    } finally {
      setIsPosting(false);
    }
  };

  const handleLikeToggle = async (post: Post) => {
    if (!user) {
      toast.error("Entre na comunidade para curtir!");
      return;
    }

    const hasLiked = post.likes.some((l) => l.user_id === user.id);

    try {
      if (hasLiked) {
        await supabase
          .from("community_post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("community_post_likes")
          .insert({
            post_id: post.id,
            user_id: user.id,
          });
      }
      await fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta publicação?")) return;

    try {
      const { error } = await supabase.from("community_posts").delete().eq("id", postId);
      if (error) throw error;

      toast.success("Publicação excluída!");
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      toast.error("Erro ao excluir publicação.");
    }
  };

  const handleJoinOrRequest = async () => {
    if (!user) {
      toast.error("Você precisa de login.");
      router.push(`/login?redirectTo=/comunidades/${slug}`);
      return;
    }

    try {
      const isPrivateComm = community.is_private;
      const statusToInsert = isPrivateComm ? "requested" : "joined";

      const { error } = await supabase.from("community_members").insert({
        community_id: community.id,
        user_id: user.id,
        role: "member",
        status: statusToInsert,
      });

      if (error) throw error;

      if (isPrivateComm) {
        toast.success("Solicitação de entrada enviada ao dono da comunidade!");
        setMemberStatus("requested");
      } else {
        toast.success(`Você entrou na comunidade ${community.name}!`);
        setIsMember(true);
        setMemberStatus("joined");
      }
    } catch (err) {
      toast.error("Erro ao processar solicitação.");
    }
  };

  const handleLeaveCommunity = async () => {
    if (!user || !community) return;

    if (community.creator_id === user.id) {
      toast.error("O criador não pode sair! Você pode excluí-la nas configurações.");
      return;
    }

    if (!confirm("Tem certeza que deseja sair desta comunidade?")) return;

    try {
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("community_id", community.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Você saiu da comunidade.");
      setIsMember(false);
      setMemberStatus(null);
      setCurrentUserMemberRole(null);
    } catch (err) {
      toast.error("Erro ao sair da comunidade.");
    }
  };

  const handleUpdateConfig = async () => {
    if (!community) return;

    const rulesList = editRules
      .split("\n")
      .map(r => r.trim())
      .filter(r => r.length > 0);

    setIsUpdatingConfig(true);
    try {
      const { error } = await supabase
        .from("communities")
        .update({ 
          description: editDescription.trim() || null,
          rules: rulesList,
          is_private: editIsPrivate
        })
        .eq("id", community.id);

      if (error) throw error;
      toast.success("Configurações atualizadas com sucesso!");
      setCommunity((prev) => ({
        ...prev,
        description: editDescription.trim() || null,
        rules: rulesList,
        is_private: editIsPrivate
      }));
      setActiveTab("discussion");
    } catch (err) {
      toast.error("Erro ao atualizar configurações.");
    } finally {
      setIsUpdatingConfig(false);
    }
  };

  const isOwner = user && community.creator_id === user.id;
  const isOwnerOrAdmin = isOwner || currentUserMemberRole === "owner" || currentUserMemberRole === "admin" || isSystemAdmin;
  const hasAccess = !community.is_private || isMember || isOwner || isSystemAdmin;

  const displayNameOf = (profile: Profile) => {
    if (!profile) return "Usuário";
    return profile.first_name || profile.username;
  };

  return (
    <div className="w-full min-h-screen bg-background">
      {/* CAPA DA COMUNIDADE */}
      <div className={`h-40 sm:h-52 w-full relative ${community.cover_color} flex items-end px-4 sm:px-6 relative border-b transition-colors duration-300`}>
        <div className="absolute top-4 left-4 z-10">
          <Button asChild size="sm" variant="secondary" className="rounded-full shadow-sm gap-1 bg-background/80 hover:bg-background text-foreground text-xs font-semibold backdrop-blur-sm">
            <Link href="/comunidades">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar
            </Link>
          </Button>
        </div>

        {isOwnerOrAdmin && (
          <div className="absolute top-4 right-4 z-10">
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="secondary" className="rounded-full shadow-sm gap-1.5 bg-background/80 hover:bg-background text-xs font-semibold backdrop-blur-sm">
                  <Palette className="h-3.5 w-3.5 text-primary" /> Cor da Capa
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-3">
                <p className="text-xs font-bold text-foreground mb-2">Selecione o tema da capa</p>
                <div className="grid grid-cols-4 gap-2">
                  {COVER_PALETTES.map((pal) => (
                    <button
                      key={pal.id}
                      onClick={() => handleSelectCoverColor(pal.cover)}
                      title={pal.name}
                      className={cn(
                        "h-8 w-full rounded-md border border-border/50 transition-all hover:scale-105",
                        pal.preview,
                        community.cover_color === pal.cover && "ring-2 ring-primary ring-offset-1"
                      )}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      <div className="max-w-[75rem] mx-auto px-4 sm:px-6 pb-20">
        {/* HEADER PERFIL */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-8 relative z-20">
          <div className="flex items-end gap-4">
            <div className="relative group">
              <Avatar className={`h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-lg ${community.avatar_color}`}>
                {community.avatar_url && <AvatarImage src={getMediaUrl(community.avatar_url)} alt={community.name} className="object-cover" />}
                <AvatarFallback className="text-3xl font-black">{community.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>

              {isOwnerOrAdmin && (
                <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity text-xs font-semibold">
                  {isUploadingAvatar ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5 mb-1" />}
                  <span>Alterar</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                </label>
              )}
            </div>

            <div className="mb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{community.name}</h1>
                {community.is_private ? (
                  <Badge variant="secondary" className="gap-1 text-xs"><Lock className="h-3 w-3" /> Privada</Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-xs"><Users className="h-3 w-3" /> Pública</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{members.length} membro{members.length !== 1 && "s"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isMember && memberStatus !== "requested" && (
              <Button onClick={handleJoinOrRequest} className="rounded-full shadow-sm font-semibold">
                <UserPlus className="h-4 w-4 mr-2" />
                {community.is_private ? "Solicitar Entrada" : "Participar"}
              </Button>
            )}

            {memberStatus === "requested" && (
              <Badge variant="secondary" className="px-4 py-2 text-xs font-medium">Solicitação Enviada</Badge>
            )}

            {isMember && !isOwner && (
              <Button variant="outline" onClick={handleLeaveCommunity} className="rounded-full text-xs">
                Sair da Comunidade
              </Button>
            )}
          </div>
        </div>

        {/* CONTEÚDO PRINCIPAL (TABS) */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 mb-6 gap-6">
            <TabsTrigger value="discussion" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-1 font-semibold text-sm">
              Discussão
            </TabsTrigger>
            <TabsTrigger value="members" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-1 font-semibold text-sm">
              Membros ({members.length})
            </TabsTrigger>
            <TabsTrigger value="rules" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-1 font-semibold text-sm">
              Regras
            </TabsTrigger>
            {isOwnerOrAdmin && (
              <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-1 font-semibold text-sm gap-1.5">
                <Settings className="h-3.5 w-3.5" /> Configurações
              </TabsTrigger>
            )}
          </TabsList>

          {/* TAB: DISCUSSÃO */}
          <TabsContent value="discussion" className="space-y-6">
            {!hasAccess ? (
              <Card className="py-12 text-center">
                <CardContent className="flex flex-col items-center gap-3">
                  <Lock className="h-10 w-10 text-muted-foreground opacity-40" />
                  <h3 className="font-bold text-lg">Comunidade Privada</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">Esta comunidade é privada. Solicite entrada para visualizar as discussões.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* CRIAR POST */}
                {isMember && (
                  <Card className="p-4 border border-border/60">
                    <form onSubmit={handleCreatePost} className="space-y-3">
                      <Textarea
                        placeholder="Escreva algo para a comunidade..."
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        className="resize-none border-none focus-visible:ring-0 p-0 text-sm min-h-[70px]"
                      />
                      <div className="flex justify-end pt-2 border-t border-border/40">
                        <Button size="sm" type="submit" disabled={isPosting || !newPostContent.trim()} className="rounded-full px-5">
                          {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                          Publicar
                        </Button>
                      </div>
                    </form>
                  </Card>
                )}

                {/* FEED DE POSTS */}
                <div className="space-y-4">
                  {posts.length === 0 ? (
                    <p className="text-center py-10 text-sm text-muted-foreground">Nenhuma publicação ainda. Seja o primeiro a publicar!</p>
                  ) : (
                    posts.map((post) => {
                      const hasLiked = user && post.likes.some((l) => l.user_id === user.id);
                      return (
                        <Card key={post.id} id={`post-${post.id}`} className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={post.author?.avatar_url || undefined} />
                                <AvatarFallback>{post.author?.username?.[0]?.toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-xs font-semibold">{displayNameOf(post.author)}</p>
                                <p className="text-[10px] text-muted-foreground">@{post.author?.username}</p>
                              </div>
                            </div>

                            {(user?.id === post.author_id || isOwnerOrAdmin) && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeletePost(post.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>

                          <div className="text-sm whitespace-pre-line leading-relaxed">
                            <CommentText text={post.content} />
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/40">
                            <button onClick={() => handleLikeToggle(post)} className={cn("flex items-center gap-1 hover:text-foreground transition-colors", hasLiked && "text-rose-500 font-semibold")}>
                              <Heart className={cn("h-4 w-4", hasLiked && "fill-rose-500 text-rose-500")} />
                              {post.likes_count}
                            </button>

                            <button onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)} className="flex items-center gap-1 hover:text-foreground transition-colors">
                              <MessageSquare className="h-4 w-4" />
                              {post.comments_count}
                            </button>
                          </div>

                          {activeCommentPostId === post.id && (
                            <div className="pt-3 border-t border-border/40">
                              <Comments contentId={post.id} contentType="community_post" authorId={post.author_id} />
                            </div>
                          )}
                        </Card>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* TAB: MEMBROS */}
          <TabsContent value="members" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {members.map((member) => (
                <Card key={member.user_id} className="p-3 flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                    <AvatarFallback>{member.profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{displayNameOf(member.profile)}</p>
                    <p className="text-xs text-muted-foreground truncate">@{member.profile?.username}</p>
                  </div>
                  {member.user_id === community.creator_id && (
                    <Badge variant="secondary" className="text-[10px]">Dono</Badge>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TAB: REGRAS */}
          <TabsContent value="rules">
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">Regras da Comunidade</h3>
              {community.rules && community.rules.length > 0 ? (
                <ol className="list-decimal list-inside space-y-2 text-sm leading-relaxed">
                  {community.rules.map((rule, idx) => (
                    <li key={idx} className="text-foreground/90">{rule}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">Esta comunidade ainda não possui regras específicas cadastradas.</p>
              )}
            </Card>
          </TabsContent>

          {/* TAB: CONFIGURAÇÕES */}
          {isOwnerOrAdmin && (
            <TabsContent value="settings" className="space-y-6">
              <Card className="p-6 space-y-4">
                <h3 className="font-bold text-lg">Editar Detalhes</h3>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Descrição</label>
                  <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className="text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Regras (uma por linha)</label>
                  <Textarea value={editRules} onChange={(e) => setEditRules(e.target.value)} rows={5} className="text-sm font-mono" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="text-sm font-semibold">Comunidade Privada</p>
                    <p className="text-xs text-muted-foreground">Exigir aprovação para novos membros</p>
                  </div>
                  <Switch checked={editIsPrivate} onCheckedChange={setEditIsPrivate} />
                </div>
                <Button onClick={handleUpdateConfig} disabled={isUpdatingConfig} className="mt-2">
                  {isUpdatingConfig && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Salvar Alterações
                </Button>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
