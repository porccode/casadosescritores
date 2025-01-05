// src/app/search/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";
import SearchResults from "@/components/SearchResults";
import { escapeHtml } from "@/lib/sanitize";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/Section";
import Pagination from "@/components/Pagination";

export const metadata: Metadata = {
  title: "Resultados de pesquisa",
  description: "Pesquise séries e escritores em nossa plataforma",
};

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    genre?: string;
    status?: string;
    order?: string
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q || "";

  if (!query.trim()) {
    return notFound();
  }

  const genre = resolvedSearchParams.genre || null;
  const status = resolvedSearchParams.status || null;
  const order = resolvedSearchParams.order || "relevance";

  const supabase = await createServerSupabaseClient();

  // Initial fetch for SSR
  const { data } = await (supabase.rpc as any)("search_content", {
    search_query: query,
    content_type: "all",
    p_limit: 20,
    p_offset: 0,
    p_genre: genre,
    p_is_completed: status === "completed" ? true : status === "ongoing" ? false : null,
    p_order_by: order
  });

  // Query matching communities
  let communityResults: any[] = [];
  if (query) {
    const { data: comms } = await supabase
      .from("communities" as any)
      .select("*")
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(10);
    
    if (comms) {
      communityResults = comms.map((c: any) => ({
        ...c,
        type: "community",
        title: c.name
      }));
    }
  }

  return (
    <Section container size="lg" className="min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <Button
          asChild
          variant="secondary"
          size="icon"
          className="rounded-full shrink-0"
        >
          <Link href="/" aria-label="Voltar para o início">
            <ArrowLeft className="h-5 w-5 hover:-translate-x-1 transition-transform" />
          </Link>
        </Button>
        <div>
          <h1 className="h1">
            Resultados para &quot;{escapeHtml(query)}&quot;
          </h1>
          <p className="text-lead mt-2">
            Explore séries, perfis e capítulos que combinam com sua busca.
          </p>
        </div>
      </div>

      {/* Resultados com Filtros e Infinite Scroll */}
      <SearchResults
        initialData={{ ...data, communities: communityResults }}
        query={query}
        initialFilters={{ genre, status, order }}
      />

      {/* Voltar */}
      <div className="flex justify-center mt-12 pb-12">
        <Button
          asChild
          variant="ghost"
          className="text-muted-foreground text-sm"
        >
          <Link href="/">
            Voltar para o início
          </Link>
        </Button>
      </div>
    </Section>
  );
}
