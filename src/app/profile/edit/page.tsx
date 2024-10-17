"use client";

import { useProfileEditor } from "@/hooks/useProfileEditor";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AvatarUploadCard } from "@/components/profile/edit/AvatarUploadCard";
import { ProfileInfoCard } from "@/components/profile/edit/ProfileInfoCard";
import { ProfileSocialCard } from "@/components/profile/edit/ProfileSocialCard";
import { ProfileSecurityCard } from "@/components/profile/edit/ProfileSecurityCard";
import { ProfileAgeVerificationCard } from "@/components/profile/edit/ProfileAgeVerificationCard";
import DesktopHeader from "@/components/navigation/DesktopHeader";

/**
 * EditProfilePage.
 * 
 * ARCHITECTURE:
 * - High-authority orchestration layer for profile management.
 * - Uses useProfileEditor hook for centralized logic.
 * - Decomposed into specialized functional cards for maximum maintainability.
 */

export default function EditProfilePage() {
    const {
        formData,
        loading,
        saving,
        uploading,
        error,
        successMessage,
        updateField,
        handleAvatarUpload,
        saveProfile,
    } = useProfileEditor();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30 pb-20">
            <DesktopHeader pageTitle="Editar Perfil" />

            <div className="content-wrapper py-8 px-4 lg:px-0">
                {/* Save Button */}
                <div className="max-w-4xl mx-auto flex justify-end mb-8">
                    <Button
                        onClick={saveProfile}
                        disabled={saving || uploading}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 animate-spin" size={14} />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2" size={14} />
                                Salvar Alterações
                            </>
                        )}
                    </Button>
                </div>

                {/* Notifications */}
                <div className="max-w-4xl mx-auto mb-8 space-y-4">
                    {error && (
                        <Alert variant="destructive" className="bg-destructive/5 border-destructive/10">
                            <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
                        </Alert>
                    )}
                    {successMessage && (
                        <Alert className="border-green-500/20 bg-green-500/5 text-green-600">
                            <AlertDescription className="text-sm font-medium">{successMessage}</AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Main Content Grid */}
                <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Primary Info Column */}
                    <div className="lg:col-span-8 space-y-8">
                        <ProfileInfoCard
                            formData={formData}
                            onChange={updateField}
                        />
                        <ProfileSecurityCard
                            isAdmin={formData.is_admin}
                            username={formData.username}
                        />
                        <ProfileAgeVerificationCard />
                    </div>

                    {/* Secondary/Settings Column */}
                    <aside className="lg:col-span-4 space-y-8 sticky top-24">
                        <AvatarUploadCard
                            avatarUrl={formData.avatar_url}
                            username={formData.username}
                            onUpload={handleAvatarUpload}
                            isUploading={uploading}
                        />
                        <ProfileSocialCard
                            formData={formData}
                            onChange={updateField}
                        />
                    </aside>
                </div>
            </div>
        </div>
    );
}
