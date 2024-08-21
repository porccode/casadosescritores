import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import InfoBlockComponent from './InfoBlockComponent'

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        infoBlock: {
            toggleInfoBlock: () => ReturnType
        }
    }
}

export const InfoBlock = Node.create({
    name: 'infoBlock',

    group: 'block',

    content: 'block+',

    draggable: true,
    selectable: true,
    isolating: true,

    addAttributes() {
        return {
            align: {
                default: 'center',
                parseHTML: element => element.getAttribute('data-align') || 'center',
                renderHTML: attributes => ({
                    'data-align': attributes.align,
                }),
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div',
                getAttrs: (node) => {
                    if (typeof node === 'string') return false;
                    return (node as HTMLElement).classList.contains('info-block') && null
                },
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(HTMLAttributes, {
                class: 'info-block bg-[#484DB5] text-white p-4 rounded-2xl my-8 leading-relaxed text-sm'
            }),
            0,
        ]
    },

    addNodeView() {
        return ReactNodeViewRenderer(InfoBlockComponent)
    },

    addCommands() {
        return {
            toggleInfoBlock:
                () =>
                    ({ commands }) => {
                        return commands.toggleWrap(this.name)
                    },
        }
    },
})
