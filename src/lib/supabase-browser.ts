"use client";

import { createBrowserClient as createClient } from "@supabase/ssr";
import { Database } from "@/types/database.types";

let supabase: ReturnType<typeof createClient<Database>> | null = null;

export function createBrowserClient() {
    if (supabase) return supabase;

    supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    return supabase;
}
