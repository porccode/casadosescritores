import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { CommunitiesClient } from "./CommunitiesClient";

export const metadata = {
  title: "Comunidades | Casa dos Escritores",
  description: "Crie ou participe de comunidades literárias para debater gêneros e compartilhar feedbacks.",
  alternates: {
    canonical: "https://casadosescritores.com.br/comunidades",
  },
  openGraph: {
    title: "Comunidades | Casa dos Escritores",
    description: "Crie ou participe de comunidades literárias para debater gêneros e compartilhar feedbacks.",
    url: "https://casadosescritores.com.br/comunidades",
    siteName: "Casa dos Escritores",
    locale: "pt_BR",
    type: "website",
  },
};

export default async function ComunidadesPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || null;

  // We use the new RPC to get aggregated community stats
  // We pass the userId so the RPC can determine the user's specific status ('joined', 'invited', etc.)
  const { data: communities, error } = await (supabase as any)
    .rpc("get_communities_with_stats", { p_user_id: userId });

  if (error) {
    console.error("Erro ao carregar comunidades (SSR):", error);
  }

  let isUserAdmin = false;
  let recommendedGenres: string[] = [];

  if (userId) {
    // Buscar em paralelo para otimização de TTFB
    const [profileRes, writtenSeriesRes, readingHistoryRes] = await Promise.all([
      supabase.from("profiles").select("is_admin").eq("id", userId).single(),
      supabase.from("series").select("genre").eq("author_id", userId),
      supabase.from("reading_history").select("series_id").eq("user_id", userId)
    ]);

    const profile = profileRes.data;
    if (profile?.is_admin) {
      isUserAdmin = true;
    }

    const writtenSeries = writtenSeriesRes.data;
    const readingHistory = readingHistoryRes.data;
    
    const historySeriesIds = readingHistory?.map((h: any) => h.series_id).filter(Boolean) || [];
    let readSeriesGenres: any[] = [];
    if (historySeriesIds.length > 0) {
      const { data: seriesData } = await supabase
        .from("series")
        .select("genre")
        .in("id", historySeriesIds);
      if (seriesData) {
        readSeriesGenres = seriesData;
      }
    }

    // Combine and unique the genres
    const allGenres = [
      ...(writtenSeries?.map((s: any) => s.genre) || []),
      ...(readSeriesGenres?.map((s: any) => s.genre) || [])
    ].filter(Boolean);

    recommendedGenres = Array.from(new Set(allGenres));
  }

  return (
    <CommunitiesClient 
      initialCommunities={communities || []} 
      recommendedGenres={recommendedGenres}
      isUserAdmin={isUserAdmin}
    />
  );
}
