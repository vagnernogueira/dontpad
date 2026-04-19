/**
 * CM Utils — Barrel Index
 *
 * Central export point for all CodeMirror utility modules.
 */

export {
  CURSOR_COLORS,
  ANIMAL_EMOJIS,
  getRandomCursorColor,
  getRandomAnimalEmoji,
  getRandomCursorName,
  getOrCreateProfile,
  updateProfile,
  updateProfileIp,
  detectDeviceType,
  fetchClientIp,
  getCursorAwarenessState,
  getProfileAwarenessState,
  type CollaboratorProfile,
} from './cursor'

export { buildDocumentTitle, trimTrailingSlashes } from './document-name'

export {
  findMarkdownLinks,
  findPlainUrls,
  findUrlAtPosition,
  isInsideMarkdownLink,
  normalizeUrl,
  findCheckboxes,
  isCheckboxLine,
  parseCheckboxStatus,
  type Range,
  type MarkdownLink,
  type PlainUrl,
  type MarkdownCheckbox,
} from './markdown-parsing'

export { getWordBoundaries, isWordCharAt } from './word-boundaries'

export {
  defaultSnippets,
  hasSnippetForPrefix,
  findSnippet,
  getWordBeforeCursor,
  type Snippet,
  type WordInfo,
} from './snippet-registry'

export { insertSnippet, resolveSnippetVariables } from './snippet-expansion'

export {
  evaluateMathExpression,
  formatResult,
  tokenizeMathExpression,
  MathParser,
  type MathToken,
} from './math-evaluator'
