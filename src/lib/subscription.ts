import { createServerSupabaseClient } from "@/lib/supabase-server";

// Plan types kept for compatibility but effectively unused or just "free"
type Plan = "free" | "basic" | "pro";

// All limits are now effectively infinite
// keeping structure to avoid breaking imports but ensuring "allowed: true"
export async function getUserPlan(userId: string): Promise<Plan> {
    // Always return free, logic neutralized
    return "free";
}

export async function getProfileRole(userId: string): Promise<string | null> {
    const supabase = await createServerSupabaseClient();
    const { data } = await (supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single() as any);
    return (data as any)?.role || null;
}

export async function checkReadingLimit(userId: string, seriesId: string): Promise<{ allowed: boolean; limit?: number; current?: number }> {
    return { allowed: true, limit: -1, current: 0 };
}

export async function recordReadingHistory(userId: string, seriesId: string, chapterId: string) {
    // Logic neutralized: Recording is now handled by the 'complete_chapter_reading' RPC
    // to ensure points are awarded correctly and avoid "already read today" conflicts.
    return;
}

export async function checkSeriesCreationLimit(userId: string): Promise<{ allowed: boolean; limit?: number; current?: number }> {
    return { allowed: true, limit: -1, current: 0 };
}

export async function checkChapterPublicationLimit(userId: string): Promise<{ allowed: boolean; limit?: number; current?: number }> {
    return { allowed: true, limit: -1, current: 0 };
}

export async function canCommentOnProfiles(userId: string): Promise<boolean> {
    return true;
}

