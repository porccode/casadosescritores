"use client";

import { Loader2, Save } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminUser } from "@/types/admin";

interface EditUserDialogProps {
    user: AdminUser | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUserChange: (user: AdminUser) => void;
    onSave: (user: AdminUser) => void;
    saving: boolean;
}

/**
 * EditUserDialog Component.
 * Unified modal for editing user profile details from the admin panel.
 */
export function EditUserDialog({
    user,
    open,
    onOpenChange,
    onUserChange,
    onSave,
    saving
}: EditUserDialogProps) {
    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md border-border shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        Editar Registro
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Username
                        </label>
                        <Input
                            value={user.username || ""}
                            onChange={(e) => onUserChange({ ...user, username: e.target.value })}
                            className="h-10 border-border"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Nome
                            </label>
                            <Input
                                value={user.first_name || ""}
                                onChange={(e) => onUserChange({ ...user, first_name: e.target.value })}
                                className="h-10 border-border"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Sobrenome
                            </label>
                            <Input
                                value={user.last_name || ""}
                                onChange={(e) => onUserChange({ ...user, last_name: e.target.value })}
                                className="h-10 border-border"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Email de Registro
                        </label>
                        <Input
                            value={user.email}
                            onChange={(e) => onUserChange({ ...user, email: e.target.value })}
                            className="h-10 border-border font-mono text-sm"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t border-border">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-10 px-6">
                            Cancelar
                        </Button>
                        <Button onClick={() => onSave(user)} disabled={saving} className="h-10 px-8">
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Salvar Alterações
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
