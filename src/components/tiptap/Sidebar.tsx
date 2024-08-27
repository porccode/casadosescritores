'use client'

import { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    Bold, Italic, Underline, Heading2, Quote,
    List, ListOrdered, Image as ImageIcon, Video, Info,
    Type as TypeIcon, Feather as VerseIcon, Link as LinkIcon,
    AlignLeft, AlignCenter, AlignRight, Eraser,
    Palette, Highlighter, Plus,
    Heading1, Heading3, Heading4, Heading5, Heading6
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React, { useState } from 'react'

interface SidebarProps {
    editor: Editor | null
    onImageUpload?: () => void
    onVideoInsert?: () => void
    onInfoBlockInsert?: () => void
    selectionTrigger?: number
    className?: string
}

const PRESET_COLORS = [
    '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef',
    '#64748b', '#78350f', '#064e3b', '#1e3a8a', '#4c1d95', '#fbbf24', '#f87171', '#34d399', '#60a5fa', '#a78bfa'
]

const PRESET_HIGHLIGHTS = [
    '#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#fed7aa', '#e9d5ff', '#ddd6fe', '#f5d0fe', '#f1f5f9', '#ffedd5'
]

const ToolButton = ({
    active,
    onClick,
    icon: Icon,
    title,
    className
}: {
    active?: boolean,
    onClick: () => void,
    icon: any,
    title: string,
    className?: string
}) => (
    <Button
        variant="ghost"
        size="icon"
        className={cn(
            "h-10 w-10 transition-all",
            active ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted/30 hover:bg-muted/80 text-foreground",
            className
        )}
        onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick();
        }}
        title={title}
    >
        <Icon className="h-5 w-5" strokeWidth={2} />
    </Button>
)

const CategoryButton = React.forwardRef<HTMLButtonElement, { icon: any, label: string, active?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ icon: Icon, label, active, ...props }, ref) => (
        <Button
            ref={ref}
            variant="ghost"
            size="icon"
            className={cn(
                "h-12 w-12 rounded-xl transition-all border border-transparent hover:border-border",
                active ? "bg-primary/10 border-primary/20 text-primary shadow-sm" : "hover:bg-muted text-muted-foreground"
            )}
            {...props}
        >
            <Icon size={22} strokeWidth={2.5} />
            <span className="sr-only">{label}</span>
        </Button>
    )
)
CategoryButton.displayName = 'CategoryButton'

