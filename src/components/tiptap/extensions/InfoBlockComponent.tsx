import { useState, useEffect } from 'react'
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react'
import { cn } from '@/lib/utils'
import { AlignCenter, AlignLeft, AlignRight, Trash2, Bold, Italic, Underline as UnderlineIcon, Strikethrough } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function InfoBlockComponent({ node, updateAttributes, deleteNode, selected, editor, getPos }: NodeViewProps) {
    const { align } = node.attrs
    const [isFocused, setIsFocused] = useState(false)

    useEffect(() => {
        const updateVisibility = () => {
            const { from, to } = editor.state.selection
            const pos = getPos()
            const nodeSize = node.nodeSize
            // Show if node is selected OR if selection is inside this specific node
            setIsFocused(selected || (from >= pos && to <= pos + nodeSize))
        }

        editor.on('selectionUpdate', updateVisibility)
        updateVisibility() // Initial check
        return () => {
            editor.off('selectionUpdate', updateVisibility)
        }
    }, [editor, getPos, node.nodeSize, selected])

    const handleAlign = (alignment: 'left' | 'center' | 'right') => {
        updateAttributes({ align: alignment })
    }

    const toggleFormat = (format: string) => {
        if (format === 'bold') editor.chain().focus().toggleBold().run()
        if (format === 'italic') editor.chain().focus().toggleItalic().run()
        if (format === 'underline') editor.chain().focus().toggleUnderline().run()
        if (format === 'strike') editor.chain().focus().toggleStrike().run()
    }

    return (
        <NodeViewWrapper className={cn(
            "relative my-8 group flex transition-all duration-300",
            align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'
        )}>
            <div
                className={cn(
                    "relative info-block bg-[#484DB5] text-white p-4 rounded-2xl leading-relaxed text-sm transition-all duration-300 w-1/2",
                    selected && "ring-2 ring-primary ring-offset-2"
                )}
            >
                {/* Unified Toolbar - Centered fixed on top of the card's inner div */}
                {isFocused && editor.isEditable && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1 p-1 bg-background text-foreground border rounded-lg shadow-md animate-in fade-in zoom-in duration-200 whitespace-nowrap">
                        {/* Text Formatting Group */}
                        <div className="flex items-center gap-1 border-r border-border pr-1 mr-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-7 w-7 transition-colors",
                                    editor.isActive('bold') ? "bg-muted text-primary" : "text-foreground"
                                )}
                                onClick={() => toggleFormat('bold')}
                                title="Negrito"
                            >
                                <Bold className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-7 w-7 transition-colors",
                                    editor.isActive('italic') ? "bg-muted text-primary" : "text-foreground"
                                )}
                                onClick={() => toggleFormat('italic')}
                                title="Itálico"
                            >
                                <Italic className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-7 w-7 transition-colors",
                                    editor.isActive('underline') ? "bg-muted text-primary" : "text-foreground"
                                )}
                                onClick={() => toggleFormat('underline')}
                                title="Sublinhado"
                            >
                                <UnderlineIcon className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-7 w-7 transition-colors",
                                    editor.isActive('strike') ? "bg-muted text-primary" : "text-foreground"
                                )}
                                onClick={() => toggleFormat('strike')}
                                title="Riscado"
                            >
                                <Strikethrough className="w-3.5 h-3.5" />
                            </Button>
                        </div>

                        {/* Alignment Group */}
                        <div className="flex items-center gap-1 border-r border-border pr-1 mr-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-7 w-7 transition-colors",
                                    align === 'left' ? "bg-muted text-primary" : "text-foreground"
                                )}
                                onClick={() => handleAlign('left')}
                                title="Alinhar à Esquerda"
                            >
                                <AlignLeft className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-7 w-7 transition-colors",
                                    align === 'center' ? "bg-muted text-primary" : "text-foreground"
                                )}
                                onClick={() => handleAlign('center')}
                                title="Centralizar"
                            >
                                <AlignCenter className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-7 w-7 transition-colors",
                                    align === 'right' ? "bg-muted text-primary" : "text-foreground"
                                )}
                                onClick={() => handleAlign('right')}
                                title="Alinhar à Direita"
                            >
                                <AlignRight className="w-3.5 h-3.5" />
                            </Button>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                            onClick={deleteNode}
                            title="Remover Bloco"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                )}

                <NodeViewContent />
            </div>
        </NodeViewWrapper>
    )
}
