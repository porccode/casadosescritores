'use client';

import Link from 'next/link';
import Image from 'next/image';
import { createSummary, generateSlug, sanitizeSlug, getMediaUrl } from "@/lib/utils";
import UserAvatar from '@/components/UserAvatar';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import type { RelatedContentProps, RelatedItem, ContentType } from './types';

export default function RelatedContent({ items = [], type = 'story' }: RelatedContentProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="my-12">
      <Separator className="mb-8" />
      <h2 className="text-xl font-semibold mb-6">
        {type === 'chapter'
          ? 'Mais capítulos desta série'
          : 'Mais histórias que você pode gostar'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.slice(0, 3).map((item) => (
          <RelatedItemCard key={item.id} item={item} type={type} />
        ))}
      </div>
    </section>
  );
}

interface RelatedItemCardProps {
  item: RelatedItem;
  type: ContentType;
}

function RelatedItemCard({ item, type }: RelatedItemCardProps) {
  let itemUrl = '#';

  if (type === 'chapter') {
    itemUrl = `/capitulo/${item.slug || generateSlug(item.title, item.id)}`;
  } else if (type === 'story') {
    itemUrl = `/capitulo/${item.slug || generateSlug(item.title, item.id)}`;
  } else if (type === 'announcement') {
    itemUrl = `/admin/announcements`; // Ou para a página de anúncio se houver
  }

  const summary = item.summary || createSummary(item.content || '', 100);

  return (
    <Card className="group overflow-hidden">
      {/* Cover image */}
      {item.cover_url && (
        <div className="w-full h-32 overflow-hidden relative">
          <OptimizedImage
            src={getMediaUrl(item.cover_url, 'covers')}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        {/* Chapter number */}
        {type === 'chapter' && item.chapter_number && (
          <Badge variant="secondary" className="text-xs">
            Capítulo {item.chapter_number}
          </Badge>
        )}

        {/* Title */}
        <Link href={itemUrl}>
          <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {item.title}
          </h3>
        </Link>

        {/* Summary */}
        {summary && (
          <p className="text-sm text-muted-foreground line-clamp-2">{summary}</p>
        )}

        {/* Author */}
        {item.profiles && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <UserAvatar
              src={item.profiles.avatar_url}
              alt={item.profiles.username || 'Autor'}
              size={24}
            />
            <span className="text-xs text-muted-foreground">
              {item.profiles.username || 'Autor desconhecido'}
            </span>
          </div>
        )}

        {/* Metadata */}
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          {item.created_at && (
            <span>
              {new Date(item.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
              })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
