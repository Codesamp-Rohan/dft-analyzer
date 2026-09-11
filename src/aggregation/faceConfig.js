/**
 * Face grouping configuration and spec limits.
 *
 * Two modes are available, keyed in FACE_CONFIGS:
 *  - 'standard': Face-1 (m1, m2) vs Other Faces (m3-m8) — the default view.
 *  - 'rolling':  a finer, overlapping split where each face is the average of
 *                two adjacent measurements — Face-1: m1+m2, Face-2: m2+m3,
 *                Face-3: m3+m4, Face-4: m4+m5, Face-5: m5+m6, Face-6: m6+m7,
 *                Face-7: m7+m8. Selected via the "More Faces" tab in the UI.
 *
 * Parsers, charts, and stats all read whichever config the UI selects —
 * add or edit a mode here without touching the rest of the app.
 */
export const FACE_CONFIGS = {
  standard: {
    'Face-1': {
      keys: ['m1', 'm2'],
      lsl: 90,
      usl: 140,
      color: '#1d9e75', // signal-teal
    },
    'Other Faces': {
      keys: ['m3', 'm4', 'm5', 'm6', 'm7', 'm8'],
      lsl: 70,
      usl: 120,
      color: '#ba7517', // signal-amber
    },
  },
  rolling: {
    'Face-1': { keys: ['m1', 'm2'], lsl: 90, usl: 140, color: '#1d9e75' },
    'Face-2': { keys: ['m2', 'm3'], lsl: 70, usl: 120, color: '#2f7ed8' },
    'Face-3': { keys: ['m3', 'm4'], lsl: 70, usl: 120, color: '#8756d1' },
    'Face-4': { keys: ['m4', 'm5'], lsl: 70, usl: 120, color: '#ba7517' },
    'Face-5': { keys: ['m5', 'm6'], lsl: 70, usl: 120, color: '#c2427a' },
    'Face-6': { keys: ['m6', 'm7'], lsl: 70, usl: 120, color: '#3f9142' },
    'Face-7': { keys: ['m7', 'm8'], lsl: 70, usl: 120, color: '#a5730a' },
  },
}

/** Ordered mode list for the face-mode tab */
export const FACE_MODES = [
  { key: 'standard', label: 'Faces' },
  { key: 'rolling', label: 'More Faces' },
]

/** Ordered face names for a given mode, for consistent rendering */
export function getFaceNames(mode) {
  return Object.keys(FACE_CONFIGS[mode] ?? FACE_CONFIGS.standard)
}

/** Deep-cloned defaults, keyed by mode then face name — the shape stored in specLimits. */
export function defaultSpecLimits() {
  const result = {}
  for (const mode of Object.keys(FACE_CONFIGS)) {
    result[mode] = {}
    for (const faceName of Object.keys(FACE_CONFIGS[mode])) {
      const { lsl, usl } = FACE_CONFIGS[mode][faceName]
      result[mode][faceName] = { lsl, usl }
    }
  }
  return result
}

/**
 * Merge the static face config (keys, color) for a mode with any user-edited
 * LSL/USL overrides from the store's specLimits, so every consumer (charts,
 * stats, lookups, exports) sees the same live spec limits without needing
 * to know about the override mechanism.
 */
export function getEffectiveFaceConfig(mode, specLimits) {
  const base = FACE_CONFIGS[mode] ?? FACE_CONFIGS.standard
  const overrides = specLimits?.[mode] ?? {}
  const merged = {}
  for (const faceName of Object.keys(base)) {
    merged[faceName] = { ...base[faceName], ...(overrides[faceName] ?? {}) }
  }
  return merged
}
