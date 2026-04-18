import { EDITOR_ZOOM_OPTIONS } from '../composables/useEditorZoom'
import { defaultSnippets } from '../cm-utils/snippet-registry'

export interface EditorCommandMenuItem {
  id: string
  group: string
  label: string
  description?: string
  shortcut?: string
  keywords?: string[]
  kind: 'action' | 'dialog' | 'snippet' | 'setting' | 'download'
  execute: () => void
}

interface BuildEditorCommandMenuOptions {
  spellcheckEnabled: boolean
  runCommand: (commandName: string) => void
  applyFormat: (prefix: string, suffix?: string) => void
  cycleCaseTransform: () => void
  openMarkdownLintDialog: () => void
  openLinkDialog: () => void
  openImageDialog: () => void
  openEmojiDialog: () => void
  openLockDialog: () => void
  toggleSpellcheck: () => void
  setEditorZoom: (value: number) => void
  downloadMarkdown: () => void
  downloadPDF: () => void
  insertSnippet: (prefix: string) => void
}

export function buildEditorCommandMenu(options: BuildEditorCommandMenuOptions): EditorCommandMenuItem[] {
  const items: EditorCommandMenuItem[] = [
    {
      id: 'undo',
      group: 'Edicao',
      label: 'Desfazer',
      description: 'Reverte a ultima alteracao aplicada ao documento.',
      kind: 'action',
      execute: () => options.runCommand('undo'),
    },
    {
      id: 'redo',
      group: 'Edicao',
      label: 'Refazer',
      description: 'Reaplica a ultima alteracao desfeita.',
      kind: 'action',
      execute: () => options.runCommand('redo'),
    },
    {
      id: 'delete-line',
      group: 'Edicao',
      label: 'Excluir linha atual',
      description: 'Remove a linha onde o cursor esta posicionado.',
      shortcut: 'Ctrl+L',
      keywords: ['deletar', 'remover linha'],
      kind: 'action',
      execute: () => options.runCommand('deleteLine'),
    },
    {
      id: 'normalize-table',
      group: 'Edicao',
      label: 'Normalizar tabela markdown',
      description: 'Alinha colunas da tabela atual ou da selecao.',
      shortcut: 'Alt+Shift+T',
      keywords: ['tabela', 'markdown'],
      kind: 'action',
      execute: () => options.runCommand('normalizeTable'),
    },
    {
      id: 'open-markdown-lint',
      group: 'Edicao',
      label: 'Lint de Markdown',
      description: 'Analisa o documento atual e abre a lista de inconformidades encontradas.',
      shortcut: 'Ctrl+Alt+L',
      keywords: ['markdownlint', 'lint', 'hotfix', 'diagnostico'],
      kind: 'dialog',
      execute: options.openMarkdownLintDialog,
    },
    {
      id: 'spellcheck-toggle',
      group: 'Edicao',
      label: options.spellcheckEnabled ? 'Desativar correcao ortografica' : 'Ativar correcao ortografica',
      description: 'Alterna o corretor ortografico do editor.',
      keywords: ['spellcheck', 'ortografia', 'abc'],
      kind: 'setting',
      execute: options.toggleSpellcheck,
    },
    {
      id: 'bold',
      group: 'Formatacao',
      label: 'Negrito',
      description: 'Aplica destaque em negrito ao texto selecionado.',
      kind: 'action',
      execute: () => options.runCommand('bold'),
    },
    {
      id: 'italic',
      group: 'Formatacao',
      label: 'Italico',
      description: 'Aplica enfase em italico.',
      kind: 'action',
      execute: () => options.runCommand('italic'),
    },
    {
      id: 'strikethrough',
      group: 'Formatacao',
      label: 'Tachado',
      description: 'Aplica texto tachado na selecao.',
      kind: 'action',
      execute: () => options.runCommand('strikethrough'),
    },
    {
      id: 'inline-code',
      group: 'Formatacao',
      label: 'Codigo inline',
      description: 'Envolve o texto com crases.',
      kind: 'action',
      execute: () => options.runCommand('inlineCode'),
    },
    {
      id: 'code-block',
      group: 'Formatacao',
      label: 'Bloco de codigo',
      description: 'Insere ou envolve a selecao em bloco de codigo markdown.',
      kind: 'action',
      execute: () => options.runCommand('codeBlock'),
    },
    {
      id: 'quote',
      group: 'Formatacao',
      label: 'Citacao',
      description: 'Adiciona prefixo de citacao na linha atual.',
      kind: 'action',
      execute: () => options.runCommand('quote'),
    },
    {
      id: 'transform-case-cycle',
      group: 'Formatacao',
      label: 'Alternar caixa',
      description: 'Percorre UPPER, lower e camelCase na mesma ordem da toolbar.',
      keywords: ['maiuscula', 'minuscula', 'camelcase'],
      kind: 'action',
      execute: options.cycleCaseTransform,
    },
    {
      id: 'transform-upper',
      group: 'Formatacao',
      label: 'Converter para UPPERCASE',
      description: 'Transforma a selecao ou a palavra atual em maiusculas.',
      kind: 'action',
      execute: () => options.runCommand('transformToUpperCase'),
    },
    {
      id: 'transform-lower',
      group: 'Formatacao',
      label: 'Converter para lowercase',
      description: 'Transforma a selecao ou a palavra atual em minusculas.',
      kind: 'action',
      execute: () => options.runCommand('transformToLowerCase'),
    },
    {
      id: 'transform-camel',
      group: 'Formatacao',
      label: 'Converter para camelCase',
      description: 'Transforma a selecao ou a palavra atual em camelCase.',
      kind: 'action',
      execute: () => options.runCommand('transformToCamelCase'),
    },
    {
      id: 'heading-1',
      group: 'Estrutura',
      label: 'Titulo 1',
      description: 'Adiciona prefixo de heading nivel 1.',
      kind: 'action',
      execute: () => options.runCommand('heading1'),
    },
    {
      id: 'heading-2',
      group: 'Estrutura',
      label: 'Titulo 2',
      description: 'Adiciona prefixo de heading nivel 2.',
      kind: 'action',
      execute: () => options.runCommand('heading2'),
    },
    {
      id: 'heading-3',
      group: 'Estrutura',
      label: 'Titulo 3',
      description: 'Adiciona prefixo de heading nivel 3.',
      kind: 'action',
      execute: () => options.runCommand('heading3'),
    },
    {
      id: 'bullet-list',
      group: 'Estrutura',
      label: 'Lista bullet',
      description: 'Inicia uma lista com marcadores.',
      kind: 'action',
      execute: () => options.runCommand('bulletList'),
    },
    {
      id: 'numbered-list',
      group: 'Estrutura',
      label: 'Lista numerica',
      description: 'Inicia uma lista numerada.',
      kind: 'action',
      execute: () => options.runCommand('numberedList'),
    },
    {
      id: 'checklist',
      group: 'Estrutura',
      label: 'Checklist',
      description: 'Insere um item de tarefa markdown.',
      kind: 'action',
      execute: () => options.runCommand('checklist'),
    },
    {
      id: 'table-block',
      group: 'Estrutura',
      label: 'Inserir tabela',
      description: 'Insere a estrutura basica de uma tabela markdown.',
      keywords: ['grid'],
      kind: 'action',
      execute: () => options.applyFormat('\n|  |  |\n|--|--|\n|  |  |\n'),
    },
    {
      id: 'open-link',
      group: 'Insercao',
      label: 'Inserir link',
      description: 'Abre o dialogo para inserir ou editar link markdown.',
      kind: 'dialog',
      execute: options.openLinkDialog,
    },
    {
      id: 'open-image',
      group: 'Insercao',
      label: 'Inserir imagem',
      description: 'Abre o dialogo para inserir imagem markdown.',
      kind: 'dialog',
      execute: options.openImageDialog,
    },
    {
      id: 'open-emoji',
      group: 'Insercao',
      label: 'Inserir emoji',
      description: 'Abre o seletor de emoji.',
      kind: 'dialog',
      execute: options.openEmojiDialog,
    },
    {
      id: 'open-lock',
      group: 'Insercao',
      label: 'Travar com senha',
      description: 'Abre o fluxo de trava por senha do documento.',
      kind: 'dialog',
      execute: options.openLockDialog,
    },
    {
      id: 'download-md',
      group: 'Exportacao',
      label: 'Baixar como .md',
      description: 'Exporta o documento atual como markdown.',
      kind: 'download',
      execute: options.downloadMarkdown,
    },
    {
      id: 'download-pdf',
      group: 'Exportacao',
      label: 'Baixar como .pdf',
      description: 'Exporta o documento atual em PDF.',
      kind: 'download',
      execute: options.downloadPDF,
    },
  ]

  for (const option of EDITOR_ZOOM_OPTIONS) {
    items.push({
      id: `zoom-${option.value}`,
      group: 'Visual',
      label: `Zoom ${option.label}`,
      description: 'Define o zoom do conteudo do editor.',
      kind: 'setting',
      execute: () => options.setEditorZoom(option.value),
    })
  }

  for (const snippet of defaultSnippets) {
    items.push({
      id: `snippet-${snippet.prefix}`,
      group: 'Snippets',
      label: `Snippet: ${snippet.prefix}`,
      description: snippet.description || 'Insere snippet padrao do editor.',
      shortcut: `${snippet.prefix} + Tab`,
      keywords: ['snippet', snippet.prefix],
      kind: 'snippet',
      execute: () => options.insertSnippet(snippet.prefix),
    })
  }

  return items
}