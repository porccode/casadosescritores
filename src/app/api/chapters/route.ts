// src/app/api/chapters/route.ts
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { validateAndSanitizeForm } from "@/lib/sanitize";
import { logAuditAction } from "@/services/audit";
import { isGibberish } from "@/lib/quality-check";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { sanitizeSlug } from "@/lib/utils";


export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        const seriesId = url.searchParams.get("seriesId");

        const supabase = createAdminSupabaseClient();

        if (id) {
            // Buscar capítulo específico
            const { data: chapter, error } = await supabase
                .from("chapters")
                .select("*")
                .eq("id", id)
                .single();

            if (error) {
                return NextResponse.json({ error: "Capítulo não encontrado" }, { status: 404 });
            }

            // Validar se o capítulo está agendado e quem está acessando
            const now = new Date();
            const publishedAt = chapter.published_at ? new Date(chapter.published_at) : null;

            if (publishedAt && publishedAt > now) {
                const supabaseAuth = await createServerSupabaseClient();
                const { data: { user } } = await supabaseAuth.auth.getUser();

                let isAllowed = false;
                if (user) {
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("is_admin")
                        .eq("id", user.id)
                        .single();
                    isAllowed = user.id === chapter.author_id || profile?.is_admin === true;
                }

                if (!isAllowed) {
                    return NextResponse.json({
                        error: "Capítulo agendado",
                        is_scheduled: true,
                        published_at: chapter.published_at
                    }, { status: 403 });
                }
            }

            return NextResponse.json(
                { chapter },
                {
                    headers: {
                        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
                    }
                }
            );
        } else if (seriesId) {
            // Listar capítulos de uma série
            const { data: chapters, error } = await supabase
                .from("chapters")
                .select("id, title, chapter_number, created_at, updated_at, view_count, published_at, author_id, series:series_id(is_archived)")
                .eq("series_id", seriesId)
                .order("chapter_number", { ascending: true });

            if (error) {
                return NextResponse.json({ error: "Erro ao buscar capítulos" }, { status: 500 });
            }

            // Identificar se o usuário é o autor ou admin para pular filtros
            const supabaseAuth = await createServerSupabaseClient();
            const { data: { user } } = await supabaseAuth.auth.getUser();

            let isAdmin = false;
            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("is_admin")
                    .eq("id", user.id)
                    .single();
                isAdmin = profile?.is_admin === true;
            }

            const now = new Date();
            const processedChapters = (chapters as any[]).map(ch => {
                const publishedAt = ch.published_at ? new Date(ch.published_at) : null;
                const isArchived = ch.series?.is_archived === true;
                const isFuture = (publishedAt && publishedAt > now) || isArchived;
                const isAuthor = user?.id === ch.author_id;

                if (isFuture && !isAuthor && !isAdmin) {
                    return {
                        id: ch.id,
                        chapter_number: ch.chapter_number,
                        title: `Capítulo ${ch.chapter_number}`, // Máscara do título
                        published_at: isArchived ? null : ch.published_at, // Ocultar data se arquivado
                        created_at: ch.created_at,
                        updated_at: ch.created_at, // Resetar para evitar mostrar edição
                        is_scheduled: !isArchived,
                        is_archived: isArchived
                    };
                }
                return {
                    ...ch,
                    series: undefined // Limpar objeto aninhado do retorno
                };
            });

            return NextResponse.json(
                { chapters: processedChapters },
                {
                    headers: {
                        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
                    }
                }
            );
        }

        return NextResponse.json({ error: "ID ou SeriesID necessário" }, { status: 400 });
    } catch (error) {
        console.error("Erro na API de capítulos:", error);
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // ✅ SEGURANÇA: Rate limiting
        const rateLimitResponse = await rateLimitMiddleware(request, 'chapters');
        if (rateLimitResponse) return rateLimitResponse;

        // ✅ SEGURANÇA: Validar sessão do usuário
        const supabaseAuth = await createServerSupabaseClient();
        const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: "Não autorizado - faça login para criar um capítulo" },
                { status: 401 }
            );
        }

        const body = await request.json();

        // ✅ SEGURANÇA: Validar e sanitizar
        const validation = validateAndSanitizeForm(body, {
            title: { type: 'text', required: true, minLength: 1, maxLength: 200 },
            content: { type: 'html', required: true }, // HTML permitido para capítulos
            author_note: { type: 'text', required: false, maxLength: 2000 }
        });

        if (!validation.isValid) {
            return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
        }

        const { title, content: rawContent, author_note } = validation.sanitizedData;

        // ✅ SEGURANÇA: Validar qualidade do título (Anti-Gibberish)
        const titleCheck = isGibberish(title);
        if (titleCheck.isGibberish) {
            return NextResponse.json({ error: `O título parece não ter sentido: ${titleCheck.reason}` }, { status: 400 });
        }
        const content = typeof rawContent === 'object' ? JSON.stringify(rawContent) : rawContent;
        const { chapter_number, series_id, published_at } = body;

        if (!title || !content || !series_id) {
            return NextResponse.json(
                { error: "Campos obrigatórios ausentes (título, conteúdo, série)" },
                { status: 400 }
            );
        }

        const supabase = createAdminSupabaseClient();

        // ✅ SEGURANÇA: Verificar se o usuário é dono da série
        const { data: series, error: seriesError } = await supabase
            .from("series")
            .select("author_id, slug, is_first_book")
            .eq("id", series_id)
            .single();

        if (seriesError || !series) {
            return NextResponse.json(
                { error: "Série não encontrada" },
                { status: 404 }
            );
        }

        // ✅ SEGURANÇA: Verificar se o usuário é dono da série OU administrador
        const { data: profile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single();

        const isAdmin = profile?.is_admin === true;

        if (series.author_id !== user.id && !isAdmin) {
            console.error(`[SECURITY] Tentativa de criar capítulo não autorizada: user=${user.id}, series_author=${series.author_id}`);
            return NextResponse.json(
                { error: "Você não tem permissão para adicionar capítulos a esta série" },
                { status: 403 }
            );
        }

        // ✅ SEGURANÇA: Usar user.id da sessão
        const authorId = user.id;

        // VERIFICAÇÃO PARA O MODAL: É O PRIMEIRO CAPÍTULO?
        const { count } = await supabase
            .from("chapters")
            .select('*', { count: 'exact', head: true })
            .eq("series_id", series_id);
        
        const isFirstChapter = count === 0;

        const isDraft = body.is_draft === true;

        if (!isDraft) {
            const isFirstBook = (series as any).is_first_book === true;

            if (isFirstBook) {
                // Capítulos do primeiro livro são GRATUITOS e rendem XP ao autor
                const { grantXP } = await import("@/services/xp");
                await grantXP(authorId, "FIRST_BOOK_CHAPTER", series_id, true);
            } else {
                // --- SISTEMA DE XP: Economia da Inspiração (2º livro em diante) ---
                // 1. Verificar se possui 50 XP
                const { data: profile, error: profileErr } = await supabase
                    .from("profiles")
                    .select("xp")
                    .eq("id", authorId)
                    .single();

                if (profileErr || !profile) {
                    return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
                }

                const userXP = (profile as any).xp || 0;

                if (userXP < 50) {
                    return NextResponse.json(
                        {
                            error: "Você não possui Inspiração (XP) suficiente para publicar este capítulo. Custo: 50 XP. Leia obras, deixe comentários ou interaja com a comunidade para ganhar XP!",
                            xpRequired: 50,
                            currentXp: userXP,
                            isXpError: true
                        },
                        { status: 403 }
                    );
                }

                // 2. Debitar 50 XP
                const { spendXP } = await import("@/services/xp");
                const spendResult = await spendXP(authorId, "CHAPTER_PUBLISH");

                if (!spendResult.success) {
                    return NextResponse.json(
                        { error: `Falha ao debitar XP: ${spendResult.error || "Saldo insuficiente"}` },
                        { status: 403 }
                    );
                }
            }
        }

        // Generate a clean and SEO-friendly slug
        const seriesSlug = series.slug || sanitizeSlug(series_id);
        const baseChapterSlug = sanitizeSlug(`${seriesSlug}-${title}`);
        
        let finalSlug = baseChapterSlug.slice(0, 100);
        
        // Ensure uniqueness
        const { data: slugExists } = await supabase
            .from("chapters")
            .select("id")
            .eq("slug", finalSlug)
            .maybeSingle();
            
        if (slugExists) {
            finalSlug = sanitizeSlug(`${seriesSlug}-${chapter_number}-${title}`).slice(0, 100);
            
            const { data: slugExistsAgain } = await supabase
                .from("chapters")
                .select("id")
                .eq("slug", finalSlug)
                .maybeSingle();
                
            if (slugExistsAgain) {
                let counter = 1;
                let collision = true;
                while (collision) {
                    const candidateSlug = sanitizeSlug(`${seriesSlug}-${chapter_number}-${title}-${counter}`).slice(0, 100);
                    const { data: checkCol } = await supabase
                        .from("chapters")
                        .select("id")
                        .eq("slug", candidateSlug)
                        .maybeSingle();
                    if (!checkCol) {
                        finalSlug = candidateSlug;
                        collision = false;
                    } else {
                        counter++;
                    }
                }
            }
        }

        const { data, error } = await supabase
            .from("chapters")
            .insert({
                title,
                content,
                chapter_number,
                series_id,
                author_id: authorId, // ✅ SEGURO: ID da sessão
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                published_at: published_at || new Date().toISOString(),
                is_draft: body.is_draft === true,
                author_note,
                slug: finalSlug
            })
            .select();

        if (error) {
            console.error("Erro ao criar capítulo:", error);
            return NextResponse.json({ error: `Falha ao criar capítulo: ${error.message}` }, { status: 500 });
        }

        // Registro de Auditoria: Capítulo Criado
        await logAuditAction({
            userId: authorId,
            action: 'chapter.created',
            entityType: 'chapter',
            entityId: data[0].id,
            metadata: { title: data[0].title, series_id },
            request
        });

        // Atualizar timestamp da série
        await supabase
            .from("series")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", series_id);



        return NextResponse.json({ success: true, chapter: data[0], isFirstChapter, isFirstBook: (series as any).is_first_book === true });
    } catch (error: any) {
        console.error("Erro no servidor (POST chapter):", error);
        return NextResponse.json({ error: `Erro interno do servidor: ${error.message}` }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        // ✅ SEGURANÇA: Rate limiting
        const rateLimitResponse = await rateLimitMiddleware(request, 'chapters');
        if (rateLimitResponse) return rateLimitResponse;

        // ✅ SEGURANÇA: Validar sessão do usuário
        const supabaseAuth = await createServerSupabaseClient();
        const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: "Não autorizado - faça login para editar" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { id, chapter_number, published_at } = body;

        if (!id) {
            return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
        }

        // ✅ SEGURANÇA: Validar UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            return NextResponse.json({ error: "Formato de ID inválido" }, { status: 400 });
        }

        // ✅ SEGURANÇA: Validar e sanitizar
        const validation = validateAndSanitizeForm(body, {
            title: { type: 'text', required: true, minLength: 1, maxLength: 200 },
            content: { type: 'html', required: false },
            author_note: { type: 'text', required: false, maxLength: 2000 }
        });

        if (!validation.isValid) {
            return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
        }

        const sanitizedTitle = validation.sanitizedData.title;

        // ✅ SEGURANÇA: Validar qualidade do título na edição (Anti-Gibberish)
        const titleCheck = isGibberish(sanitizedTitle);
        if (titleCheck.isGibberish) {
            return NextResponse.json({ error: `O título parece não ter sentido: ${titleCheck.reason}` }, { status: 400 });
        }

        const rawContent = validation.sanitizedData.content;
        const author_note = validation.sanitizedData.author_note;
        const sanitizedContent = typeof rawContent === 'object' ? JSON.stringify(rawContent) : rawContent;

        const supabase = createAdminSupabaseClient();

        // ✅ SEGURANÇA: Verificar se o usuário é dono do capítulo
        const { data: existingChapter, error: fetchError } = await supabase
            .from("chapters")
            .select("author_id, content, is_draft, series_id, title, slug, chapter_number, series:series_id(slug)")
            .eq("id", id)
            .single();

        if (fetchError || !existingChapter) {
            return NextResponse.json(
                { error: "Capítulo não encontrado" },
                { status: 404 }
            );
        }

        // ✅ SEGURANÇA: Verificar se o usuário é dono do capítulo OU administrador
        const { data: profile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single();

        const isAdmin = profile?.is_admin === true;

        if (existingChapter.author_id !== user.id && !isAdmin) {
            console.error(`[SECURITY] Tentativa de edição não autorizada: user=${user.id}, chapter_author=${existingChapter.author_id}`);
            return NextResponse.json(
                { error: "Você não tem permissão para editar este capítulo" },
                { status: 403 }
            );
        }

        const isPublishingTransition = existingChapter.is_draft === true && body.is_draft === false;

        if (isPublishingTransition) {
            // Verificar se pertence ao primeiro livro do autor
            const { data: seriesData } = await supabase
                .from("series")
                .select("is_first_book")
                .eq("id", existingChapter.series_id)
                .single();

            const isFirstBook = (seriesData as any)?.is_first_book === true;

            if (isFirstBook) {
                // Capítulos do primeiro livro são GRATUITOS e rendem XP ao autor
                const { grantXP } = await import("@/services/xp");
                await grantXP(user.id, "FIRST_BOOK_CHAPTER", existingChapter.series_id, true);
            } else {
                // --- SISTEMA DE XP: Economia da Inspiração (2º livro em diante) ---
                // 1. Verificar se possui 50 XP
                const { data: authorProfile, error: profileErr } = await supabase
                    .from("profiles")
                    .select("xp")
                    .eq("id", user.id)
                    .single();

                if (profileErr || !authorProfile) {
                    return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
                }

                const userXP = (authorProfile as any).xp || 0;

                if (userXP < 50) {
                    return NextResponse.json(
                        {
                            error: "Você não possui Inspiração (XP) suficiente para publicar este capítulo. Custo: 50 XP. Leia obras, deixe comentários ou interaja com a comunidade para ganhar XP!",
                            xpRequired: 50,
                            currentXp: userXP,
                            isXpError: true
                        },
                        { status: 403 }
                    );
                }

                // 2. Debitar 50 XP
                const { spendXP } = await import("@/services/xp");
                const spendResult = await spendXP(user.id, "CHAPTER_PUBLISH");

                if (!spendResult.success) {
                    return NextResponse.json(
                        { error: `Falha ao debitar XP: ${spendResult.error || "Saldo insuficiente"}` },
                        { status: 403 }
                    );
                }
            }
        }

        // ✅ PROTEÇÃO: Não sobrescrever conteúdo existente com conteúdo vazio
        // Isso evita perda de dados quando o editor não consegue carregar o formato antigo
        const isContentEmpty = !sanitizedContent || sanitizedContent.trim() === '' || sanitizedContent === '""' || sanitizedContent === 'null';
        const existingHasContent = existingChapter.content && existingChapter.content.trim() !== '';

        let finalContent = sanitizedContent;
        if (isContentEmpty && existingHasContent) {
            console.warn(`[PROTECTION] Prevented overwriting non-empty content with empty content for chapter ${id}`);
            finalContent = existingChapter.content;
        }

        let finalSlug = existingChapter.slug;
        const seriesData = existingChapter.series as any;
        const seriesSlug = seriesData?.slug || sanitizeSlug(existingChapter.series_id);

        if (!existingChapter.slug || sanitizedTitle !== existingChapter.title) {
            const baseChapterSlug = sanitizeSlug(`${seriesSlug}-${sanitizedTitle}`);
            finalSlug = baseChapterSlug.slice(0, 100);
            
            // Ensure uniqueness
            const { data: slugExists } = await supabase
                .from("chapters")
                .select("id")
                .neq("id", id)
                .eq("slug", finalSlug)
                .maybeSingle();
                
            if (slugExists) {
                const targetNum = chapter_number || existingChapter.chapter_number;
                finalSlug = sanitizeSlug(`${seriesSlug}-${targetNum}-${sanitizedTitle}`).slice(0, 100);
                
                const { data: slugExistsAgain } = await supabase
                    .from("chapters")
                    .select("id")
                    .neq("id", id)
                    .eq("slug", finalSlug)
                    .maybeSingle();
                    
                if (slugExistsAgain) {
                    let counter = 1;
                    let collision = true;
                    while (collision) {
                        const candidateSlug = sanitizeSlug(`${seriesSlug}-${targetNum}-${sanitizedTitle}-${counter}`).slice(0, 100);
                        const { data: checkCol } = await supabase
                            .from("chapters")
                            .select("id")
                            .neq("id", id)
                            .eq("slug", candidateSlug)
                            .maybeSingle();
                        if (!checkCol) {
                            finalSlug = candidateSlug;
                            collision = false;
                        } else {
                            counter++;
                        }
                    }
                }
            }
        }

        const updateData: any = {
            title: sanitizedTitle,
            content: finalContent,
            updated_at: new Date().toISOString(),
            author_note,
            slug: finalSlug
        };

        if (published_at) {
            updateData.published_at = published_at;
        }

        if (chapter_number) {
            updateData.chapter_number = chapter_number;
        }

        if (body.is_draft !== undefined) {
            updateData.is_draft = body.is_draft === true;
        }

        const { data, error } = await supabase
            .from("chapters")
            .update(updateData)
            .eq("id", id)
            .select();

        if (error) {
            console.error("Erro ao atualizar capítulo:", error);
            return NextResponse.json({ error: "Falha ao atualizar capítulo" }, { status: 500 });
        }

        // Registro de Auditoria: Capítulo Atualizado
        await logAuditAction({
            userId: user.id,
            action: 'chapter.updated',
            entityType: 'chapter',
            entityId: id,
            metadata: { title: data[0].title, changes: Object.keys(updateData) },
            request
        });



        return NextResponse.json({ success: true, chapter: data[0] });
    } catch (error) {
        console.error("Erro no servidor (PUT chapter):", error);
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
        }

        // ✅ SEGURANÇA: Validar UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            return NextResponse.json({ error: "Formato de ID inválido" }, { status: 400 });
        }

        // ✅ SEGURANÇA: Validar sessão do usuário
        const supabaseAuth = await createServerSupabaseClient();
        const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: "Não autorizado - faça login" },
                { status: 401 }
            );
        }

        const supabase = createAdminSupabaseClient();

        // ✅ SEGURANÇA: Verificar se o usuário é dono do capítulo
        const { data: existingChapter, error: fetchError } = await supabase
            .from("chapters")
            .select("author_id, title, is_draft")
            .eq("id", id)
            .single();

        if (fetchError || !existingChapter) {
            return NextResponse.json(
                { error: "Capítulo não encontrado" },
                { status: 404 }
            );
        }

        // ✅ SEGURANÇA: Verificar se o usuário é dono do capítulo OU administrador
        const { data: profile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single();

        const isAdmin = profile?.is_admin === true;

        if (existingChapter.author_id !== user.id && !isAdmin) {
            console.error(`[SECURITY] Tentativa de exclusão não autorizada: user=${user.id}, chapter_author=${existingChapter.author_id}`);
            return NextResponse.json(
                { error: "Você não tem permissão para excluir este capítulo" },
                { status: 403 }
            );
        }

        // Registro de Auditoria: Capítulo Excluído
        await logAuditAction({
            userId: user.id,
            action: 'chapter.deleted',
            entityType: 'chapter',
            entityId: id,
            metadata: { title: existingChapter.title },
            request
        });

        const { error: deleteError } = await supabase
            .from("chapters")
            .delete()
            .eq("id", id);

        if (deleteError) {
            console.error("Erro ao excluir capítulo:", deleteError);
            return NextResponse.json({ error: "Falha ao excluir capítulo" }, { status: 500 });
        }

        // Deduct XP if it was a published chapter
        if (existingChapter && !existingChapter.is_draft) {
            try {
                const { error: xpError } = await (supabase.rpc as any)("grant_xp", {
                    p_user_id: existingChapter.author_id,
                    p_amount: -50,
                    p_role: "writer",
                    p_action_type: "chapter_delete",
                    p_entity_id: id
                });
                if (xpError) {
                    console.error("Erro ao deduzir XP na exclusão de capítulo:", xpError);
                }
            } catch (xpErr) {
                console.error("Exceção ao deduzir XP na exclusão de capítulo:", xpErr);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Capítulo "${existingChapter.title}" excluído com sucesso`
        });

    } catch (error: any) {
        console.error("Erro no servidor (DELETE chapter):", error);
        return NextResponse.json({ error: `Erro interno do servidor: ${error.message}` }, { status: 500 });
    }
}

