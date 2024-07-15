import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const type = searchParams.get("type"); // Pode ser 'recovery' para reset de senha

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore if called from Server Component
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    const user = data?.user;
    const session = data?.session;

    if (!error && user) {
      // Detectar se é um fluxo de recuperação de senha
      // O Supabase envia type=recovery ou podemos verificar o AMR (Authentication Method Reference)
      const isRecoveryFlow = type === "recovery" ||
        session?.user?.aud === "authenticated" &&
        session?.user?.app_metadata?.provider === "email" &&
        !session?.user?.email_confirmed_at;

      // Verificar AMR para recovery
      const amr = (session as any)?.amr;
      const hasRecoveryAmr = amr?.some((m: any) => m.method === "recovery" || m.method === "otp");

      if (type === "recovery" || hasRecoveryAmr) {
        // Fluxo de recuperação de senha - redirecionar para reset-password
        return NextResponse.redirect(`${origin}/reset-password?type=recovery`);
      }

      try {
        // Fluxo normal de login OAuth - criar perfil se necessário
        const supabaseAdmin = createAdminSupabaseClient();

        const { data: profile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Erro ao verificar perfil:", profileError);
        }

        if (!profile) {
          const meta = user.user_metadata || {};

          let baseUsername = meta.user_name ||
            meta.email?.split("@")[0] ||
            `user_${Math.random().toString(36).slice(2, 7)}`;

          baseUsername = baseUsername.toLowerCase().replace(/[^a-z0-9_]/g, "");

          let username = baseUsername;
          let isUnique = false;
          let attempts = 0;

          while (!isUnique && attempts < 5) {
            if (attempts > 0) {
              username = `${baseUsername}${Math.floor(Math.random() * 10000)}`;
            }

            const { data: existing } = await supabaseAdmin
              .from("profiles")
              .select("username")
              .eq("username", username)
              .single();

            if (!existing) isUnique = true;
            attempts++;
          }

          if (!isUnique) username = `${baseUsername}${Date.now().toString().slice(-6)}`;

          let firstName = meta.full_name?.split(" ")[0] || meta.name?.split(" ")[0] || "Usuário";
          let lastName = meta.full_name?.split(" ").slice(1).join(" ") || meta.name?.split(" ").slice(1).join(" ") || "";

          const { error: insertError } = await supabaseAdmin.from("profiles").insert({
            id: user.id,
            username: username,
            email: user.email!,
            first_name: firstName,
            last_name: lastName,
            avatar_url: meta.avatar_url || meta.picture || null,
            role: "user",
            created_at: new Date().toISOString(),
          });

          if (insertError) {
            console.error("ERRO CRÍTICO ao criar perfil:", insertError);
          } else {
            console.log("Perfil criado com sucesso para:", username);
          }
        }
      } catch (err) {
        console.error("Erro inesperado no callback:", err);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
}

