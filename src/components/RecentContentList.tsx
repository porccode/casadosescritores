"use client";

import React, { useMemo } from "react";
import { generateSlug } from "@/lib/utils";
import { Book } from "lucide-react";
import ContentListItem from "./ContentListItem";
import { Card, CardContent } from "@/components/ui/card";
import { RecentContentItem } from "@/types/home";
import { useAgeVerification } from "@/hooks/useAgeVerification";

interface RecentContentListProps {
  contentList: RecentContentItem[];
  /** Limite de exibição — padrão 40 */
  limit?: number;
}

export default function RecentContentList({
  contentList,
  limit = 40,
}: RecentContentListProps): React.ReactElement {
  const { isMinor } = useAgeVerification();

  const items = useMemo(() => {
    const raw = (contentList || []).slice(0, limit);
    if (!isMinor) return raw;
    return raw.filter((item) => !(item as any).is_explicit);
  }, [contentList, limit, isMinor]);

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 md:p-8 text-center">
          <Book size={32} className="mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm font-medium text-foreground mb-1">Nenhuma publicação recente.</p>
          <p className="text-xs text-muted-foreground">As novidades aparecerão aqui.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="divide-y divide-border">
      {items.map((content, index) => {
        const isAnnouncement = content.series_title === "Comunicados Oficiais" && content.author_is_admin;
        return (
          <ContentListItem
            key={`recent-${content.type}-${content.id}-${index}`}
            index={index}
            title={content.title}
            href={isAnnouncement
              ? `/anuncios/${content.slug || generateSlug(content.title, content.id)}`
              : `/capitulo/${content.slug || generateSlug(content.title, content.id)}`
            }
            seriesTitle={content.series_title}
            chapterNumber={content.chapter_number}
            authorUsername={content.author_username}
            date={new Date(content.created_at)}
            isAnnouncement={isAnnouncement}
            coverUrl={content.cover_url}
            genre={content.genre}
            isPinned={content.is_pinned}
            linkUrl={content.type === "announcement" ? content.slug : null}
            commentCount={content.comment_count}
            listType="recent"
            isExplicit={(content as any).is_explicit}
          />
        );
      })}
    </div>
  );
}
