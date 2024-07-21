import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Força a exclusão de todos os dados do usuário limpando as tabelas filhas
 * manualmente antes de excluir o Auth. Isso resolve problemas de Foreign Key
 * Constraint (ON DELETE RESTRICT) quando o ON DELETE CASCADE não está habilitado
 * em todas as tabelas do banco.
 */
export async function wipeUserDataHard(supabase: SupabaseClient, userId: string) {
    // 1. Excluir dados secundários/interativos
    await supabase.from("comment_votes").delete().eq("user_id", userId);
    await supabase.from("comments").delete().eq("author_id", userId);
    await supabase.from("post_likes").delete().eq("user_id", userId);
    await supabase.from("posts").delete().eq("author_id", userId);
    
    // 2. Excluir capítulos e séries
    await supabase.from("chapters").delete().eq("author_id", userId);
    await supabase.from("saved_series").delete().eq("user_id", userId);
    await supabase.from("series_follows").delete().eq("user_id", userId);
    await supabase.from("series").delete().eq("author_id", userId);
    
    // 3. Excluir interações sociais
    await supabase.from("author_follows").delete().or(`follower_id.eq.${userId},followed_id.eq.${userId}`);
    await supabase.from("notifications").delete().or(`target_user_id.eq.${userId},actor_id.eq.${userId}`);
    await supabase.from("messages").delete().eq("sender_id", userId);
    await supabase.from("conversations").delete().or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
    await supabase.from("playlists").delete().eq("user_id", userId);
    
    // 3.5 Excluir dados de Comunidades (LGPD)
    await supabase.from("community_post_likes").delete().eq("user_id", userId);
    await supabase.from("community_posts").delete().eq("author_id", userId);
    await supabase.from("community_members").delete().eq("user_id", userId);
    await supabase.from("communities").delete().eq("creator_id", userId);
    
    // 4. Excluir gamificação, logs e analytics
    await supabase.from("xp_events").delete().eq("user_id", userId);
    await supabase.from("user_achievements").delete().eq("user_id", userId);
    await supabase.from("audit_logs").delete().eq("user_id", userId);
    await supabase.from("site_visits").delete().eq("user_id", userId);
    
    // 5. Excluir Perfil principal
    const { error: profileError } = await supabase.from("profiles").delete().eq("id", userId);
    if (profileError) {
        console.error("Aviso: Falha ao excluir profile manualmente:", profileError);
    }
    
    // 6. Excluir Auth (Final)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    // Se o usuário não existir no Auth (já foi apagado mas sobrou lixo), ignorar o erro
    if (authError && authError.message.includes("User not found")) {
        return null;
    }
    
    return authError;
}
