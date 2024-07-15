import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    // Next.js 15 requires awaiting cookies()
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
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    } catch (error) {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );

    // Fazer logout no Supabase (invalida a sessão no servidor)
    await supabase.auth.signOut();

    // Forçar a remoção de todos os cookies do Supabase
    // Isso garante que mesmo se o signOut falhar em limpar algo, nós limpamos manualmente
    const allCookies = cookieStore.getAll();
    allCookies.forEach((cookie) => {
        if (cookie.name.startsWith("sb-")) {
            cookieStore.set(cookie.name, "", { maxAge: 0, path: "/" });
        }
    });

    return NextResponse.json({ success: true });
}
