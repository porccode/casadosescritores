"use client";

import { useState, useEffect } from "react";
import { Save, ChevronRight, PanelTop, Layers, Newspaper } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { Database } from "@/types/database.types";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Announcement = Database["public"]["Tables"]["announcements"]["Row"];
type AnnouncementInsert = Database["public"]["Tables"]["announcements"]["Insert"];

interface AnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    announcement?: Announcement | null;
}

const TYPES = [
    {
        value: "short",
        label: "Barra Superior",
        description: "Faixa fina acima do menu principal.",
        icon: PanelTop,
        color: "bg-primary/10 text-primary border-primary/20",
    },
    {
        value: "long",
        label: "Banner de Destaque",
        description: "Banner encorpado entre o menu e o conteúdo.",
        icon: Layers,
        color: "bg-amber-500/10 text-amber-700 border-amber-400/20",
    },
];

export default function AnnouncementModal({
    isOpen,
    onClose,
    onSuccess,
    announcement,
}: AnnouncementModalProps) {
    const supabase = createBrowserClient();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<AnnouncementInsert>({
        title: "",
        message: "",
        background_color: "#494EB6",
        text_color: "#ffffff",
        link_url: "",
        link_label: "",
        button_bg_color: "#ffffff",
        button_text_color: "#494EB6",
        start_date: new Date().toISOString().slice(0, 16),
        is_active: true,
        type: "short",
    });

    useEffect(() => {
        if (announcement && announcement.title) {
            // Editing an existing full announcement
            setFormData({
                ...announcement,
                start_date: safeDate(announcement.start_date),
                end_date: announcement.end_date ? safeDate(announcement.end_date) : undefined,
                type: announcement.type || "short",
                background_color: announcement.background_color || "#494EB6",
                text_color: announcement.text_color || "#ffffff",
                button_bg_color: announcement.button_bg_color || "#ffffff",
                button_text_color: announcement.button_text_color || "#494EB6",
            });
        } else {
            // New announcement — may have a pre-seeded type (e.g. 'long')
            const preType = announcement?.type || "short";
            setFormData({
                title: "",
                message: "",
                background_color: "#494EB6",
                text_color: "#ffffff",
                link_url: "",
                link_label: "",
                button_bg_color: "#ffffff",
                button_text_color: "#494EB6",
                start_date: new Date().toISOString().slice(0, 16),
                is_active: true,
                type: preType,
            });
        }
    }, [announcement, isOpen]);

    function safeDate(d: string) {
        try { return new Date(d).toISOString().slice(0, 16); } catch { return ""; }
    }

    const set = (key: keyof AnnouncementInsert, value: any) =>
        setFormData((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { id, author_id, created_at, ...dataToSave } = {
                ...formData,
                end_date: formData.end_date || null,
            };
            if (announcement?.id) {
                const { error } = await (supabase as any).from("announcements").update(dataToSave).eq("id", announcement.id);
                if (error) throw error;
            } else {
                const { error } = await (supabase as any).from("announcements").insert(dataToSave);
                if (error) throw error;
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Erro ao salvar anúncio:", err);
            alert("Erro ao salvar. Verifique o console.");
        } finally {
            setLoading(false);
        }
    };

    const currentType = formData.type || "short";
    const isMid = currentType === "long";

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{announcement ? "Editar Banner" : "Novo Banner"}</DialogTitle>
                    <DialogDescription>
                        Configure o banner que será exibido para os visitantes.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto -mx-6 px-6">
                    <form onSubmit={handleSubmit} id="announcement-form" className="space-y-5 py-2">

                        {/* Tipo */}
                        <div className="space-y-2">
                            <Label>Tipo de Banner</Label>
                            <div className="grid grid-cols-2 gap-3">
                                {TYPES.map((t) => {
                                    const Icon = t.icon;
                                    const active = currentType === t.value;
                                    return (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() => set("type", t.value)}
                                            className={cn(
                                                "flex items-start gap-3 rounded-lg border p-3 text-left transition-all",
                                                active
                                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                    : "border-border hover:border-muted-foreground/40 hover:bg-muted/40"
                                            )}
                                        >
                                            <div className={cn("p-1.5 rounded-md border mt-0.5 shrink-0", t.color)}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">{t.label}</p>
                                                <p className="text-xs text-muted-foreground leading-snug">{t.description}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Título e Mensagem */}
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="title">Título</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => set("title", e.target.value)}
                                    placeholder={isMid ? "Ex: Grande novidade chegando!" : "Ex: Nova atualização disponível"}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="message">
                                    Mensagem{" "}
                                    {!isMid && <span className="text-[10px] text-muted-foreground">(opcional na barra superior)</span>}
                                </Label>
                                <Textarea
                                    id="message"
                                    value={formData.message || ""}
                                    onChange={(e) => set("message", e.target.value)}
                                    onKeyDown={(e) => e.stopPropagation()}
                                    placeholder="Texto complementar exibido no banner..."
                                    required={isMid}
                                    className={cn("resize-none", isMid ? "min-h-[80px]" : "min-h-[56px]")}
                                />
                            </div>
                        </div>

                        {/* Datas */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="start_date">Início</Label>
                                <Input
                                    id="start_date"
                                    type="datetime-local"
                                    value={formData.start_date}
                                    onChange={(e) => set("start_date", e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="end_date">
                                    Término{" "}
                                    <span className="text-[10px] text-muted-foreground">opcional — permanente se vazio</span>
                                </Label>
                                <Input
                                    id="end_date"
                                    type="datetime-local"
                                    value={formData.end_date || ""}
                                    onChange={(e) => set("end_date", e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Botão / Link */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="link_label">Texto do Botão <span className="text-[10px] text-muted-foreground">opcional</span></Label>
                                <Input
                                    id="link_label"
                                    value={formData.link_label || ""}
                                    onChange={(e) => set("link_label", e.target.value)}
                                    placeholder="Ex: Ver mais"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="link_url">URL do Link <span className="text-[10px] text-muted-foreground">opcional</span></Label>
                                <Input
                                    id="link_url"
                                    type="url"
                                    value={formData.link_url || ""}
                                    onChange={(e) => set("link_url", e.target.value)}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        {/* Cores */}
                        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cores</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {[
                                    { label: "Fundo", field: "background_color" },
                                    { label: "Texto", field: "text_color" },
                                    { label: "Fundo Botão", field: "button_bg_color" },
                                    { label: "Texto Botão", field: "button_text_color" },
                                ].map(({ label, field }) => (
                                    <div key={field} className="space-y-1.5">
                                        <Label className="text-xs">{label}</Label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={(formData as any)[field] || "#000000"}
                                                onChange={(e) => set(field as keyof AnnouncementInsert, e.target.value)}
                                                className="h-8 w-8 cursor-pointer rounded border border-border bg-background p-0.5"
                                            />
                                            <span className="text-[10px] font-mono text-muted-foreground">{(formData as any)[field]}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                            <div>
                                <p className="text-sm font-medium">Ativo</p>
                                <p className="text-xs text-muted-foreground">Visível quando dentro do período configurado.</p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={formData.is_active || false}
                                onClick={() => set("is_active", !formData.is_active)}
                                className={cn(
                                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                                    formData.is_active ? "bg-primary" : "bg-input"
                                )}
                            >
                                <span className={cn(
                                    "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                                    formData.is_active ? "translate-x-6" : "translate-x-1"
                                )} />
                            </button>
                        </div>

                        <Separator />

                        {/* Preview */}
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Pré-visualização</Label>
                            <div className="overflow-hidden rounded-lg border border-dashed">
                                {!isMid ? (
                                    // Slim top bar preview
                                    <div
                                        className="px-3 py-1.5 text-center text-sm font-medium"
                                        style={{
                                            backgroundColor: formData.background_color || "#494EB6",
                                            color: formData.text_color || "#ffffff",
                                        }}
                                    >
                                        <span className="font-bold">{formData.title || "Título do Banner"}</span>
                                        {formData.message && <span className="ml-2 opacity-80 text-xs">{formData.message}</span>}
                                        {formData.link_label && (
                                            <span
                                                className="ml-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold"
                                                style={{
                                                    backgroundColor: formData.button_bg_color || "#ffffff",
                                                    color: formData.button_text_color || "#494EB6",
                                                }}
                                            >
                                                {formData.link_label} →
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    // Mid banner preview
                                    <div
                                        className="px-4 py-4"
                                        style={{
                                            backgroundColor: formData.background_color || "#494EB6",
                                            color: formData.text_color || "#ffffff",
                                        }}
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="font-bold">{formData.title || "Título do Banner"}</p>
                                                {formData.message && <p className="text-sm opacity-90 mt-0.5">{formData.message}</p>}
                                            </div>
                                            {formData.link_label && (
                                                <span
                                                    className="shrink-0 rounded-full px-4 py-1.5 text-xs font-bold"
                                                    style={{
                                                        backgroundColor: formData.button_bg_color || "#ffffff",
                                                        color: formData.button_text_color || "#494EB6",
                                                    }}
                                                >
                                                    {formData.link_label} →
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </form>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t">
                    <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button type="submit" form="announcement-form" disabled={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? "Salvando..." : "Salvar Banner"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