export default function Sidebar({ editor, onImageUpload, onVideoInsert, onInfoBlockInsert, className }: SidebarProps) {
    const [linkUrl, setLinkUrl] = useState('')
    const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false)
    const [customColor, setCustomColor] = useState('#000000')

    if (!editor) return null

    const handleLinkConfirm = () => {
        if (!editor) return

        let url = linkUrl
        if (url && !url.startsWith('http')) {
            url = `https://${url}`
        }

        if (url) {
            editor.chain().focus().setLink({ href: url }).run()
        } else {
            editor.chain().focus().unsetLink().run()
        }
        setLinkUrl('')
        setIsLinkPopoverOpen(false)
    }

    return (
        <Card className={cn("bg-background border border-border shadow-none rounded-xl w-full", className)}>
            <CardContent className="p-2 flex flex-row items-center justify-between gap-1 overflow-visible">
                {/* 1. TEXTO */}
                <Popover>
                    <PopoverTrigger asChild>
                        <CategoryButton icon={TypeIcon} label="Texto" active={
                            editor.isActive('bold') || editor.isActive('italic') || editor.isActive('underline') || editor.isActive('verse') || editor.isActive('blockquote')
                        } />
                    </PopoverTrigger>
                    <PopoverContent side="left" align="start" sideOffset={16} className="w-56 p-3 shadow-xl border border-border rounded-xl z-[100]">
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-muted-foreground px-1">Texto</h4>
                            <div className="grid grid-cols-4 gap-1.5">
                                <ToolButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} icon={Bold} title="Negrito" />
                                <ToolButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} icon={Italic} title="Itálico" />
                                <ToolButton active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} icon={Underline} title="Sublinhado" />
                                <ToolButton active={editor.isActive('verse')} onClick={() => editor.chain().focus().toggleVerse().run()} icon={VerseIcon} title="Verso" />
                                <ToolButton active={editor.isActive('dropcap')} onClick={() => editor.chain().focus().toggleDropcap().run()} icon={TypeIcon} title="Capitular" />
                                <ToolButton active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} icon={Quote} title="Citação" />
                                <ToolButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} icon={Eraser} title="Limpar tudo" className="bg-destructive/5 text-destructive hover:bg-destructive/10" />
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* 2. TÍTULOS */}
                <Popover>
                    <PopoverTrigger asChild>
                        <CategoryButton icon={Heading2} label="Títulos" active={editor.isActive('heading')} />
                    </PopoverTrigger>
                    <PopoverContent side="left" align="start" sideOffset={16} className="w-48 p-3 shadow-xl border border-border rounded-xl z-[100]">
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-muted-foreground px-1">Títulos</h4>
                            <div className="grid grid-cols-3 gap-1.5">
                                <ToolButton active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} icon={Heading1} title="H1" />
                                <ToolButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} icon={Heading2} title="H2" />
                                <ToolButton active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} icon={Heading3} title="H3" />
                                <ToolButton active={editor.isActive('heading', { level: 4 })} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} icon={Heading4} title="H4" />
                                <ToolButton active={editor.isActive('heading', { level: 5 })} onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()} icon={Heading5} title="H5" />
                                <ToolButton active={editor.isActive('heading', { level: 6 })} onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()} icon={Heading6} title="H6" />
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* 3. ORGANIZAÇÃO */}
                <Popover>
                    <PopoverTrigger asChild>
                        <CategoryButton icon={List} label="Organização" active={editor.isActive('bulletList') || editor.isActive('orderedList')} />
                    </PopoverTrigger>
                    <PopoverContent side="left" align="start" sideOffset={16} className="w-48 p-3 shadow-xl border border-border rounded-xl z-[100]">
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-muted-foreground px-1">Organização</h4>
                            <div className="grid grid-cols-3 gap-1.5">
                                <ToolButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} icon={List} title="Lista" />
                                <ToolButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} icon={ListOrdered} title="Lista Numerada" />
                                <ToolButton active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} icon={AlignLeft} title="Esquerda" />
                                <ToolButton active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} icon={AlignCenter} title="Centro" />
                                <ToolButton active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} icon={AlignRight} title="Direita" />
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* 4. INSERIR */}
                <Popover>
                    <PopoverTrigger asChild>
                        <CategoryButton icon={Plus} label="Inserir" active={editor.isActive('link') || editor.isActive('infoBlock')} />
                    </PopoverTrigger>
                    <PopoverContent side="left" align="start" sideOffset={16} className="w-56 p-3 shadow-xl border border-border rounded-xl z-[100]">
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-muted-foreground px-1">Inserir</h4>
                            <div className="grid grid-cols-4 gap-1.5 mb-2">
                                <ToolButton active={editor.isActive('link')} onClick={() => setIsLinkPopoverOpen(!isLinkPopoverOpen)} icon={LinkIcon} title="Link" />
                                <ToolButton onClick={onImageUpload || (() => { })} icon={ImageIcon} title="Imagem" />
                                <ToolButton onClick={onVideoInsert || (() => { })} icon={Video} title="Vídeo" />
                                <ToolButton active={editor.isActive('infoBlock')} onClick={onInfoBlockInsert || (() => { })} icon={Info} title="Bloco Info" />
                            </div>

                            {isLinkPopoverOpen && (
                                <div className="space-y-2 pt-2 border-t border-border">
                                    <Label className="text-xs font-medium text-muted-foreground">URL do Link</Label>
                                    <div className="flex gap-1.5">
                                        <Input
                                            placeholder="https://..."
                                            value={linkUrl}
                                            onChange={(e) => setLinkUrl(e.target.value)}
                                            className="h-8 text-[11px] bg-muted/20 border-border"
                                            onKeyDown={(e) => e.key === 'Enter' && handleLinkConfirm()}
                                            autoFocus
                                        />
                                        <Button size="sm" className="h-8 px-3 text-xs font-bold" onClick={handleLinkConfirm}>OK</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* 5. ESTILO */}
                <Popover>
                    <PopoverTrigger asChild>
                        <CategoryButton icon={Palette} label="Estilo" />
                    </PopoverTrigger>
                    <PopoverContent side="left" align="start" sideOffset={16} className="w-60 p-4 shadow-xl border border-border rounded-xl z-[100]">
                        <div className="space-y-4">
                            <div className="space-y-2.5">
                                <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                                    <Palette size={14} className="opacity-70" />
                                    Cor do Texto
                                </h4>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {PRESET_COLORS.map(color => (
                                        <button
                                            key={color}
                                            className="w-8 h-8 rounded-lg border border-border transition-all hover:scale-110 active:scale-95"
                                            style={{ backgroundColor: color }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                editor.chain().focus().setColor(color).run();
                                            }}
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-2 items-center pt-2">
                                    <Input
                                        type="color"
                                        value={customColor}
                                        onChange={(e) => setCustomColor(e.target.value)}
                                        className="w-10 h-8 p-0 border-none bg-transparent cursor-pointer"
                                    />
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-8 text-xs flex-1"
                                        onClick={() => editor.chain().focus().setColor(customColor).run()}
                                    >
                                        Personalizada
                                    </Button>
                                </div>
                            </div>

                            <div className="h-[1px] w-full bg-border" />

                            <div className="space-y-2.5">
                                <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                                    <Highlighter size={14} className="opacity-70" />
                                    Destaque
                                </h4>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {PRESET_HIGHLIGHTS.map(color => (
                                        <button
                                            key={color}
                                            className="w-8 h-8 rounded-lg border border-border transition-all hover:scale-110 active:scale-95"
                                            style={{ backgroundColor: color }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                editor.chain().focus().setHighlight({ color }).run();
                                            }}
                                        />
                                    ))}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full h-8 text-[10px] text-destructive hover:bg-destructive/10 font-bold uppercase tracking-tight"
                                    onClick={() => editor.chain().focus().unsetHighlight().run()}
                                >
                                    Remover Destaque
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </CardContent>
        </Card>
    )
}
