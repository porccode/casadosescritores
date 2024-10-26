import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { toast } from "sonner";

export interface AdminCommunityPost {
  id: string;
  content: string;
  created_at: string;
  community_id: string;
  author_id: string;
  author: {
    id: string;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  community: {
    id: string;
    name: string;
    slug: string;
  } | null;
  likes_count: number;
  comments_count: number;
}

export interface CommunityOption {
  id: string;
  name: string;
  slug: string;
}

const ITEMS_PER_PAGE = 20;

export function useAdminCommunityPosts(
  page: number,
  search: string,
  communityId: string
) {
  const supabase = createBrowserClient();

  const [posts, setPosts] = useState<AdminCommunityPost[]>([]);
  const [communities, setCommunities] = useState<CommunityOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Busca lista de comunidades para o filtro
  useEffect(() => {
    async function fetchCommunities() {
      const { data } = await (supabase as any)
        .from("communities")
        .select("id, name, slug")
        .order("name", { ascending: true });
      if (data) setCommunities(data as unknown as CommunityOption[]);
    }
    fetchCommunities();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = (page - 1) * ITEMS_PER_PAGE;

      let query = (supabase as any)
        .from("community_posts")
        .select(
          `
          id, content, created_at, community_id, author_id,
          author:profiles!community_posts_author_id_fkey(id, username, first_name, last_name, avatar_url),
          community:communities!community_posts_community_id_fkey(id, name, slug),
          likes:community_post_likes(count),
          comments:comments!comments_community_post_id_fkey(count)
          `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (communityId && communityId !== "all") {
        query = query.eq("community_id", communityId);
      }

      if (search.trim()) {
        query = query.ilike("content", `%${search.trim()}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const mapped: AdminCommunityPost[] = (data || []).map((p: any) => ({
        id: p.id,
        content: p.content,
        created_at: p.created_at,
        community_id: p.community_id,
        author_id: p.author_id,
        author: p.author ?? null,
        community: p.community ?? null,
        likes_count: p.likes?.[0]?.count ?? 0,
        comments_count: p.comments?.[0]?.count ?? 0,
      }));

      setPosts(mapped);
      setTotalCount(count ?? 0);
    } catch (err) {
      console.error("Erro ao buscar posts da comunidade:", err);
      toast.error("Erro ao carregar posts.");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, communityId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = useCallback(
    async (postId: string) => {
      if (!confirm("Tem certeza que deseja excluir esta publicação?")) return false;
      try {
        const { error } = await (supabase as any)
          .from("community_posts")
          .delete()
          .eq("id", postId);
        if (error) throw error;
        toast.success("Publicação excluída.");
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        setTotalCount((prev) => Math.max(0, prev - 1));
        return true;
      } catch (err) {
        console.error("Erro ao excluir post:", err);
        toast.error("Erro ao excluir publicação.");
        return false;
      }
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleBulkDelete = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return false;
      if (
        !confirm(
          `Tem certeza que deseja excluir ${ids.length} publicação(ões)?`
        )
      )
        return false;
      try {
        const { error } = await (supabase as any)
          .from("community_posts")
          .delete()
          .in("id", ids);
        if (error) throw error;
        toast.success(`${ids.length} publicação(ões) excluída(s).`);
        setPosts((prev) => prev.filter((p) => !ids.includes(p.id)));
        setTotalCount((prev) => Math.max(0, prev - ids.length));
        return true;
      } catch (err) {
        console.error("Erro ao excluir posts em massa:", err);
        toast.error("Erro ao excluir publicações.");
        return false;
      }
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return {
    posts,
    communities,
    isLoading,
    totalCount,
    itemsPerPage: ITEMS_PER_PAGE,
    handleDelete,
    handleBulkDelete,
  };
}
