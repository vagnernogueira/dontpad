/**
 * Code Block Plugin
 * 
 * Este plugin detecta blocos de código delimitados por ``` (code fences)
 * e aplica estilos especiais para diferenciá-los do texto normal.
 * 
 * Funcionalidades:
 * - Usa syntax tree do Markdown para detectar blocos de código (FencedCode)
 * - Aplica classes CSS diferentes para marcadores e conteúdo
 * - Suporta especificação de linguagem após ```
 * - Detecta casos de fences aninhados com precisão do parser
 */

import { ViewPlugin, Decoration, EditorView, DecorationSet, ViewUpdate } from "@codemirror/view"
import { RangeSetBuilder } from "@codemirror/state"
import { syntaxTree } from "@codemirror/language"

/**
 * Constrói decorações para blocos de código usando a syntax tree
 */
function buildCodeBlockDecorations(view: EditorView) {
    const builder = new RangeSetBuilder<Decoration>()
    const tree = syntaxTree(view.state)

    for (const { from, to } of view.visibleRanges) {
        tree.iterate({
            from,
            to,
            enter: (node) => {
                // FencedCode é o nó que representa um bloco de código delimitado por ```
                if (node.name === "FencedCode") {
                    const doc = view.state.doc
                    const startLine = doc.lineAt(node.from)
                    const endLine = doc.lineAt(node.to)
                    
                    // Decorar a linha de abertura (```)
                    builder.add(startLine.from, startLine.from, 
                        Decoration.line({ class: 'cm-code-block-marker' }))
                    
                    // Decorar linhas intermediárias (conteúdo do código)
                    for (let lineNum = startLine.number + 1; lineNum < endLine.number; lineNum++) {
                        const line = doc.line(lineNum)
                        builder.add(line.from, line.from, 
                            Decoration.line({ class: 'cm-code-block-line' }))
                    }
                    
                    // Decorar a linha de fechamento (```) se não for a mesma que a de abertura
                    if (endLine.number > startLine.number) {
                        builder.add(endLine.from, endLine.from, 
                            Decoration.line({ class: 'cm-code-block-marker' }))
                    }
                }
            }
        })
    }

    return builder.finish()
}

/**
 * Plugin do CodeMirror para estilização de blocos de código
 */
export const codeBlockPlugin = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet

        constructor(view: EditorView) {
            this.decorations = buildCodeBlockDecorations(view)
        }

        update(update: ViewUpdate) {
            if (update.docChanged || update.viewportChanged) {
                this.decorations = buildCodeBlockDecorations(update.view)
            }
        }
    },
    {
        decorations: (plugin) => plugin.decorations
    }
)
