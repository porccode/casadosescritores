"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link as LinkIcon, Twitter, Facebook, Instagram } from "lucide-react";
import { UserProfile } from "@/hooks/useProfileEditor";

interface ProfileSocialCardProps {
    formData: UserProfile;
    onChange: (name: string, value: string) => void;
}

export function ProfileSocialCard({ formData, onChange }: ProfileSocialCardProps) {
    const SOCIAL_FIELDS = [
        { id: "website_url", label: "Website", icon: <LinkIcon size={12} className="text-primary" />, placeholder: "https://seu-site.com" },
        { id: "twitter_url", label: "Twitter (X)", icon: <Twitter size={12} className="text-sky-500" />, placeholder: "twitter.com/perfil" },
        { id: "facebook_url", label: "Facebook", icon: <Facebook size={12} className="text-blue-600" />, placeholder: "facebook.com/perfil" },
        { id: "instagram_url", label: "Instagram", icon: <Instagram size={12} className="text-pink-600" />, placeholder: "instagram.com/perfil" },
    ];

    return (
        <Card className="shadow-none border-border bg-background overflow-hidden">
            <CardHeader className="bg-muted/30 border-b py-4">
                <CardTitle className="text-sm font-semibold">Canais de Conexão</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5 px-6 pb-8">
                {SOCIAL_FIELDS.map((field) => (
                    <div key={field.id} className="space-y-2">
                        <Label
                            htmlFor={field.id}
                            className="flex items-center gap-2 text-muted-foreground"
                        >
                            {field.icon} {field.label}
                        </Label>
                        <Input
                            type="url"
                            id={field.id}
                            name={field.id}
                            value={(formData as any)[field.id] || ""}
                            onChange={(e) => onChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            className="h-10 border-border focus:border-primary transition-all text-sm"
                        />
                    </div>
                ))}
                <p className="pt-2 text-xs text-muted-foreground text-center">
                    Links públicos exibidos no seu perfil
                </p>
            </CardContent>
        </Card>
    );
}
