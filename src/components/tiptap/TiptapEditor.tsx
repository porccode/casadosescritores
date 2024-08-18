'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { CustomYoutube } from './extensions/YoutubeExtension'
import CharacterCount from '@tiptap/extension-character-count'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { InfoBlock } from './extensions/InfoBlock'
import { CustomImage } from './extensions/ImageExtension'
import BubbleMenu from './BubbleMenu'
import BubbleMenuExtension from '@tiptap/extension-bubble-menu'
import Typography from '@tiptap/extension-typography'
import { Dropcap } from './extensions/Dropcap'
import { Verse } from './extensions/Verse'
import { PreventConsecutiveEmptyParagraphs } from './extensions/PreventConsecutiveEmptyParagraphs'
import { cn } from '@/lib/utils'
import { lexicalToHtml } from '@/lib/lexical-converter'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface TiptapEditorProps {
    content?: any
    onChange?: (content: any) => void
    editable?: boolean
    onEditorReady?: (editor: any) => void
    userId?: string
    isAdmin?: boolean
    isAuthor?: boolean
}

export default function TiptapEditor({ content, onChange, editable = true, onEditorReady, userId, isAdmin, isAuthor }: TiptapEditorProps) {
    const isInitialLoadRef = useRef(false)
    const [hasMounted, setHasMounted] = useState(false)

    useEffect(() => {
        setHasMounted(true)
    }, [])

    // Pré-processa o conteúdo: se for uma string JSON, transforma em objeto AGORA.
    // Isso evita que o Tiptap tente renderizar a string bruta no primeiro frame.
    const initialContent = useMemo(() => {
        console.log("[TiptapEditor] initialContent useMemo. content type:", typeof content, "length:", content?.length);
        if (!content) return "";

        // Se for uma string que parece JSON
        if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
            try {
                const parsed = JSON.parse(content);
                // Se for formato Lexical (root, editorState ou Array), converte para HTML
                if (parsed && (parsed.root || parsed.editorState || Array.isArray(parsed))) {
                    console.log("[TiptapEditor] Detectado formato Lexical, convertendo...");
                    const converted = lexicalToHtml(parsed);
                    console.log("[TiptapEditor] Converted HTML length:", converted.length);
                    return converted;
                }
                return parsed;
            } catch (e) {
                console.error("[TiptapEditor] Error parsing JSON content:", e);
                return content;
            }
        }

        // Se já for um objeto com root/editorState ou Array (Lexical JSON direto)
        if (content && typeof content === 'object' && (content.root || content.editorState || Array.isArray(content))) {
            console.log("[TiptapEditor] Detectado objeto Lexical, convertendo...");
            return lexicalToHtml(content);
        }

        return content;
    }, [content])

    const editor = useEditor({
        editable,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4, 5, 6],
                },
            }),
            Placeholder.configure({
                placeholder: 'Escreva seu capítulo aqui...',
                emptyEditorClass: 'is-editor-empty',
            }),
            CharacterCount,
            Underline,
            TextStyle.configure(),
            Color.configure(),
            Highlight.configure({
                multicolor: true,
            }),
            Link.configure({
                openOnClick: false,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph', 'verse'],
            }),
            CustomImage,
            CustomYoutube.configure({
                controls: false,
                nocookie: true,
            }),
            InfoBlock,
            Typography.configure({
                // Desabilita regras que podem interferir com espaços
                oneHalf: false,
                oneQuarter: false,
                threeQuarters: false,
                // As outras regras usarão os valores padrão (omitidas = ativas)
            }),
            Dropcap,
            Verse,
            PreventConsecutiveEmptyParagraphs,
            BubbleMenuExtension.configure({
                pluginKey: 'bubbleMenu',
            }),
        ],
        content: initialContent,
        editorProps: {
            attributes: {
                class: 'prose prose-lg dark:prose-invert focus:outline-none max-w-none min-h-[500px] prose-img:my-0',
                spellcheck: 'true',
            },
            // Garante que ao colar texto puro, as quebras de linha sejam convertidas em parágrafos
            transformPastedText(text) {
                return text.split(/\n+/).map(para => para.trim()).filter(p => p.length > 0).join('\n\n');
            },
        },
        onUpdate: ({ editor }) => {
            // Return JSON object as the new source of truth
            onChange?.(editor.getJSON())
        },
        onSelectionUpdate: ({ editor }) => {
            // Trigger selection update for parenting components
            (editor.storage as any).selectionTrigger = Date.now()
            onEditorReady?.(editor)
        },
        onCreate: ({ editor }) => {
            // Inject userId into storage for extensions to access
            (editor.storage as any).userId = { id: userId, isAdmin, isAuthor }
            onEditorReady?.(editor)
        },
        immediatelyRender: false,
    })

    // Update content if it changes externally (like after a sanitize save)
    useEffect(() => {
        if (editor && content) {
            try {
                const currentContentStr = JSON.stringify(editor.getJSON());
                const newContentStr = typeof content === 'string' ? content : JSON.stringify(content);

                // Só força a sobreposição se o conteúdo processado vindo de fora for realmente diferente do que o editor tem hoje
                // Isso previne loops infinitos e garante que sanitizações aplicadas no handleSubmit (como remover parágrafos fantasma) reflitam na tela.
                if (currentContentStr !== newContentStr && currentContentStr !== JSON.stringify(lexicalToHtml(content))) {
                    console.log("[TiptapEditor] Exteral content changed significantly, visually updating editor.");
                    if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
                        const parsed = JSON.parse(content);
                        if (parsed && (parsed.root || parsed.editorState || Array.isArray(parsed))) {
                            editor.commands.setContent(lexicalToHtml(parsed));
                        } else {
                            editor.commands.setContent(parsed);
                        }
                    } else if (content && typeof content === 'object' && (content.root || content.editorState || Array.isArray(content))) {
                        editor.commands.setContent(lexicalToHtml(content));
                    } else {
                        editor.commands.setContent(content);
                    }
                }
            } catch (e) {
                // Ignore parse errors on check
            }
        }
    }, [content, editor]);

    // Verify and start editor
    useEffect(() => {
        if (editor) {
             
            (editor.storage as any).userId = { id: userId, isAdmin, isAuthor }

            // NUCLEAR OPTION: Force browser attributes directly on the DOM
            // This bypasses React/Tiptap prop merging quirks
            const dom = editor.view.dom;
            if (dom) {
                // Ensure spellcheck is explicitly ON
                dom.setAttribute('spellcheck', 'true');

                // Removing explicit lang/translate to allow browser defaults to handle detection
                // dom.setAttribute('lang', 'pt-BR');
                // dom.setAttribute('translate', 'no'); 
            }
        }
    }, [editor, userId, isAdmin, isAuthor])

    if (!hasMounted || !editor) {
        return (
            <div className="w-full space-y-4 animate-pulse pt-4">
                <Skeleton className="h-8 w-[60%] bg-muted/20" />
                <Skeleton className="h-32 w-full bg-muted/10" />
                <Skeleton className="h-32 w-full bg-muted/10" />
            </div>
        )
    }

    const isEmpty = editor.isEmpty;

    return (
        <div className="w-full relative group/editor">
            <BubbleMenu editor={editor} />
            <EditorContent editor={editor} className="animate-in fade-in duration-700" />

            {isEmpty && editable && (
                <div className="absolute top-0 left-0 w-full flex items-center gap-4 px-0 cursor-text pointer-events-none animate-in fade-in slide-in-from-left-2 duration-700">
                    <span className="text-muted-foreground/30 italic text-lg leading-relaxed">
                        Clique aqui para começar a escrever...
                    </span>

                </div>
            )}
        </div>
    )
}
