import { Extension } from '@tiptap/core'

/**
 * PreventConsecutiveEmptyParagraphs
 * 
 * Esta extensão impede que o usuário crie múltiplos parágrafos vazios consecutivos.
 * Quando o usuário pressiona Enter em um parágrafo vazio, a ação é ignorada.
 * 
 * Benefícios:
 * - WYSIWYG real: o que o usuário vê é o que será salvo
 * - Nenhuma "sanitização surpresa" no salvamento
 * - Código limpo e declarativo
 */
export const PreventConsecutiveEmptyParagraphs = Extension.create({
    name: 'preventConsecutiveEmptyParagraphs',

    addKeyboardShortcuts() {
        return {
            Enter: ({ editor }) => {
                const { state } = editor
                const { selection, doc } = state
                const { $from } = selection

                // Só aplicamos em parágrafos normais (não em blocos especiais como verse, code, etc.)
                const parentNode = $from.parent
                if (parentNode.type.name !== 'paragraph') {
                    return false // Deixa o comportamento padrão para outros blocos
                }

                // Verifica se o parágrafo atual está vazio (sem texto ou apenas com espaços)
                const currentParagraphIsEmpty = parentNode.textContent.trim() === ''

                if (currentParagraphIsEmpty) {
                    // Bloqueia a criação de outro parágrafo vazio
                    return true // Retorna true para indicar que o evento foi "handled" (bloqueado)
                }

                // Permite o Enter normalmente se há conteúdo
                return false
            },
        }
    },
})

export default PreventConsecutiveEmptyParagraphs
