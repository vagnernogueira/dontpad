import { describe, expect, it, vi } from 'vitest'
import { buildEditorCommandMenu } from '../../components/editor-command-menu'

function createHandlers() {
  return {
    runCommand: vi.fn(),
    applyFormat: vi.fn(),
    cycleCaseTransform: vi.fn(),
    openMarkdownLintDialog: vi.fn(),
    openLinkDialog: vi.fn(),
    openImageDialog: vi.fn(),
    openEmojiDialog: vi.fn(),
    openLockDialog: vi.fn(),
    toggleSpellcheck: vi.fn(),
    setEditorZoom: vi.fn(),
    downloadMarkdown: vi.fn(),
    downloadPDF: vi.fn(),
    insertSnippet: vi.fn(),
  }
}

describe('buildEditorCommandMenu', () => {
  it('includes dedicated shortcut actions and programmatic snippet entries', () => {
    const handlers = createHandlers()
    const items = buildEditorCommandMenu({
      spellcheckEnabled: true,
      ...handlers,
    })

    const deleteLine = items.find((item) => item.id === 'delete-line')
    const markdownLint = items.find((item) => item.id === 'open-markdown-lint')
    const normalizeTable = items.find((item) => item.id === 'normalize-table')
    const dateSnippet = items.find((item) => item.id === 'snippet-dt')

    expect(deleteLine?.shortcut).toBe('Ctrl+L')
    expect(markdownLint?.shortcut).toBe('Ctrl+Alt+L')
    expect(normalizeTable?.shortcut).toBe('Alt+Shift+T')
    expect(dateSnippet?.shortcut).toBe('dt + Tab')

    deleteLine?.execute()
    markdownLint?.execute()
    dateSnippet?.execute()

    expect(handlers.runCommand).toHaveBeenCalledWith('deleteLine')
    expect(handlers.openMarkdownLintDialog).toHaveBeenCalledTimes(1)
    expect(handlers.insertSnippet).toHaveBeenCalledWith('dt')
  })

  it('switches the spellcheck label according to the current state', () => {
    const enabledHandlers = createHandlers()
    const disabledHandlers = createHandlers()

    const enabledItems = buildEditorCommandMenu({
      spellcheckEnabled: true,
      ...enabledHandlers,
    })

    const disabledItems = buildEditorCommandMenu({
      spellcheckEnabled: false,
      ...disabledHandlers,
    })

    expect(enabledItems.find((item) => item.id === 'spellcheck-toggle')?.label).toBe('Desativar correcao ortografica')
    expect(disabledItems.find((item) => item.id === 'spellcheck-toggle')?.label).toBe('Ativar correcao ortografica')
  })
})