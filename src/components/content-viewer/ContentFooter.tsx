'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import UserAvatar from '@/components/UserAvatar';
import {
  Heart,
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Copy,
  Trash2,
  Check,
  Bookmark,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { showXPToast } from '@/lib/xp-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { ContentFooterProps } from './types';

export default function ContentFooter({
  id,
  author,
  contentType = 'story',
  likeCount = 0,
  isAuthor = false,
  isAdmin = false,
  onDelete,
  isDeleting = false,
  isBookmarked = false,
  onBookmark,
  error,
}: ContentFooterProps) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(likeCount);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasLiked = localStorage.getItem(`liked_${contentType}_${id}`);
      if (hasLiked) setLiked(true);
    }
  }, [id, contentType]);

  useEffect(() => {
    setLikes(likeCount);
  }, [likeCount]);

  const handleLike = async () => {
    if (isLiking) return;

    const newLikedState = !liked;
    const newLikeCount = newLikedState ? likes + 1 : Math.max(0, likes - 1);

    setLiked(newLikedState);
    setLikes(newLikeCount);
    setIsLiking(true);

    try {
      if (newLikedState) {
        localStorage.setItem(`liked_${contentType}_${id}`, 'true');
      } else {
        localStorage.removeItem(`liked_${contentType}_${id}`);
      }

      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          type: contentType,
          action: newLikedState ? 'like' : 'unlike',
        }),
      });

      if (!response.ok) throw new Error('Erro ao registrar like');

      const result = await response.json();

      if (result.xpAwarded) {
        const { XP_CONFIG } = await import("@/config/xp");
        showXPToast({
          amount: XP_CONFIG.POST_LIKE.xp,
          action: XP_CONFIG.POST_LIKE.action
        });
      }
    } catch (error) {
      console.error('Erro ao dar like:', error);
      setLiked(!newLikedState);
      setLikes(likes);
      if (!newLikedState) {
        localStorage.setItem(`liked_${contentType}_${id}`, 'true');
      } else {
        localStorage.removeItem(`liked_${contentType}_${id}`);
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handleBookmark = async () => {
    if (bookmarkLoading || !onBookmark) return;
    setBookmarkLoading(true);
    try {
      await onBookmark(!isBookmarked);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const shareOnTwitter = useCallback(() => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=Confira na Casa dos Escritores`,
      '_blank'
    );
  }, []);

  const shareOnFacebook = useCallback(() => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
      '_blank'
    );
  }, []);

  const shareOnLinkedin = useCallback(() => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
      '_blank'
    );
  }, []);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  }, []);

  return (
    <div className="my-8 space-y-6">
      {/* Comment Nudge / Gamification Prompt */}
      <div className="relative group overflow-hidden rounded-3xl p-6 bg-primary/[0.03] border border-primary/10 transition-all hover:bg-primary/[0.05]">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="h-16 w-16 text-primary rotate-12" />
          </div>
          <div className="relative flex flex-col md:flex-row items-center gap-6">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-primary/5">
                  <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 text-center md:text-left">
                  <h4 className="text-lg font-black tracking-tight text-foreground mb-1">Motivado a dizer algo?</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                      Comentar ajuda o autor a continuar e garante <span className="font-bold text-primary">XP de Leitor</span> para você subir no Hall da Fama.
                  </p>
              </div>
              <Button asChild variant="default" className="rounded-full px-8 font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                  <Link href="#comments">Comentar agora</Link>
              </Button>
          </div>
      </div>

      {/* Author card */}
      <Card>
        <CardContent className="p-4">
          <Link href={`/profile/${encodeURIComponent(author?.username || '')}`} className="flex items-center gap-4 group">
            <UserAvatar
              src={author.avatar_url}
              alt={author.username || 'Autor'}
              size={56}
            />
            <div>
              <p className="text-sm text-muted-foreground">Escrito por</p>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {author?.username || 'Autor desconhecido'}
              </h3>
              {author?.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {author.bio}
                </p>
              )}
            </div>
          </Link>
        </CardContent>
      </Card>

      {/* Actions bar */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-2">
          {/* Like */}
          <Button
            variant={liked ? "default" : "outline"}
            size="sm"
            onClick={handleLike}
            disabled={isLiking}
          >
            <Heart size={16} className={liked ? "fill-current" : ""} />
            <span className="ml-1">{likes}</span>
          </Button>

          {/* Bookmark */}
          {onBookmark && (
            <Button
              variant={isBookmarked ? "default" : "outline"}
              size="sm"
              onClick={handleBookmark}
              disabled={bookmarkLoading}
            >
              <Bookmark size={16} className={isBookmarked ? "fill-current" : ""} />
              <span className="ml-1 hidden sm:inline">
                {isBookmarked ? 'Salvo' : 'Salvar'}
              </span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Delete */}
          {(isAuthor || isAdmin) && onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
            >
              <Trash2 size={16} />
              <span className="ml-1 hidden sm:inline">
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </span>
            </Button>
          )}

          {/* Share */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Share2 size={16} />
                <span className="ml-1">Compartilhar</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={shareOnTwitter}>
                <Twitter size={14} className="mr-2" />
                Twitter
              </DropdownMenuItem>
              <DropdownMenuItem onClick={shareOnFacebook}>
                <Facebook size={14} className="mr-2" />
                Facebook
              </DropdownMenuItem>
              <DropdownMenuItem onClick={shareOnLinkedin}>
                <Linkedin size={14} className="mr-2" />
                LinkedIn
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyLink}>
                {copySuccess ? <Check size={14} className="mr-2 text-green-500" /> : <Copy size={14} className="mr-2" />}
                {copySuccess ? 'Copiado!' : 'Copiar link'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
