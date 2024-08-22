import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { cn } from '@/lib/utils'
import { AlignCenter, AlignLeft, AlignRight, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ImageComponent({ node, updateAttributes, deleteNode, selected, editor }: NodeViewProps) {
    const { src, alt, width, align, ownerId } = node.attrs

    const userStorage = (editor.storage as any)?.userId
    const currentUserId = userStorage?.id
    const isAdmin = userStorage?.isAdmin
    const isAuthor = userStorage?.isAuthor

    // Simplified check: if the editor is editable, the user is authorized (Admin or Author)
    // as per UniversalContentEditor's global logic.
    const canEdit = editor.isEditable

    const handleResize = (e: React.MouseEvent, percentage: string) => {
        e.preventDefault()
        e.stopPropagation()
        updateAttributes({ width: percentage })
    }

    const handleAlign = (e: React.MouseEvent, alignment: 'left' | 'center' | 'right') => {
        e.preventDefault()
        e.stopPropagation()
        updateAttributes({ align: alignment })
    }

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        deleteNode()
    }

    return (
        <NodeViewWrapper className={cn(
            "relative my-6 group",
            "flex",
            align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'
        )}>
            <div
                className={cn(
                    "relative transition-all duration-200",
                    (selected && editor.isEditable) ? "ring-2 ring-primary ring-offset-2 rounded-lg" : ""
                )}
                style={{ width: width || '100%' }}
            >
                {/* Toolbar - pure shadcn style */}
                {selected && canEdit && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1 bg-background border rounded-lg animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center border-r border-border pr-1 mr-1">
                            {['25%', '50%', '75%', '100%'].map((size) => (
                                <Button
                                    key={size}
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "h-7 px-2 text-[10px] font-bold",
                                        width === size && "bg-muted text-primary"
                                    )}
                                    onClick={(e) => handleResize(e, size)}
                                >
                                    {size}
                                </Button>
                            ))}
                        </div>

                        <div className="flex items-center gap-1 border-r border-border pr-1 mr-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-7 w-7", align === 'left' && "bg-muted text-primary")}
                                onClick={(e) => handleAlign(e, 'left')}
                            >
                                <AlignLeft className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-7 w-7", align === 'center' && "bg-muted text-primary")}
                                onClick={(e) => handleAlign(e, 'center')}
                            >
                                <AlignCenter className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-7 w-7", align === 'right' && "bg-muted text-primary")}
                                onClick={(e) => handleAlign(e, 'right')}
                            >
                                <AlignRight className="w-3.5 h-3.5" />
                            </Button>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={handleDelete}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                )}

                <img
                    src={src}
                    alt={alt}
                    className={cn(
                        "rounded-lg w-full", // Removed shadow-sm
                        !canEdit && "pointer-events-none select-none"
                    )}
                />

                {editor.isEditable && canEdit && (
                    <input
                        className="absolute bottom-2 left-2 right-2 bg-black/40 text-white text-[10px] p-1.5 rounded border-none text-center opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 placeholder:text-white/60 focus:outline-none"
                        value={alt || ''}
                        onChange={(e) => updateAttributes({ alt: e.target.value })}
                        placeholder="Legenda da imagem..."
                    />
                )}
            </div>
        </NodeViewWrapper>
    )
}
