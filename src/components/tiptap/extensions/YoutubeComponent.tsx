import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { cn } from '@/lib/utils'
import { AlignCenter, AlignLeft, AlignRight, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

export default function YoutubeComponent({ node, updateAttributes, deleteNode, selected, editor, getPos }: NodeViewProps) {
    const { src, width, align } = node.attrs
    const [isFocused, setIsFocused] = useState(false)

    useEffect(() => {
        const updateVisibility = () => {
            const { from, to } = editor.state.selection
            const pos = getPos()
            const nodeSize = node.nodeSize
            setIsFocused(selected || (from >= pos && to <= pos + nodeSize))
        }

        editor.on('selectionUpdate', updateVisibility)
        updateVisibility()
        return () => {
            editor.off('selectionUpdate', updateVisibility)
        }
    }, [editor, getPos, node.nodeSize, selected])

    const handleResize = (percentage: string) => {
        updateAttributes({ width: percentage })
    }

    const handleAlign = (alignment: 'left' | 'center' | 'right') => {
        updateAttributes({ align: alignment })
    }

    // Helper to ensure the URL is in embed format
    const getEmbedUrl = (url: string) => {
        if (!url) return ''
        if (url.includes('youtube.com/embed/')) return url

        // Simple regex to extract ID
        const videoIdRegex = /(?:v=|\/embed\/|\/1\/|\/v\/|https:\/\/youtu\.be\/|youtube\.com\/v\/|^v=)([^#\&\?\n<>\'\"]*)/;
        const match = url.match(videoIdRegex);

        if (match && match[1].length === 11) {
            return `https://www.youtube.com/embed/${match[1]}?controls=0&rel=0&modestbranding=1`
        }
        return url
    }

    const embedUrl = getEmbedUrl(src)

    return (
        <NodeViewWrapper className={cn(
            "relative my-8 group flex transition-all duration-300",
            align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'
        )}>
            <div
                className={cn(
                    "relative transition-all duration-300",
                    selected ? "ring-2 ring-primary ring-offset-2 rounded-xl" : ""
                )}
                style={{ width: width || '100%' }}
            >
                {/* Unified Toolbar - Centered fixed on top of the card's inner div */}
                {isFocused && editor.isEditable && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1 p-1 bg-background text-foreground border rounded-lg shadow-md animate-in fade-in zoom-in duration-200 whitespace-nowrap">
                        {/* Resize Group */}
                        <div className="flex items-center border-r border-border pr-1 mr-1">
                            {['25%', '50%', '75%', '100%'].map((size) => (
                                <Button
                                    key={size}
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "h-7 px-2 text-[10px] font-bold transition-colors",
                                        width === size ? "bg-muted text-primary" : "text-foreground"
                                    )}
                                    onClick={() => handleResize(size)}
                                >
                                    {size}
                                </Button>
                            ))}
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
                            title="Remover Vídeo"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                )}

                <div className="aspect-video w-full overflow-hidden rounded-xl bg-muted border border-border shadow-sm leading-[0]">
                    <iframe
                        src={embedUrl}
                        className={cn(
                            "w-full h-full border-0",
                            editor.isEditable && "pointer-events-none select-none"
                        )}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            </div>
        </NodeViewWrapper>
    )
}
