"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, List, X, ChevronRight, Loader2 } from "lucide-react";
import { generateSlug } from "@/lib/utils";
import { createBrowserClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { ChapterNavigation } from "./types";

interface ReaderNavigationProps {
  prevChapter?: ChapterNavigation | null;
  nextChapter?: ChapterNavigation | null;
  seriesId?: string;
  seriesTitle?: string;
  currentChapterNumber?: number;
  chapterTitle?: string;
}

interface ChapterItem {
  id: string;
  title: string;
  chapter_number: number;
  slug?: string;
}

export default function ReaderNavigation({
  prevChapter,
  nextChapter,
  seriesId,
  seriesTitle,
  currentChapterNumber,
  chapterTitle
}: ReaderNavigationProps) {
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const supabase = createBrowserClient();

  const loadChapters = useCallback(async () => {
    if (!seriesId || chapters.length > 0) return;

    setLoading(true);
    const { data } = await supabase
      .from("chapters")
      .select("id, title, chapter_number, slug")
      .eq("series_id", seriesId)
      .order("chapter_number", { ascending: true });

    if (data) {
      setChapters(data);
    }
    setLoading(false);
  }, [seriesId, chapters.length, supabase]);

  useEffect(() => {
    if (open) {
      loadChapters();
    }
  }, [open, loadChapters]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === "ArrowLeft" && prevChapter) {
        window.location.href = `/capitulo/${prevChapter.slug || generateSlug(prevChapter.title, prevChapter.id)}`;
      } else if (e.key === "ArrowRight" && nextChapter) {
        window.location.href = `/capitulo/${nextChapter.slug || generateSlug(nextChapter.title, nextChapter.id)}`;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevChapter, nextChapter]);



  if (!seriesId) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t z-40">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        {/* Previous */}
        {prevChapter ? (
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href={`/capitulo/${prevChapter.slug || generateSlug(prevChapter.title, prevChapter.id)}`}>
              <ArrowLeft size={18} />
            </Link>
          </Button>
        ) : (
          <Button variant="ghost" size="icon" disabled className="shrink-0">
            <ArrowLeft size={18} />
          </Button>
        )}

        {/* Index */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <List size={16} />
              <span>Índice</span>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Índice</SheetTitle>
              <p className="text-sm text-muted-foreground">{seriesTitle}</p>
            </SheetHeader>
            <div className="mt-6 space-y-1 overflow-y-auto max-h-[70vh]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              ) : (
                chapters.map((chapter) => {
                  const isCurrent = chapter.chapter_number === currentChapterNumber;
                  return (
                    <Button
                      key={chapter.id}
                      variant={isCurrent ? "default" : "ghost"}
                      className="w-full justify-start"
                      asChild
                    >
                      {/* @ts-ignore - slug fetching logic upstream */}
                      <Link href={`/capitulo/${(chapter as any).slug || generateSlug(chapter.title, chapter.id)}`}>
                        <span className="w-8 text-center shrink-0">{chapter.chapter_number}</span>
                        <span className="truncate flex-1 text-left">{chapter.title}</span>
                        {isCurrent && <ChevronRight size={14} className="shrink-0" />}
                      </Link>
                    </Button>
                  );
                })
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Next */}
        {nextChapter ? (
          <Button size="icon" asChild className="shrink-0">
            <Link href={`/capitulo/${nextChapter.slug || generateSlug(nextChapter.title, nextChapter.id)}`}>
              <ArrowRight size={18} />
            </Link>
          </Button>
        ) : (
          <Button size="icon" disabled className="shrink-0">
            <ArrowRight size={18} />
          </Button>
        )}
      </div>
    </div>
  );
}
