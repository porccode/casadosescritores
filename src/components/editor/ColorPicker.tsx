"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const COLORS = [
    { name: "Preto", color: "#000000" },
    { name: "Cinza", color: "#666666" },
    { name: "Vermelho", color: "#e11d48" },
    { name: "Laranja", color: "#f97316" },
    { name: "Verde", color: "#10b981" },
    { name: "Azul", color: "#3b82f6" },
    { name: "Roxo", color: "#8b5cf6" },
];

interface ColorPickerProps {
    onSelect: (color: string) => void;
    onClear: () => void;
}

export function ColorPicker({ onSelect, onClear }: ColorPickerProps) {
    return (
        <div className="p-2">
            <div className="grid grid-cols-4 gap-1 mb-2">
                {COLORS.map(({ name, color }) => (
                    <button
                        key={color}
                        type="button"
                        className="w-6 h-6 rounded-full border border-border hover:scale-110 transition-transform shadow-sm"
                        style={{ backgroundColor: color }}
                        title={name}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            onSelect(color);
                        }}
                    />
                ))}
            </div>
            <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-[10px] gap-1"
                onMouseDown={(e) => {
                    e.preventDefault();
                    onClear();
                }}
            >
                <X size={10} /> Limpar cor
            </Button>
        </div>
    );
}
