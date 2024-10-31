"use client";

import React, { useState, useEffect, useActionState } from "react";
import UserAvatar from "@/components/UserAvatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createPostAction } from "@/app/actions/posts";

interface PostComposerProps {
  userId: string;
  userAvatar?: string | null;
  username: string;
  onPostCreated?: (post: any) => void;
}

const MAX_CHARS = 240;

export default function PostComposer({
  userId,
  userAvatar,
  username,
  onPostCreated,
}: PostComposerProps) {
  const [content, setContent] = useState("");

  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = charsLeft < 0;

  // React 19 useActionState para submissão e controle de estado
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const text = formData.get("content") as string;
      if (!text || !text.trim()) {
        return { success: false, error: "O post não pode estar vazio." };
      }
      if (text.length > MAX_CHARS) {
        return { success: false, error: "O post ultrapassou o limite de caracteres." };
      }

      try {
        const result = await createPostAction(text);
        return result;
      } catch (err: any) {
        console.error("Erro ao criar post via Action:", err);
        return { success: false, error: "Erro ao publicar. Tente novamente." };
      }
    },
    null
  );

  useEffect(() => {
    if (state?.success && state.post) {
      setContent("");
      onPostCreated?.(state.post);

      if (state.xpBlocked) {
        import("@/lib/toast").then(({ toast }) => {
          toast.error("Você está postando muito rápido! O ganho de XP para posts está pausado por 1 hora.");
        });
      } else {
        Promise.all([
          import("@/lib/xp-toast"),
          import("@/config/xp")
        ]).then(([{ showXPToast }, { XP_CONFIG }]) => {
          showXPToast({
            amount: XP_CONFIG.POST_PUBLISH.xp,
            action: XP_CONFIG.POST_PUBLISH.action
          });
        });
      }
    }
  }, [state, onPostCreated]);

  return (
    <Card className="shadow-none rounded-xl border-border">
      <CardContent className="p-4">
        <form action={formAction}>
          <div className="flex gap-3">
            {/* Avatar */}
            <div className="shrink-0">
              <UserAvatar src={userAvatar} alt={username} size={40} />
            </div>

            {/* Textarea */}
            <div className="flex-1 space-y-3">
              <Textarea
                name="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="O que está acontecendo?"
                className="min-h-[80px] resize-none"
                rows={3}
              />

              {/* Footer */}
              <div className="flex items-center justify-between">
                {/* Contador de caracteres */}
                <span
                  className={`text-xs ${isOverLimit
                    ? "text-destructive"
                    : charsLeft <= 50
                      ? "text-yellow-500"
                      : "text-muted-foreground"
                    }`}
                >
                  {charsLeft}
                </span>

                {/* Botão de publicar */}
                <Button
                  type="submit"
                  disabled={!content.trim() || isOverLimit || isPending}
                  size="sm"
                >
                  {isPending ? "Publicando..." : "Publicar"}
                </Button>
              </div>

              {state?.error && (
                <p className="text-destructive text-sm">{state.error}</p>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
