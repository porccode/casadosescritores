import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// POST: Enviar nova sugestão (público)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, message, image_url } = body;

    // Aplicar rate limiting
    const { rateLimitMiddleware } = await import("@/lib/rate-limit");
    const rateLimitResponse = await rateLimitMiddleware(request, 'suggestions');
    if (rateLimitResponse) return rateLimitResponse;

    // Aplicar proteção CSRF
    const { csrfProtection } = await import("@/lib/csrf-protection");
    const csrfResponse = await csrfProtection(request, 'submit_suggestion');
    if (csrfResponse) return csrfResponse;

    if (!email || !message) {
      return NextResponse.json(
        { error: "Email e mensagem são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar e sanitizar email e mensagem
    const { validateAndSanitizeForm } = await import("@/lib/sanitize");
    const validation = validateAndSanitizeForm(
      { email, message },
      {
        email: { type: 'email', required: true },
        message: { type: 'text', required: true, maxLength: 5000 }
      }
    );

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    const sanitizedEmail = validation.sanitizedData.email;
    const sanitizedMessage = validation.sanitizedData.message;

    const supabase = await createServerSupabaseClient();

    // Buscar usuário atual, se existir
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Você precisa estar logado para enviar uma sugestão" },
        { status: 401 }
      );
    }

    // Salvar sugestão (sem select para evitar problema de RLS em leitura)
    const { error } = await (supabase as any)
      .from("suggestions")
      .insert({
        email: sanitizedEmail,
        message: sanitizedMessage,
        image_url: image_url || null,
        user_id: user.id,
      });

    if (error) {
      console.error("Erro ao salvar sugestão:", error);
      throw error;
    }

    // Notificar todos os administradores
    try {
      const { data: admins } = await (supabase as any)
        .from("profiles")
        .select("id")
        .eq("role", "admin");

      if (admins && admins.length > 0) {
        const notifications = admins.map((admin: any) => ({
          target_user_id: admin.id,
          type: "suggestion",
          is_read: false,
          created_at: new Date().toISOString(),
          additional_data: {
            email: email.trim(),
            message_preview: message.trim().substring(0, 100),
            has_attachment: !!image_url,
          },
        }));

        await (supabase as any).from("notifications").insert(notifications);
      }
    } catch (notifyError) {
      // Não falhar se não conseguir notificar
      console.error("Erro ao notificar admins:", notifyError);
    }

    return NextResponse.json({ success: true, message: "Sugestão enviada com sucesso" });
  } catch (error) {
    console.error("Erro ao processar sugestão:", error);
    return NextResponse.json(
      { error: "Erro ao enviar sugestão" },
      { status: 500 }
    );
  }
}

// GET: Listar sugestões (admin only)
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Verificar se é admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data: profile } = await (supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single() as any);

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Buscar sugestões
    const { data: suggestions, error } = await (supabase as any)
      .from("suggestions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Erro ao buscar sugestões:", error);
    return NextResponse.json(
      { error: "Erro ao buscar sugestões" },
      { status: 500 }
    );
  }
}

// DELETE: Excluir sugestão (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data: profile } = await (supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single() as any);

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const { error } = await (supabase as any)
      .from("suggestions")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir sugestão:", error);
    return NextResponse.json(
      { error: "Erro ao excluir sugestão" },
      { status: 500 }
    );
  }
}

// PATCH: Marcar como lida (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data: profile } = await (supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single() as any);

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const { id, is_read } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const { error } = await (supabase as any)
      .from("suggestions")
      .update({ is_read: is_read ?? true })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar sugestão:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar sugestão" },
      { status: 500 }
    );
  }
}
