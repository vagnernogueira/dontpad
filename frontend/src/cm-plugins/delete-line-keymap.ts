/**
 * Delete Line Keymap Plugin
 * 
 * Este plugin adiciona o atalho Ctrl+L para deletar a linha inteira
 * onde o cursor está posicionado.
 * 
 * Funcionalidades:
 * - Ctrl+L: deleta a linha atual completa
 * - Remove quebra de linha adequadamente (antes ou depois)
 * - Posiciona cursor na posição apropriada após deleção
 * - Funciona em qualquer posição da linha
 */

import { keymap } from "@codemirror/view"
import { deleteCurrentLine } from '../cm-commands'

export const deleteLineKeymap = keymap.of([
    {
        key: 'Ctrl-l',
        run: deleteCurrentLine
    }
])
