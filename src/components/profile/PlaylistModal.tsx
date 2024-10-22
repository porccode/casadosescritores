"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

interface PlaylistModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: { name: string; description: string; is_public: boolean }) => Promise<void>;
    initialData?: {
        name?: string;
        description?: string;
        is_public?: boolean;
    };
    isEditing?: boolean;
}

export default function PlaylistModal({
    open,
    onOpenChange,
    onSave,
    initialData,
    isEditing = false
}: PlaylistModalProps) {
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [isPublic, setIsPublic] = useState(initialData?.is_public || false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            await onSave({
                name: name.trim(),
                description: description.trim(),
                is_public: isPublic
            });
            onOpenChange(false);
            // Reset form if creating new
            if (!isEditing) {
                setName("");
                setDescription("");
                setIsPublic(false);
            }
        } catch (error) {
            console.error("Error saving playlist:", error);
        } finally {
            setLoading(false);
        }
    };

    // Reset form when modal opens with initial data
    React.useEffect(() => {
        if (open && initialData) {
            setName(initialData.name || "");
            setDescription(initialData.description || "");
            setIsPublic(initialData.is_public || false);
        } else if (open && !initialData) {
            setName("");
            setDescription("");
            setIsPublic(false);
        }
    }, [open, initialData]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing ? "Editar Playlist" : "Nova Playlist"}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? "Altere os dados da sua playlist."
                                : "Crie uma nova playlist para organizar suas leituras."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Minha playlist favorita"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Descrição (opcional)</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                onKeyDown={(e) => e.stopPropagation()}
                                placeholder="Uma breve descrição da playlist..."
                                rows={3}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="public">Tornar pública</Label>
                                <p className="text-xs text-muted-foreground">
                                    Playlists públicas aparecem no seu perfil
                                </p>
                            </div>
                            <Switch
                                id="public"
                                checked={isPublic}
                                onCheckedChange={setIsPublic}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading || !name.trim()}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? "Salvar" : "Criar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
