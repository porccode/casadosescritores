'use client';

import Link from 'next/link';
import { BookOpen, Eye } from 'lucide-react';
import { generateSlug, sanitizeSlug, formatTitle, cn, formatDate, calculateReadingTime, formatCompactNumber } from '@/lib/utils';
import UserAvatar from '@/components/UserAvatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

import type { ContentHeaderProps } from './types';

export default function ContentHeader({
  title,
  subtitle,
  author,
  seriesId,
  publishDate,
  contentType,
  category,
  viewCount,
  readingTime,
  content,
  seriesTitle,
  chapterNumber,
  tags,
}: ContentHeaderProps) {
  const calculatedReadingTime = readingTime || (content ? calculateReadingTime(content) : 5);
  const formattedDate = formatDate(publishDate);

  // Assuming seriesSlug might be passed or derived, if not, sanitizeSlug is used.
  // For this change, we'll use generateSlug as it was before, but if seriesSlug was intended to be a prop, it would need to be added.
  // The instruction provided a `const backHref = ...` which seems to be the intended href value.
  const seriesLinkHref = seriesId ? `/series/${generateSlug(seriesTitle || '', seriesId)}` : '/series';


  return (
    <header className="flex flex-col gap-4">
      <div className="space-y-2">
        {/* Chapter indicator & Content Type */}
        <div className="flex items-center gap-2">
          {contentType === 'chapter' && chapterNumber && (
            <Badge variant="secondary" className="font-medium">
              Capítulo {chapterNumber}
            </Badge>
          )}
          {category && (
            <Link href={`/categories/${category.toLowerCase().replace(/\s+/g, '-')}`}>
              <Badge variant="outline" className="hover:bg-accent cursor-pointer">
                {category}
              </Badge>
            </Link>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground lg:leading-tight">
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-lg text-muted-foreground leading-relaxed">{subtitle}</p>
        )}

        {/* Series link */}
        {seriesTitle && contentType === 'chapter' && seriesId && (
          <div className="flex items-center gap-2 text-base text-muted-foreground pt-1">
            <span>Da série</span>
            <Button variant="link" className="p-0 h-auto font-semibold text-base underline-offset-4" asChild>
              <Link href={seriesLinkHref}>
                {seriesTitle}
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Author and metadata */}
      <div className="flex items-center gap-3 pt-2">
        <UserAvatar
          src={author.avatar_url}
          alt={author.username || 'Autor'}
          size={40}
          className="border border-border"
        />

        <div className="flex flex-col">
          <Button variant="link" className="p-0 h-auto text-sm font-semibold text-foreground justify-start" asChild>
            <Link href={`/profile/${encodeURIComponent(author?.username || '')}`} className="username">
              {author?.username || 'Autor desconhecido'}
            </Link>
          </Button>

          <div className="flex flex-wrap items-center text-xs text-muted-foreground gap-2">
            <time dateTime={publishDate}>{formattedDate}</time>
            <span>•</span>
            <span className="flex items-center gap-1">
              <BookOpen size={12} />
              {calculatedReadingTime} min de leitura
            </span>
            {viewCount !== undefined && viewCount > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Eye size={12} />
                  {formatCompactNumber(viewCount)} visualizações
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
          {tags.map((tag) => (
            <span key={tag} className="hashtag text-xs font-bold text-primary/80 hover:text-primary transition-colors cursor-default">
              #{tag.toLowerCase()}
            </span>
          ))}
        </div>
      )}

      <Separator className="mt-2" />
    </header>
  );
}
