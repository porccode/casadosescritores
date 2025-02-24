import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
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
    const { suggestion_id, content } = body;

    if (!suggestion_id || !content) {
      return NextResponse.json({ error: "ID da sugestão e conteúdo são obrigatórios" }, { status: 400 });
    }

    // Buscar a sugestão para pegar o user_id do autor
    const { data: suggestion, error: suggestionError } = await (supabase
      .from("suggestions" as any)
      .select("user_id")
      .eq("id", suggestion_id)
      .single() as any);

    if (suggestionError || !suggestion) {
      return NextResponse.json({ error: "Sugestão não encontrada" }, { status: 404 });
    }

    if (!suggestion.user_id) {
      return NextResponse.json({ error: "Não é possível responder internamente (Visitante)" }, { status: 400 });
    }

    const targetUserId = suggestion.user_id;

    // Buscar ou criar conversa
    let conversationId = null;

    const { data: existingConvs } = await (supabase as any)
      .from("conversations")
      .select("id")
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${user.id})`)
      .limit(1);

    if (existingConvs && existingConvs.length > 0) {
      conversationId = existingConvs[0].id;
    } else {
      const { data: newConv, error: newConvError } = await (supabase as any)
        .from("conversations")
        .insert({
          user1_id: user.id,
          user2_id: targetUserId,
          last_message: content.substring(0, 50),
          last_message_at: new Date().toISOString()
        })
        .select("id")
        .single();

      if (newConvError || !newConv) {
        throw new Error("Erro ao criar conversa");
      }
      conversationId = newConv.id;
    }

    // Inserir a mensagem
    const { error: msgError } = await (supabase as any)
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content,
        is_read: false
      });

    if (msgError) throw msgError;

    // Atualizar last_message na conversa (se já existia)
    if (existingConvs && existingConvs.length > 0) {
      await (supabase as any)
        .from("conversations")
        .update({
          last_message: content.substring(0, 50),
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", conversationId);
    }

    // Marcar sugestão como lida, já que foi respondida
    await (supabase as any)
      .from("suggestions")
      .update({ is_read: true })
      .eq("id", suggestion_id);

    // Criar notificação para o usuário
    await (supabase as any)
      .from("notifications")
      .insert({
        target_user_id: targetUserId,
        type: "message",
        content: content.substring(0, 100),
        additional_data: {
          conversation_id: conversationId,
          action: "sent",
          notifiable_type: "Message"
        },
        is_read: false
      });

    return NextResponse.json({ success: true, message: "Resposta enviada com sucesso" });
  } catch (error) {
    console.error("Erro ao enviar resposta:", error);
    return NextResponse.json(
      { error: "Erro ao enviar resposta" },
      { status: 500 }
    );
  }
}
