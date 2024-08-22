import Image from '@tiptap/extension-image'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import ImageComponent from './ImageComponent'

export const CustomImage = Image.extend({
    inline: false,
    group: 'block',
    draggable: true,
    selectable: true,
    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: '50%',
                renderHTML: attributes => ({
                    style: `width: ${attributes.width}`,
                    width: attributes.width
                }),
            },
            align: {
                default: 'center',
                renderHTML: attributes => ({
                    'data-align': attributes.align
                })
            },
            ownerId: {
                default: null,
                renderHTML: attributes => ({
                    'data-owner-id': attributes.ownerId
                })
            }
        }
    },

    addNodeView() {
        return ReactNodeViewRenderer(ImageComponent)
    },

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('imageSecurity'),
                filterTransaction: (tr, state) => {
                    // Constant: Admins can always edit everything
                    const userStorage = (this.editor.storage as any)?.userId
                    if (userStorage?.isAdmin) return true

                    // If the document didn't change, it's fine
                    if (!tr.docChanged) return true

                    const currentUserId = userStorage?.id
                    const isAuthor = userStorage?.isAuthor
                    const isAdmin = userStorage?.isAdmin

                    let isForbidden = false

                    // Safe iteration over transaction steps
                    tr.steps.forEach((step: any) => {
                        // Validate range properties before using them
                        if (typeof step.from !== 'number' || typeof step.to !== 'number') return

                        // Ensure we are within the bounds of the PREVIOUS document state
                        // as steps in filterTransaction are relative to the state before the transaction
                        const docSize = state.doc.content.size
                        const safeFrom = Math.max(0, Math.min(step.from, docSize))
                        const safeTo = Math.max(0, Math.min(step.to, docSize))

                        try {
                            state.doc.nodesBetween(safeFrom, safeTo, (node) => {
                                if (node.type.name === 'image') {
                                    const { ownerId } = node.attrs

                                    // Permission Logic:
                                    // 1. Owner can edit
                                    // 2. If it has no owner, Authors and Admins can edit
                                    const canEdit = ownerId === currentUserId || (ownerId === null && (isAuthor || isAdmin)) || isAdmin

                                    if (!canEdit) {
                                        isForbidden = true
                                    }
                                }
                                return !isForbidden
                            })
                        } catch (error) {
                            // If nodesBetween fails for some reason, we fail safe (forbid)
                            console.error('Image Security Check Error:', error)
                            isForbidden = true
                        }
                    })

                    return !isForbidden
                },
            }),
        ]
    },
})
