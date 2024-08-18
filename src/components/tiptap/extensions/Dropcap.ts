import { Mark, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        dropcap: {
            toggleDropcap: () => ReturnType,
        }
    }
}

export const Dropcap = Mark.create({
    name: 'dropcap',

    addOptions() {
        return {
            HTMLAttributes: {
                class: 'dropcap',
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'span',
                getAttrs: element => (element as HTMLElement).classList.contains('dropcap') && null,
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
    },

    addCommands() {
        return {
            toggleDropcap: () => ({ commands }) => {
                return commands.toggleMark(this.name)
            },
        }
    },
})
