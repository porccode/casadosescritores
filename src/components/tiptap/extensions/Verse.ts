import { Node, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        verse: {
            toggleVerse: () => ReturnType,
        }
    }
}

export const Verse = Node.create({
    name: 'verse',

    group: 'block',

    content: 'inline*',

    parseHTML() {
        return [
            {
                tag: 'pre',
                getAttrs: element => (element as HTMLElement).classList.contains('verse') && null,
            },
            {
                tag: 'div',
                getAttrs: element => (element as HTMLElement).classList.contains('verse') && null,
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { class: 'verse' }), 0]
    },

    addCommands() {
        return {
            toggleVerse: () => ({ commands }) => {
                return commands.toggleNode(this.name, 'paragraph')
            },
        }
    },

    addKeyboardShortcuts() {
        return {
            Enter: () => {
                const { state } = this.editor
                const { selection } = state
                const { $from, empty } = selection

                if (!empty || $from.parent.type.name !== this.name) {
                    return false
                }

                const isEndOfNode = $from.parentOffset === $from.parent.content.size
                const isDoubleEnter = $from.parent.textContent.endsWith('\n')

                if (isEndOfNode && isDoubleEnter) {
                    return this.editor.chain()
                        .command(({ tr }) => {
                            const text = $from.parent.textContent
                            tr.insertText('', $from.pos - 1, $from.pos)
                            return true
                        })
                        .exitCode()
                        .setNode('paragraph')
                        .run()
                }

                // Default behavior for verse: insert a hard break
                return this.editor.commands.setHardBreak()
            },
        }
    },
})
