import Youtube from '@tiptap/extension-youtube'
import { ReactNodeViewRenderer } from '@tiptap/react'
import YoutubeComponent from './YoutubeComponent'

export const CustomYoutube = Youtube.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: '100%',
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
        }
    },

    addNodeView() {
        return ReactNodeViewRenderer(YoutubeComponent)
    },
})
