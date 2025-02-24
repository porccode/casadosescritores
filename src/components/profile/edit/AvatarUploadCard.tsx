"use client";

import { useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AvatarUploadCardProps {
    avatarUrl: string | null;
    username: string;
    onUpload: (file: File) => Promise<void>;
    isUploading: boolean;
}

export function AvatarUploadCard({ avatarUrl, username, onUpload, isUploading }: AvatarUploadCardProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await onUpload(e.target.files[0]);
        }
    };

    return (
        <Card className="shadow-none border-border overflow-hidden bg-background">
            <CardHeader className="bg-muted/30 border-b py-4">
                <CardTitle className="text-sm font-semibold text-center">Avatar de Autor</CardTitle>
            </CardHeader>
            <CardContent className="pt-8 flex flex-col items-center">
                <div
                    className="relative group cursor-pointer"
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                >
                    <UserAvatar
                        src={avatarUrl}
                        alt={username}
                        size={120}
                        className="h-32 w-32 border-4 border-background shadow-2xl transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-all">
                        <Upload className="text-white h-8 w-8" />
                    </div>
                    {isUploading && (
                        <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                            <Loader2 className="animate-spin text-primary" size={32} />
                        </div>
                    )}
                </div>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="mt-6 text-xs font-medium text-primary hover:bg-primary/5"
                >
                    {isUploading ? "Enviando..." : "Mudar Foto de Perfil"}
                </Button>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                />

                <p className="mt-4 text-xs text-muted-foreground text-center">
                    JPG, PNG ou WebP. Max 2MB.
                </p>
            </CardContent>
        </Card>
    );
}
