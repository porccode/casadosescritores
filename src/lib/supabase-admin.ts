import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

// WARNING: This client bypasses Row Level Security (RLS).
// Use only in trusted Server Actions or API Routes.
export const createAdminSupabaseClient = () => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing/undefined in environment variables.");
    }

    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey!, // Ensure this ENV is set in local/Vercel
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
};
