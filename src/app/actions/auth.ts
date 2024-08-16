"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { redirect } from "next/navigation";
import { wipeUserDataHard } from "@/lib/delete-user";

export async function deleteAccount(password: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    throw new Error("Usuário não autenticado");
  }

  // 1. Verificar senha re-autenticando
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: password,
  });

  if (signInError) {
    throw new Error("Senha incorreta");
  }

  // 2. Hard Delete (Exclusão permanente com limpeza de Foreign Keys)
  const adminAuthClient = createAdminSupabaseClient();

  try {
    const deleteError = await wipeUserDataHard(adminAuthClient, user.id);

    if (deleteError) {
      console.error("Erro final ao excluir usuário no Auth:", deleteError);
      throw deleteError;
    }

  } catch (err: any) {
    console.error("Erro durante o hard delete:", err);
    throw new Error("Erro ao processar exclusão de conta. Contate o suporte.");
  }

  // 4. Logout e redirecionar
  await supabase.auth.signOut();
  redirect("/");
}
