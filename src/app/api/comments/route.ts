// src/app/api/comments/route.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { validateAndSanitizeForm } from "@/lib/sanitize";
import { createNotification } from "@/services/notifications";
import { logAuditAction } from "@/services/audit";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";


export async function POST(request: NextRequest) {
    try {
        // Aplicar rate limiting
        const rateLimitResponse = await rateLimitMiddleware(request, 'comments');
        if (rateLimitResponse) {
            return rateLimitResponse;
        }

        // Aplicar proteção CSRF
        const { csrfProtection } = await import("@/lib/csrf-protection");
        const csrfResponse = await csrfProtection(request, 'post_comment');
        if (csrfResponse) {
            return csrfResponse;
        }

        // Obter dados da requisição (authorId ignorado - usamos sessão)
        const body = await request.json();
        const { text, storyId, seriesId, chapterId, announcementId, communityPostId, parentId, blockId, isInline } = body;

        // 1. Tentar obter o usuário da sessão
        const cookieStore = await cookies();

        const supabaseServer = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) => {
                                cookieStore.set(name, value, options);
                            });
                        } catch (error) {
                            // Ignorar erro de setAll
                        }
                    },
                },
            }
        );

        const { data: { user: sessionUser } } = await supabaseServer.auth.getUser();

        // ✅ SEGURANÇA: Exigir autenticação
        if (!sessionUser) {
            return NextResponse.json(
                { error: "Não autorizado - faça login para comentar" },
                { status: 401 }
            );
        }

        // ✅ SEGURANÇA: Usar ID da sessão, ignorar authorId do body
        const authorId = sessionUser.id;

        // 2. Criar cliente supabase admin
        const supabase = createAdminSupabaseClient();

        // 3. Validar e sanitizar dados
        const validation = validateAndSanitizeForm({ text }, {
            text: { type: 'comment' as const, required: true, minLength: 1, maxLength: 2000 }
        });

        if (!validation.isValid) {
            return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
        }

        const sanitizedText = validation.sanitizedData.text;

        // authorId já definido acima usando sessionUser.id

        if (!storyId && !seriesId && !chapterId && !announcementId && !communityPostId) {
            return NextResponse.json({ error: "É necessário especificar storyId, seriesId, chapterId, announcementId ou communityPostId" }, { status: 400 });
        }

        // 4. Verificar se o autor do comentário existe e buscar username
        const { data: userProfile, error: userError } = await supabase
            .from("profiles")
            .select("id, username")
            .eq("id", authorId)
            .single();

        let authorUsername = userProfile?.username || "Usuário";

        // Auto-healing de perfil (simplificado)
        if (userError || !userProfile) {
            return NextResponse.json(
                { error: "Perfil de usuário não encontrado. Tente fazer logout e login novamente." },
                { status: 403 }
            );
        }

        // 5. Verificar comentário pai (se for resposta)
        let parentCommentAuthorId = null;
        if (parentId) {
            const { data: parentComment } = await supabase
                .from("comments")
                .select("author_id")
                .eq("id", parentId)
                .single();
            if (parentComment) parentCommentAuthorId = parentComment.author_id;
        }

        // 6. Verificar conteúdo e obter autor do conteúdo original
        let contentAuthorId = null;
        let contentTitle = "";
        let finalContentType = "story";

        if (storyId) {
            const { data: story } = await supabase.from("stories").select("title, author_id").eq("id", storyId).single();
            if (story) {
                contentAuthorId = story.author_id;
                contentTitle = story.title;
                finalContentType = "story";
            }
        } else if (seriesId) {
            const { data: series } = await supabase.from("series").select("title, author_id, comments_enabled").eq("id", seriesId).single();
            if (series) {
                if (series.comments_enabled === false) {
                    return NextResponse.json({ error: "Os comentários foram desativados para esta obra." }, { status: 403 });
                }
                contentAuthorId = series.author_id;
                contentTitle = series.title;
                finalContentType = "series";
            }
        } else if (announcementId) {
            const { data: announcement } = await supabase.from("announcements").select("title, author_id").eq("id", announcementId).single();
            if (announcement) {
                contentAuthorId = announcement.author_id;
                contentTitle = announcement.title || "Anúncio";
                finalContentType = "announcement";
            }
        } else if (chapterId) {
            const { data: chapter } = await supabase.from("chapters").select("title, author_id, series_id").eq("id", chapterId).single();
            if (chapter) {
                contentAuthorId = chapter.author_id;
                contentTitle = chapter.title;
                finalContentType = "chapter";
                // ✅ Guardar series_id do capítulo para o XP entityId correto e buscar título da série
                if (chapter.series_id) {
                    (body as any)._resolvedSeriesId = chapter.series_id;
                    const { data: seriesData } = await supabase.from("series").select("title, comments_enabled").eq("id", chapter.series_id).single();
                    if (seriesData) {
                        if (seriesData.comments_enabled === false) {
                            return NextResponse.json({ error: "Os comentários foram desativados para esta obra." }, { status: 403 });
                        }
                        (body as any)._resolvedSeriesTitle = seriesData.title;
                    }
                }
            }
        } else if (communityPostId) {
            const { data: post } = await (supabase as any).from("community_posts").select("content, author_id, community_id").eq("id", communityPostId).single();
            if (post) {
                contentAuthorId = post.author_id;
                contentTitle = post.content ? (post.content.substring(0, 30) + "...") : "Publicação da Comunidade";
                finalContentType = "community_post";
                
                // Buscar o slug da comunidade
                if (post.community_id) {
                    const { data: comm } = await (supabase as any)
                        .from("communities")
                        .select("slug")
                        .eq("id", post.community_id)
                        .single();
                    if (comm) {
                        (body as any)._resolvedCommunitySlug = comm.slug;
                    }
                }
            }
        }

        // 7. Inserir comentário
        const commentToInsert: any = {
            text: sanitizedText,
            author_id: authorId,
            parent_id: parentId || null,
            block_id: blockId || null,
            is_inline: isInline || false,
        };

        if (storyId) commentToInsert.story_id = storyId;
        else if (seriesId) commentToInsert.series_id = seriesId;
        else if (chapterId) commentToInsert.chapter_id = chapterId;
        else if (announcementId) commentToInsert.announcement_id = announcementId;
        else if (communityPostId) commentToInsert.community_post_id = communityPostId;

        const { data: newComment, error: insertError } = await supabase
            .from("comments")
            .insert(commentToInsert)
            .select()
            .single();

        if (insertError) {
            console.error("Erro ao inserir comentário:", insertError);
            return NextResponse.json({ error: "Erro ao criar comentário" }, { status: 500 });
        }



        // Registro de Auditoria: Comentário Criado
        await logAuditAction({
            userId: authorId,
            action: 'comment.created',
            entityType: 'comment',
            entityId: newComment.id,
            metadata: {
                content_title: contentTitle,
                content_type: finalContentType,
                is_inline: isInline || false
            },
            request
        });

        // 8. Notificações
        try {
            const contentId = storyId || seriesId || chapterId || announcementId || communityPostId;
            const notificationData: any = {
                comment_text_preview: sanitizedText.substring(0, 50) + (sanitizedText.length > 50 ? "..." : ""),
                comment_id: newComment.id,
                is_inline: isInline || false,
            };

            if (storyId) { notificationData.story_id = storyId; notificationData.story_title = contentTitle; }
            else if (seriesId) { notificationData.series_id = seriesId; notificationData.series_title = contentTitle; }
            else if (chapterId) { 
                notificationData.chapter_id = chapterId; 
                notificationData.chapter_title = contentTitle; 
                if ((body as any)._resolvedSeriesId) {
                    notificationData.series_id = (body as any)._resolvedSeriesId;
                    notificationData.series_title = (body as any)._resolvedSeriesTitle || "";
                }
            }
            else if (announcementId) { notificationData.announcement_id = announcementId; notificationData.announcement_title = contentTitle; }
            else if (communityPostId) { 
                notificationData.community_post_id = communityPostId; 
                notificationData.community_post_title = contentTitle; 
                if ((body as any)._resolvedCommunitySlug) {
                    notificationData.community_slug = (body as any)._resolvedCommunitySlug;
                }
            }

            // Notificar autor do conteúdo
            if (contentAuthorId && contentAuthorId !== authorId) {
                const notifType = parentId ? "reply" : (finalContentType === 'series' ? 'series_comment' : (finalContentType === 'community_post' ? 'community_post_comment' : 'comment'));
                await createNotification({
                    target_user_id: contentAuthorId,
                    actor_id: authorId,
                    type: notifType as any,
                    related_id: contentId || "",
                    additional_data: notificationData
                });
            }

            // Se for um comentário inline/parágrafo em um capítulo de uma série, notificar as pessoas que seguem a série
            if (isInline && chapterId) {
                const targetSeriesId = seriesId || (body as any)._resolvedSeriesId;
                const targetSeriesTitle = (body as any)._resolvedSeriesTitle || contentTitle;

                if (targetSeriesId) {
                    // Buscar seguidores da série
                    const { data: seriesFollowers } = await supabase
                        .from('series_follows')
                        .select('user_id')
                        .eq('series_id', targetSeriesId);

                    if (seriesFollowers && seriesFollowers.length > 0) {
                        const followersToNotify = seriesFollowers
                            .map(f => f.user_id)
                            .filter(id => id !== authorId && id !== contentAuthorId && (!parentCommentAuthorId || id !== parentCommentAuthorId));

                        // Enviar notificações em lote
                        const followerNotifications = followersToNotify.map(followerId => ({
                            target_user_id: followerId,
                            actor_id: authorId,
                            type: 'series_comment',
                            is_read: false,
                            related_id: newComment.id,
                            additional_data: {
                                ...notificationData,
                                series_id: targetSeriesId,
                                series_title: targetSeriesTitle,
                                username: authorUsername
                            }
                        }));

                        if (followerNotifications.length > 0) {
                            await supabase.from('notifications').insert(followerNotifications);
                        }
                    }
                }
            }

            // Notificar autor do comentário pai
            if (parentId && parentCommentAuthorId && parentCommentAuthorId !== authorId && parentCommentAuthorId !== contentAuthorId) {
                await createNotification({
                    target_user_id: parentCommentAuthorId,
                    actor_id: authorId,
                    type: "reply",
                    related_id: parentId,
                    additional_data: notificationData
                });
            }

            // Notificar usuários mencionados via @username
            const mentionRegex = /@([a-zA-Z0-9_]+)/g;
            const mentionedUsernames = new Set<string>();
            let mentionMatch: RegExpExecArray | null;
            while ((mentionMatch = mentionRegex.exec(sanitizedText)) !== null) {
                mentionedUsernames.add(mentionMatch[1].toLowerCase());
            }

            if (mentionedUsernames.size > 0) {
                // Fetch mentioned users by username (batch)
                const { data: mentionedProfiles } = await supabase
                    .from("profiles")
                    .select("id, username")
                    .in("username", Array.from(mentionedUsernames));

                if (mentionedProfiles) {
                    // Track already-notified IDs to avoid duplicates
                    const alreadyNotified = new Set<string>([
                        authorId,
                        ...(contentAuthorId ? [contentAuthorId] : []),
                        ...(parentCommentAuthorId ? [parentCommentAuthorId] : []),
                    ]);

                    const mentionNotifications = mentionedProfiles
                        .filter(profile => !alreadyNotified.has(profile.id))
                        .map(profile => ({
                            target_user_id: profile.id,
                            actor_id: authorId,
                            type: 'mention',
                            is_read: false,
                            related_id: contentId || newComment.id,
                            additional_data: {
                                ...notificationData,
                                username: authorUsername,
                            }
                        }));

                    if (mentionNotifications.length > 0) {
                        await supabase.from('notifications').insert(mentionNotifications);
                    }
                }
            }

        } catch (notifErr) {
            console.warn("Erro ao processar notificações (não crítico):", notifErr);
        }

        return NextResponse.json({
            message: "Comentário adicionado com sucesso",
            comment: newComment
        }, { status: 201 });

    } catch (error: any) {
        console.error("Erro interno no servidor de comentários:", error);
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
}
