import { ref, watch } from 'vue'
import * as persistence from '../services/persistence'

const EDITOR_ZOOM_PREFERENCE_KEY = 'editorZoom'
const DEFAULT_EDITOR_ZOOM = 100

export const EDITOR_ZOOM_PRESETS = [75, 90, 100, 110, 125, 150] as const
export const EDITOR_ZOOM_OPTIONS = EDITOR_ZOOM_PRESETS.map((value) => ({
  value,
  label: `${value}%`,
}))

export type EditorZoomPreset = (typeof EDITOR_ZOOM_PRESETS)[number]

function isEditorZoomPreset(value: number): value is EditorZoomPreset {
  return EDITOR_ZOOM_PRESETS.includes(value as EditorZoomPreset)
}

function normalizeEditorZoom(value: number | string): EditorZoomPreset {
  const parsed = typeof value === 'number' ? value : Number(value)

  if (Number.isFinite(parsed) && isEditorZoomPreset(parsed)) {
    return parsed
  }

  return DEFAULT_EDITOR_ZOOM
}

function readStoredZoom(): EditorZoomPreset {
  return normalizeEditorZoom(persistence.get(EDITOR_ZOOM_PREFERENCE_KEY, DEFAULT_EDITOR_ZOOM))
}

export function useEditorZoom() {
  const zoom = ref<EditorZoomPreset>(readStoredZoom())

  watch(zoom, (value) => {
    persistence.set(EDITOR_ZOOM_PREFERENCE_KEY, value)
  })

  function setZoom(value: number | string) {
    zoom.value = normalizeEditorZoom(value)
  }

  return {
    zoom,
    setZoom,
  }
}