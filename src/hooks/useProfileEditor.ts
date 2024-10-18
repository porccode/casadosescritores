"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import { showXPToast } from "@/lib/xp-toast";
import { XP_CONFIG } from "@/config/xp";

export interface UserProfile {
    id: string;
    username: string;
    first_name: string | null;
    last_name: string | null;
    bio: string | null;
    website_url: string | null;
    twitter_url: string | null;
    facebook_url: string | null;
    instagram_url: string | null;
    avatar_url: string | null;
    is_admin: boolean;
}

/**
 * useProfileEditor.
 * 
 * Logic: Manages the complex state of profile editing, including avatar uploads,
 * form change tracking, and XP awarding triggers.
 */
export function useProfileEditor() {
    const router = useRouter();
    const supabase = createBrowserClient();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [originalData, setOriginalData] = useState<UserProfile | null>(null);

    const [formData, setFormData] = useState<UserProfile>({
        id: "",
        username: "",
        first_name: "",
        last_name: "",
        bio: "",
        website_url: "",
        twitter_url: "",
        facebook_url: "",
        instagram_url: "",
        avatar_url: null,
        is_admin: false,
    });

    useEffect(() => {
        async function loadProfile() {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    const fullPath = window.location.pathname + window.location.search;
                    router.push(`/login?redirectTo=${encodeURIComponent(fullPath)}`);
                    return;
                }

                setUser(user);

                const { data, error } = await (supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single() as any);

                if (error) throw error;

                if (data) {
                    const profile = {
                        id: data.id,
                        username: data.username || "",
                        first_name: data.first_name || "",
                        last_name: data.last_name || "",
                        bio: data.bio || "",
                        website_url: data.website_url || "",
                        twitter_url: data.twitter_url || "",
                        facebook_url: data.facebook_url || "",
                        instagram_url: data.instagram_url || "",
                        avatar_url: data.avatar_url || null,
                        is_admin: !!data.is_admin,
                    };
                    setFormData(profile);
                    setOriginalData(profile);
                }
            } catch (err: any) {
                console.error("[useProfileEditor] Error loading profile:", err);
                setError(err.message || "Erro ao carregar dados do perfil.");
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, [router, supabase]);

    const updateField = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarUpload = async (file: File) => {
        if (!user) return;

        try {
            setUploading(true);
            setError(null);

            // Compress
            const { compressImage } = await import("@/lib/utils");
            const compressedFile = await compressImage(file, 400, 0.7, 400);

            const fileExt = "webp";
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, compressedFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("avatars")
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, avatar_url: publicUrl }));

            setSuccessMessage("Avatar atualizado com sucesso (clique em Salvar para persistir).");
            showXPToast({
                amount: XP_CONFIG.AVATAR_ADD.xp,
                action: XP_CONFIG.AVATAR_ADD.action
            });
            setTimeout(() => setSuccessMessage(null), 3000);

        } catch (err: any) {
            console.error("[useProfileEditor] Upload error:", err);
            setError(err.message || "Erro ao fazer upload da imagem.");
        } finally {
            setUploading(false);
        }
    };

    const saveProfile = async () => {
        if (!user) return;

        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        if (!formData.first_name?.trim() || !formData.last_name?.trim()) {
            setError("Nome e sobrenome são obrigatórios.");
            setSaving(false);
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Sessão expirada");

            const response = await fetch("/api/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    first_name: formData.first_name.trim(),
                    last_name: formData.last_name.trim(),
                    bio: formData.bio?.trim() || null,
                    website_url: formData.website_url?.trim() || null,
                    twitter_url: formData.twitter_url?.trim() || null,
                    facebook_url: formData.facebook_url?.trim() || null,
                    instagram_url: formData.instagram_url?.trim() || null,
                    avatar_url: formData.avatar_url
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Erro ao atualizar perfil");

            // XP Logic (Toasts)
            if (result.xpAwarded && result.xpAwarded.length > 0) {
                result.xpAwarded.forEach((xp: any) => {
                    const actionKey = xp.action_type.toUpperCase() as keyof typeof XP_CONFIG;
                    const config = XP_CONFIG[actionKey];
                    if (config) {
                        showXPToast({
                            amount: config.xp,
                            action: config.action,
                            message: "Perfil atualizado!"
                        });
                    }
                });
            }

            setFormData(result.profile);
            setOriginalData(result.profile);
            setSuccessMessage("Perfil atualizado com sucesso!");
            setTimeout(() => setSuccessMessage(null), 3000);

        } catch (err: any) {
            console.error("[useProfileEditor] Save error:", err);
            setError(err.message || "Erro ao atualizar perfil.");
        } finally {
            setSaving(false);
        }
    };

    return {
        formData,
        loading,
        saving,
        uploading,
        error,
        successMessage,
        updateField,
        handleAvatarUpload,
        saveProfile,
        isOwnProfile: !!user,
        username: formData.username
    };
}
