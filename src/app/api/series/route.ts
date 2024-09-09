import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { validateAndSanitizeForm } from "@/lib/sanitize";
import { sanitizeSlug } from "@/lib/utils";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { isGibberish } from "@/lib/quality-check";

// Funções auxiliares para API de séries
export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");

        const supabase = createAdminSupabaseClient();

        if (id) {
            // Buscar série específica com seus capítulos
            // Fetch series by ID
            const { data: series, error: seriesError } = await supabase
                .from("series")
                .select(
                    `
                    *,
                    profiles(username, avatar_url)
                `
                )
                .eq("id", id)
                .single();

            if (seriesError) {
                console.error("API: Erro ao buscar série:", seriesError);
                return NextResponse.json(
                    { error: "Série não encontrada" },
                    { status: 404 }
                );
            }

            // Buscar capítulos separadamente
            const { data: chapters, error: chaptersError } = await supabase
                .from("chapters")
                .select("id, title, created_at, chapter_number, view_count")
                .eq("series_id", id)
                .order("chapter_number", { ascending: true });

            if (chaptersError) {
                console.error("API: Erro ao buscar capítulos:", chaptersError);
            }

            // Adicionar capítulos à resposta
            const seriesWithChapters = {
                ...series,
                chapters: chapters || []
            };

            return NextResponse.json(
                { series: seriesWithChapters },
                {
                    headers: {
                        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
                    }
                }
            );
        } else {
            // Listar todas as séries (excluindo arquivadas)
            const { data: series, error } = await supabase
                .from("series")
                .select(
                    `
                    *,
                    profiles(username)
                `
                )
                .eq("is_archived", false)
                .eq("is_draft", false)
                .gt("chapter_count", 0)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("API: Erro ao listar séries:", error);
                return NextResponse.json(
                    { error: "Erro ao buscar séries" },
                    { status: 500 }
                );
            }

            return NextResponse.json(
                { series },
                {
                    headers: {
                        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
                    }
                }
            );
        }
    } catch (error) {
        console.error("Erro na API de séries:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        // ✅ SEGURANÇA: Rate limiting
        const rateLimitResponse = await rateLimitMiddleware(request, 'series');
        if (rateLimitResponse) return rateLimitResponse;

        // ✅ SEGURANÇA: Validar sessão do usuário
        const supabaseAuth = await createServerSupabaseClient();
        const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: "Não autorizado - faça login para criar uma série" },
                { status: 401 }
            );
        }

        const body = await request.json();

        // ✅ SEGURANÇA: Validar e sanitizar dados
        const validation = validateAndSanitizeForm(body, {
            title: { type: 'text', required: true, minLength: 3, maxLength: 100 },
            description: { type: 'text', maxLength: 2000 },
            author_note: { type: 'text', maxLength: 5000 },
            related_title: { type: 'text', maxLength: 200 },
            related_url: { type: 'text', maxLength: 500 },
            related_banner_url: { type: 'text', maxLength: 500 }
        });

        if (!validation.isValid) {
            return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
        }

        const { title, description, author_note, related_title, related_url, related_banner_url } = validation.sanitizedData;

        // ✅ SEGURANÇA: Validar qualidade do conteúdo (Anti-Gibberish)
        const titleCheck = isGibberish(title);
        if (titleCheck.isGibberish) {
            return NextResponse.json({ error: `O título parece não ter sentido: ${titleCheck.reason}` }, { status: 400 });
        }

        if (description) {
            const descCheck = isGibberish(description);
            if (descCheck.isGibberish) {
                return NextResponse.json({ error: `A descrição parece não ter sentido: ${descCheck.reason}` }, { status: 400 });
            }
        }

        const { genre, genres, tags, cover_url, work_type, is_completed, is_explicit, comments_enabled, is_ai_generated, ai_cover_generated, copyright_type } = body;

        // Validação básica
        if (!title) {
            return NextResponse.json(
                { error: "Título é obrigatório" },
                { status: 400 }
            );
        }

        const supabase = createAdminSupabaseClient();

        // ✅ SEGURANÇA: Usar user.id da sessão, não do body
        const authorId = user.id;

        // ✅ SEGURANÇA: Limite de 2 séries por dia
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const { count: dailyCount, error: countError } = await supabase
            .from("series")
            .select("id", { count: 'exact', head: true })
            .eq("author_id", authorId)
            .gte("created_at", startOfDay.toISOString());

        if (countError) {
            console.error("Erro ao verificar limite diário:", countError);
        }

        if (dailyCount !== null && dailyCount >= 2) {
            return NextResponse.json(
                { error: "Limite atingido: você só pode criar 2 séries por dia. Focamos em qualidade sobre quantidade!" },
                { status: 429 }
            );
        }

        // Verificar se já existe uma série com o mesmo título para este autor
        const { data: existingSeries, error: checkError } = await supabase
            .from("series")
            .select("id, title")
            .eq("author_id", authorId)
            .ilike("title", title.trim())
            .limit(1);

        if (checkError) {
            console.error("Erro ao verificar série existente:", checkError);
        }

        if (existingSeries && existingSeries.length > 0) {
            return NextResponse.json(
                { error: "Já existe uma série com esse nome. Por favor, escolha um título diferente." },
                { status: 409 }
            );
        }

        // --- SISTEMA DE PRIMEIRO LIVRO GRATUITO ---
        // Verificar se o usuário já usou o seu livro gratuito de estreia
        const { data: profile, error: profileErr } = await supabase
            .from("profiles")
            .select("xp, first_book_used")
            .eq("id", authorId)
            .single();

        if (profileErr || !profile) {
            return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
        }

        const firstBookUsed = (profile as any).first_book_used === true;
        let isFirstBook = false;

        if (!firstBookUsed) {
            // Primeiro livro é GRATUITO — marcar o flag no profile
            const { error: flagErr } = await supabase
                .from("profiles")
                .update({ first_book_used: true })
                .eq("id", authorId);

            if (flagErr) {
                console.error("Erro ao marcar first_book_used:", flagErr);
                // Não bloquear o fluxo, apenas logar
            }
            isFirstBook = true;
        } else {
            // A partir do 2º livro: verificar e debitar 500 XP
            const userXP = (profile as any).xp || 0;

            if (userXP < 500) {
                return NextResponse.json(
                    {
                        error: "Você não possui Inspiração (XP) suficiente para criar esta série. Custo: 500 XP.",
                        xpRequired: 500,
                        currentXp: userXP,
                        isXpError: true
                    },
                    { status: 403 }
                );
            }

            const { spendXP } = await import("@/services/xp");
            const spendResult = await spendXP(authorId, "SERIES_CREATE");

            if (!spendResult.success) {
                return NextResponse.json(
                    { error: `Falha ao debitar XP: ${spendResult.error || "Saldo insuficiente"}` },
                    { status: 403 }
                );
            }
        }

        const genresVal = genres || (genre ? [genre] : []);
        const primaryGenre = genre || (genresVal[0] || null);

        const { related_series_id } = body;

        // Criar nova série
        const { data, error } = await supabase
            .from("series")
            .insert({
                title: title.trim(),
                description,
                author_note,
                related_series_id: related_series_id || null,
                related_title,
                related_url,
                related_banner_url,
                genre: primaryGenre,
                genres: genresVal,
                tags,
                author_id: authorId, // ✅ SEGURO: ID da sessão
                cover_url: cover_url,
                work_type: work_type || 'series',
                is_completed: is_completed || false,
                is_draft: false,
                is_explicit: is_explicit || false,
                comments_enabled: comments_enabled !== false,
                is_ai_generated: is_ai_generated || 'no',
                ai_cover_generated: ai_cover_generated || 'no',
                copyright_type: copyright_type || 'all_rights_reserved',
                is_first_book: isFirstBook,
                slug: sanitizeSlug(title.trim()),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select();

        if (error) {
            console.error("Erro ao criar série:", error);
            return NextResponse.json(
                { error: `Falha ao criar série: ${error.message}` },
                { status: 500 }
            );
        }


        return NextResponse.json({
            success: true,
            series: data[0],
            isFirstBook,
        });

    } catch (error: any) {
        console.error("Erro no servidor:", error);
        return NextResponse.json(
            { error: `Erro interno do servidor: ${error.message}` },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        // ✅ SEGURANÇA: Rate limiting
        const rateLimitResponse = await rateLimitMiddleware(request, 'series');
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
        // Process update request
        const { id, title, description, genre, genres, tags, cover_url, work_type, is_completed, is_explicit, comments_enabled, is_ai_generated, ai_cover_generated, copyright_type } = body;

        if (!id || !title) {
            return NextResponse.json(
                { error: "ID e Título são obrigatórios" },
                { status: 400 }
            );
        }

        // ✅ SEGURANÇA: Validar formato UUID do ID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            return NextResponse.json({ error: "Formato de ID inválido" }, { status: 400 });
        }

        // ✅ SEGURANÇA: Validar e sanitizar campos editáveis
        const validation = validateAndSanitizeForm(body, {
            title: { type: 'text', required: true, minLength: 3, maxLength: 100 },
            description: { type: 'text', maxLength: 2000 },
            author_note: { type: 'text', maxLength: 5000 },
            related_title: { type: 'text', maxLength: 200 },
            related_url: { type: 'text', maxLength: 500 },
            related_banner_url: { type: 'text', maxLength: 500 }
        });

        if (!validation.isValid) {
            return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
        }

        const sanitizedTitle = validation.sanitizedData.title;
        const sanitizedDescription = validation.sanitizedData.description;
        const sanitizedAuthorNote = validation.sanitizedData.author_note;
        const sanitizedRelatedTitle = validation.sanitizedData.related_title;
        const sanitizedRelatedUrl = validation.sanitizedData.related_url;
        const sanitizedRelatedBannerUrl = validation.sanitizedData.related_banner_url;

        // ✅ SEGURANÇA: Validar qualidade do conteúdo na edição (Anti-Gibberish)
        const titleCheck = isGibberish(sanitizedTitle);
        if (titleCheck.isGibberish) {
            return NextResponse.json({ error: `O título parece não ter sentido: ${titleCheck.reason}` }, { status: 400 });
        }

        if (sanitizedDescription) {
            const descCheck = isGibberish(sanitizedDescription);
            if (descCheck.isGibberish) {
                return NextResponse.json({ error: `A descrição parece não ter sentido: ${descCheck.reason}` }, { status: 400 });
            }
        }

        const supabase = createAdminSupabaseClient();

        // ✅ SEGURANÇA: Verificar se o usuário é dono da série
        const { data: existingSeries, error: fetchError } = await supabase
            .from("series")
            .select("author_id")
            .eq("id", id)
            .single();

        if (fetchError || !existingSeries) {
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

        if (existingSeries.author_id !== user.id && !isAdmin) {
            console.error(`[SECURITY] Tentativa de edição não autorizada: user=${user.id}, series_author=${existingSeries.author_id}`);
            return NextResponse.json(
                { error: "Você não tem permissão para editar esta série" },
                { status: 403 }
            );
        }

        const genresVal = genres || (genre ? [genre] : []);
        const primaryGenre = genre || (genresVal[0] || null);

        const { related_series_id } = body;

        const updatePayload: any = {
            title: sanitizedTitle,
            description: sanitizedDescription,
            author_note: sanitizedAuthorNote,
            related_series_id: related_series_id || null,
            related_title: sanitizedRelatedTitle,
            related_url: sanitizedRelatedUrl,
            related_banner_url: sanitizedRelatedBannerUrl,
            genre: primaryGenre,
            genres: genresVal,
            tags,
            cover_url: cover_url,
            slug: sanitizeSlug(sanitizedTitle),
            updated_at: new Date().toISOString(),
        };

        if (work_type !== undefined) {
            updatePayload.work_type = work_type;
        }

        if (is_completed !== undefined) {
            updatePayload.is_completed = is_completed;
        }

        if (is_explicit !== undefined) {
            updatePayload.is_explicit = is_explicit;
        }

        if (comments_enabled !== undefined) {
            updatePayload.comments_enabled = comments_enabled;
        }

        if (is_ai_generated !== undefined) {
            updatePayload.is_ai_generated = is_ai_generated;
        }

        if (ai_cover_generated !== undefined) {
            updatePayload.ai_cover_generated = ai_cover_generated;
        }

        if (copyright_type !== undefined) {
            updatePayload.copyright_type = copyright_type;
        }

        if (body.is_draft !== undefined) {
            updatePayload.is_draft = false; // Forçamos sempre como publicado
        }

        // Update payload ready

        const { data, error } = await supabase
            .from("series")
            .update(updatePayload)
            .eq("id", id)
            .select();

        if (error) {
            console.error("Erro ao atualizar série:", error);
            return NextResponse.json(
                { error: `Falha ao atualizar série: ${error.message}` },
                { status: 500 }
            );
        }

        // Revalidar paths importantes para garantir que o usuário veja a mudança
        try {
            const { revalidatePath } = await import("next/cache");
            revalidatePath(`/series/${id}`);
            revalidatePath("/series");
            revalidatePath("/");
        } catch (e) {
            console.error("Erro ao revalidar path:", e);
        }


        return NextResponse.json({
            success: true,
            series: data[0],
        });
    } catch (error: any) {
        console.error("Erro no servidor (PUT):", error);
        return NextResponse.json(
            { error: `Erro interno do servidor: ${error.message}` },
            { status: 500 }
        );
    }
}
