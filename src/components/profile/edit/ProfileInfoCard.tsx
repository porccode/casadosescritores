"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserProfile } from "@/hooks/useProfileEditor";

interface ProfileInfoCardProps {
    formData: UserProfile;
    onChange: (name: string, value: string) => void;
}

export function ProfileInfoCard({ formData, onChange }: ProfileInfoCardProps) {
    return (
        <Card className="shadow-none border-border bg-background overflow-hidden">
            <CardHeader className="bg-muted/30 border-b py-4 px-6">
                <CardTitle className="text-sm font-semibold">Informações Literárias</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <Label htmlFor="first_name">Primeiro Nome</Label>
                        <Input
                            id="first_name"
                            name="first_name"
                            value={formData.first_name || ""}
                            onChange={(e) => onChange("first_name", e.target.value)}
                            placeholder="Seu nome"
                            className="h-12 border-border focus:border-primary transition-all"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="last_name">Sobrenome</Label>
                        <Input
                            id="last_name"
                            name="last_name"
                            value={formData.last_name || ""}
                            onChange={(e) => onChange("last_name", e.target.value)}
                            placeholder="Seu sobrenome"
                            className="h-12 border-border focus:border-primary transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <Label htmlFor="username">Identificador (Username)</Label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-muted-foreground text-sm">@</span>
                        <Input
                            id="username"
                            name="username"
                            value={formData.username}
                            disabled
                            className="pl-10 h-12 bg-muted/20 border-border text-sm opacity-70 cursor-not-allowed"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        O identificador de autor é imutável após a criação da conta.
                    </p>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <Label htmlFor="bio">Biografia (Narrativa Curta)</Label>
                        <span className="text-xs text-muted-foreground">
                            {(formData.bio || "").length} / 160
                        </span>
                    </div>
                    <Textarea
                        id="bio"
                        name="bio"
                        rows={4}
                        value={formData.bio || ""}
                        onChange={(e) => onChange("bio", e.target.value)}
                        placeholder="Conte sua história em poucas palavras..."
                        maxLength={160}
                        className="resize-none border-border focus:border-primary transition-all text-sm leading-relaxed"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
