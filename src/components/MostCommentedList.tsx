"use client";

import React, { useMemo } from "react";
import { generateSlug } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import ContentListItem from "./ContentListItem";
import { Card, CardContent } from "@/components/ui/card";
import { MostCommentedItem } from "@/types/home";
import { useAgeVerification } from "@/hooks/useAgeVerification";

interface MostCommentedListProps {
  contentList: MostCommentedItem[];
  /** Limite de exibição — padrão 40 */
  limit?: number;
}

export default function MostCommentedList({
  contentList,
  limit = 40,
}: MostCommentedListProps): React.ReactElement {
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
          <MessageSquare size={32} className="mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm font-medium text-foreground mb-1">Nenhuma publicação comentada.</p>
          <p className="text-xs text-muted-foreground">Seja o primeiro a comentar!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="divide-y divide-border">
      {items.map((content, index) => (
        <ContentListItem
          key={`commented-${content.type}-${content.id}`}
          index={index}
          title={content.title}
          href={`/capitulo/${content.slug || generateSlug(content.title, content.id)}`}
          seriesTitle={content.series_title}
          chapterNumber={content.chapter_number}
          authorUsername={content.author_username}
          commentCount={content.comment_count}
          date={new Date(content.created_at)}
          coverUrl={content.cover_url}
          genre={content.genre}
          listType="commented"
          isExplicit={(content as any).is_explicit}
        />
      ))}
    </div>
  );
}
