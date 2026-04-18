import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import EditorCommandPalette from '../../components/EditorCommandPalette.vue'
import type { EditorCommandMenuItem } from '../../components/editor-command-menu'

const items: EditorCommandMenuItem[] = [
  {
    id: 'delete-line',
    group: 'Edicao',
    label: 'Excluir linha atual',
    description: 'Remove a linha atual.',
    shortcut: 'Ctrl+L',
    kind: 'action',
    execute: vi.fn(),
  },
  {
    id: 'open-emoji',
    group: 'Insercao',
    label: 'Inserir emoji',
    description: 'Abre o seletor de emoji.',
    kind: 'dialog',
    execute: vi.fn(),
  },
  {
    id: 'snippet-dt',
    group: 'Snippets',
    label: 'Snippet: dt',
    description: 'Insere a data atual.',
    shortcut: 'dt + Tab',
    kind: 'snippet',
    execute: vi.fn(),
  },
]

describe('EditorCommandPalette', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders groups and shortcut labels', async () => {
    render(EditorCommandPalette, {
      props: {
        open: true,
        items,
      },
      global: {
        stubs: {
          Dialog: { props: ['open'], template: '<div v-if="open"><slot /></div>' },
          DialogContent: { template: '<div><slot /></div>' },
          DialogHeader: { template: '<div><slot /></div>' },
          DialogTitle: { template: '<div><slot /></div>' },
          DialogDescription: { template: '<div><slot /></div>' },
          ScrollArea: { template: '<div><slot /></div>' },
          Badge: { template: '<span><slot /></span>' },
        },
      },
    })

    expect(await screen.findByText('Edicao')).toBeInTheDocument()
    expect(screen.getByText('Insercao')).toBeInTheDocument()
    expect(screen.getByText('Snippets')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+L')).toBeInTheDocument()
    expect(screen.getByText('dt + Tab')).toBeInTheDocument()
  })

  it('filters the list and emits the selected item on Enter', async () => {
    const onSelect = vi.fn()

    render(EditorCommandPalette, {
      props: {
        open: true,
        items,
        onSelect,
      },
      global: {
        stubs: {
          Dialog: { props: ['open'], template: '<div v-if="open"><slot /></div>' },
          DialogContent: { template: '<div><slot /></div>' },
          DialogHeader: { template: '<div><slot /></div>' },
          DialogTitle: { template: '<div><slot /></div>' },
          DialogDescription: { template: '<div><slot /></div>' },
          ScrollArea: { template: '<div><slot /></div>' },
          Badge: { template: '<span><slot /></span>' },
        },
      },
    })

    const [searchInput] = await screen.findAllByLabelText('Buscar comandos do editor')
    await fireEvent.update(searchInput, 'emoji')

    await waitFor(() => {
      expect(screen.getByText('Inserir emoji')).toBeInTheDocument()
      expect(screen.queryByText('Excluir linha atual')).not.toBeInTheDocument()
    })

    await fireEvent.keyDown(searchInput, { key: 'Enter' })

    expect(onSelect).toHaveBeenCalledWith('open-emoji')
  })
})