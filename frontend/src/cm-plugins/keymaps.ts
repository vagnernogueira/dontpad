/**
 * Keymaps Agrupados com Precedencia Explicita
 * 
 * Este modulo centraliza todos os keymaps customizados do editor,
 * aplicando precedencia explicita para garantir comportamento previsivel.
 * 
 * Ordem de precedencia (maior para menor):
 * 1. HIGH: Tab de indentacao (prioridade sobre snippets)
 * 2. HIGH: Delete line (Ctrl+L)
 * 3. NORMAL: Enter para listas e citacoes
 * 4. NORMAL: Math calculation (space trigger)
 * 5. LOW: Snippets (ultima prioridade, so ativa quando aplicavel)
 * 
 * Decisoes arquiteturais:
 * - Tab tem prioridade; snippets so ativam sem selecao e quando aplicaveis
 * - Enter cobre task lists e sai da lista quando item vazio
 * - Precedencia explicita evita conflitos com basicSetup
 */

import { Prec } from '@codemirror/state'
import { tabIndentKeymap } from './tab-keymap'
import { deleteLineKeymap } from './delete-line-keymap'
import { enterKeymap } from './enter-keymap'
import { mathCalculationKeymap } from './math'
import { snippetKeymap } from './snippet'

/**
 * Keymaps agrupados com precedencia explicita
 * 
 * Uso no Editor:
 * ```typescript
 * import { editorKeymaps } from '../cm-plugins/keymaps'
 * 
 * extensions: [
 *   ...editorKeymaps,
 *   // outros plugins
 * ]
 * ```
 */
export const editorKeymaps = [
  Prec.high(tabIndentKeymap),      // Tab de indentacao tem prioridade
  Prec.high(deleteLineKeymap),     // Delete line tem prioridade
  enterKeymap,                      // Enter sem precedencia especial
  mathCalculationKeymap,            // Math calculation sem precedencia especial
  Prec.low(snippetKeymap)           // Snippets com baixa prioridade
]
