'use client'

import { Editor } from '@tiptap/react'
import { BubbleMenu as TiptapBubbleMenu } from '@tiptap/react/menus'
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BubbleMenuProps {
    editor: Editor | null
}

export default function BubbleMenu({ editor }: BubbleMenuProps) {
    if (!editor) return null

    return (
        <TiptapBubbleMenu
            editor={editor}
            className="flex items-center gap-1 p-1 bg-background border rounded-lg shadow-md animate-in fade-in zoom-in duration-200"
            shouldShow={({ editor, state }) => {
                // Only show if there's a selection and it's not empty
                if (state.selection.empty) return false

                // Don't show if image, youtube, or infoBlock is selected (they have their own toolbars)
                return !editor.isActive('image') && !editor.isActive('youtube') && !editor.isActive('infoBlock')
            }}
        >
            <div className="flex items-center gap-1">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={cn(
                        "p-1.5 rounded-md hover:bg-muted transition-colors",
                        editor.isActive('bold') ? 'text-primary bg-muted' : 'text-foreground'
                    )}
                    title="Negrito"
                >
                    <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={cn(
                        "p-1.5 rounded-md hover:bg-muted transition-colors",
                        editor.isActive('italic') ? 'text-primary bg-muted' : 'text-foreground'
                    )}
                    title="Itálico"
                >
                    <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={cn(
                        "p-1.5 rounded-md hover:bg-muted transition-colors",
                        editor.isActive('underline') ? 'text-primary bg-muted' : 'text-foreground'
                    )}
                    title="Sublinhado"
                >
                    <UnderlineIcon className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={cn(
                        "p-1.5 rounded-md hover:bg-muted transition-colors",
                        editor.isActive('strike') ? 'text-primary bg-muted' : 'text-foreground'
                    )}
                    title="Riscado"
                >
                    <Strikethrough className="w-3.5 h-3.5" />
                </button>
            </div>
        </TiptapBubbleMenu>
    )
}
