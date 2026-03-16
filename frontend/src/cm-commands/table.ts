import type { EditorView } from '@codemirror/view'

interface TableLine {
  from: number
  to: number
  number: number
  text: string
}

interface TableRange {
  from: number
  to: number
  lines: string[]
}

const MIN_SEPARATOR_WIDTH = 3

function isPotentialTableLine(lineText: string): boolean {
  const trimmed = lineText.trim()
  return trimmed.length > 0 && trimmed.includes('|')
}

function splitTableCells(rowText: string): string[] {
  const normalizedRow = rowText.trim().replace(/^\|/, '').replace(/\|$/, '')
  return normalizedRow.split('|').map((cell) => cell.trim())
}

function isSeparatorCell(cellText: string): boolean {
  return /^:?-{2,}:?$/.test(cellText.trim())
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => isSeparatorCell(cell))
}

function collectLinesInRange(view: EditorView, from: number, to: number): TableLine[] {
  const lines: TableLine[] = []
  let currentLine = view.state.doc.lineAt(from)
  const endLine = view.state.doc.lineAt(to)

  while (currentLine.number <= endLine.number) {
    lines.push({
      from: currentLine.from,
      to: currentLine.to,
      number: currentLine.number,
      text: currentLine.text
    })

    if (currentLine.number === endLine.number) {
      break
    }

    currentLine = view.state.doc.line(currentLine.number + 1)
  }

  return lines
}

function findTableRangeInLines(lines: TableLine[], preferredIndex?: number): TableRange | null {
  if (lines.length < 3) {
    return null
  }

  for (let separatorIndex = 1; separatorIndex < lines.length - 1; separatorIndex++) {
    const separatorCells = splitTableCells(lines[separatorIndex].text)
    if (!isSeparatorRow(separatorCells)) {
      continue
    }

    const startIndex = separatorIndex - 1
    let endIndex = separatorIndex + 1

    while (endIndex + 1 < lines.length && isPotentialTableLine(lines[endIndex + 1].text)) {
      endIndex++
    }

    if (endIndex - startIndex + 1 < 3) {
      continue
    }

    if (preferredIndex !== undefined && (preferredIndex < startIndex || preferredIndex > endIndex)) {
      continue
    }

    const tableSlice = lines.slice(startIndex, endIndex + 1)
    const normalized = normalizeTableLines(tableSlice.map((line) => line.text))
    if (!normalized) {
      continue
    }

    return {
      from: tableSlice[0].from,
      to: tableSlice[tableSlice.length - 1].to,
      lines: tableSlice.map((line) => line.text)
    }
  }

  return null
}

function findTableRangeFromSelection(view: EditorView): TableRange | null {
  const selection = view.state.selection.main
  const from = view.state.doc.lineAt(selection.from).from
  const to = view.state.doc.lineAt(selection.to).to
  const lines = collectLinesInRange(view, from, to)
  return findTableRangeInLines(lines)
}

function findTableRangeFromCursor(view: EditorView): TableRange | null {
  const selection = view.state.selection.main
  const cursorLine = view.state.doc.lineAt(selection.from)

  if (!isPotentialTableLine(cursorLine.text)) {
    return null
  }

  let startLineNumber = cursorLine.number
  let endLineNumber = cursorLine.number

  while (startLineNumber > 1 && isPotentialTableLine(view.state.doc.line(startLineNumber - 1).text)) {
    startLineNumber--
  }

  while (endLineNumber < view.state.doc.lines && isPotentialTableLine(view.state.doc.line(endLineNumber + 1).text)) {
    endLineNumber++
  }

  const lines: TableLine[] = []
  for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
    const line = view.state.doc.line(lineNumber)
    lines.push({
      from: line.from,
      to: line.to,
      number: line.number,
      text: line.text
    })
  }

  const preferredIndex = cursorLine.number - startLineNumber
  return findTableRangeInLines(lines, preferredIndex)
}

function normalizeTableLines(lines: string[]): string | null {
  if (lines.length < 3) {
    return null
  }

  const parsedRows = lines.map((line) => splitTableCells(line))
  if (parsedRows[0].length === 0) {
    return null
  }

  if (!isSeparatorRow(parsedRows[1])) {
    return null
  }

  const dataRows = parsedRows.slice(2)
  if (dataRows.length === 0) {
    return null
  }

  const columnCount = parsedRows.reduce((max, row) => Math.max(max, row.length), 0)
  if (columnCount === 0) {
    return null
  }

  const normalizedRows = parsedRows.map((row) => {
    const paddedRow = row.slice()
    while (paddedRow.length < columnCount) {
      paddedRow.push('')
    }
    return paddedRow
  })

  const widths = new Array<number>(columnCount).fill(MIN_SEPARATOR_WIDTH)
  const contentRows = [normalizedRows[0], ...normalizedRows.slice(2)]

  for (const row of contentRows) {
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
      widths[columnIndex] = Math.max(widths[columnIndex], row[columnIndex].length)
    }
  }

  const formatDataRow = (row: string[]): string => {
    const cells = row.map((cell, index) => cell.padEnd(widths[index]))
    return `| ${cells.join(' | ')} |`
  }

  const separatorRow = `| ${widths.map((width) => '-'.repeat(Math.max(MIN_SEPARATOR_WIDTH, width))).join(' | ')} |`

  return [
    formatDataRow(normalizedRows[0]),
    separatorRow,
    ...normalizedRows.slice(2).map((row) => formatDataRow(row))
  ].join('\n')
}

export function normalizeMarkdownTable(view: EditorView): boolean {
  if (!view) {
    return false
  }

  const selection = view.state.selection.main
  const tableRange = !selection.empty
    ? findTableRangeFromSelection(view)
    : findTableRangeFromCursor(view)

  if (!tableRange) {
    return false
  }

  const normalizedTable = normalizeTableLines(tableRange.lines)
  if (!normalizedTable) {
    return false
  }

  view.dispatch({
    changes: {
      from: tableRange.from,
      to: tableRange.to,
      insert: normalizedTable
    }
  })

  view.focus()
  return true
}