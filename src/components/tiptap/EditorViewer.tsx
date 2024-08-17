'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { CustomImage } from './extensions/ImageExtension'
import { InfoBlock } from './extensions/InfoBlock'
import { Verse } from './extensions/Verse'
import { Dropcap } from './extensions/Dropcap'
import Youtube from '@tiptap/extension-youtube'
import CharacterCount from '@tiptap/extension-character-count'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import { lexicalToHtml } from '@/lib/lexical-converter'
import { useEffect } from 'react'

interface EditorViewerProps {
    content: any
}

export default function EditorViewer({ content }: EditorViewerProps) {
    const editor = useEditor({
        editable: false,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4, 5, 6],
                },
            }),
            CharacterCount,
            Underline,
            TextStyle,
            Color,
            Highlight.configure({
                multicolor: true,
            }),
            Link.configure({
                openOnClick: true,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph', 'verse'],
            }),
            CustomImage,
            Youtube.configure({
                controls: true,
            }),
            InfoBlock,
            Typography.configure({
                // Mesma configuração do editor para consistência
                oneHalf: false,
                oneQuarter: false,
                threeQuarters: false,
                // As outras regras usarão os valores padrão (omitidas = ativas)
            }),
            Verse,
            Dropcap,
        ],
        content: (() => {
            if (!content) return "";
            if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
                try {
                    const parsed = JSON.parse(content);
                    return (parsed && (parsed.root || parsed.editorState || Array.isArray(parsed))) ? lexicalToHtml(parsed) : parsed;
                } catch (e) {
                    return content;
                }
            }
            if (content && typeof content === 'object' && (content.root || content.editorState || Array.isArray(content))) {
                return lexicalToHtml(content);
            }
            return content;
        })(),
        editorProps: {
            attributes: {
                class: 'prose focus:outline-none max-w-none prose-img:my-0 text-inherit leading-inherit',
            },
        },
        immediatelyRender: false,
    })

    useEffect(() => {
        if (editor && content) {
            try {
                if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
                    const parsed = JSON.parse(content)
                    if (parsed && (parsed.root || parsed.editorState || Array.isArray(parsed))) {
                        editor.commands.setContent(lexicalToHtml(parsed))
                    } else {
                        editor.commands.setContent(parsed)
                    }
                } else if (content && typeof content === 'object' && (content.root || content.editorState || Array.isArray(content))) {
                    editor.commands.setContent(lexicalToHtml(content))
                } else {
                    editor.commands.setContent(content)
                }
            } catch (e) {
                editor.commands.setContent(content)
            }
        }
    }, [content, editor])

    if (!editor) {
        return null
    }

    return <EditorContent editor={editor} />
}
