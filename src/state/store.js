import { create } from 'zustand'
import { parseFile } from '../parsing/parseFile.js'
import { defaultSpecLimits } from '../aggregation/faceConfig.js'

const SPEC_LIMITS_STORAGE_KEY = 'dft-analyzer:specLimits'

function loadSpecLimits() {
  const defaults = defaultSpecLimits()
  try {
    const raw = localStorage.getItem(SPEC_LIMITS_STORAGE_KEY)
    if (!raw) return defaults
    const saved = JSON.parse(raw)
    // Merge onto fresh defaults so a stale save missing a mode/face (e.g. after
    // faceConfig.js changes) still fills in with the current default limits.
    const merged = {}
    for (const mode of Object.keys(defaults)) {
      merged[mode] = { ...defaults[mode], ...(saved[mode] ?? {}) }
    }
    return merged
  } catch {
    return defaults
  }
}

function persistSpecLimits(specLimits) {
  try {
    localStorage.setItem(SPEC_LIMITS_STORAGE_KEY, JSON.stringify(specLimits))
  } catch {
    // localStorage unavailable (e.g. private browsing) — edits just won't survive a reload
  }
}

const useStore = create((set, get) => ({
  // --- Data ---
  datasets: { daily: null, monthly: null },
  activeView: null, // 'daily' | 'monthly'
  faceMode: 'standard', // 'standard' | 'rolling'
  fileName: null,

  // --- Spec limits (editable, persisted) ---
  // Shape: { [faceMode]: { [faceName]: { lsl, usl } } }
  specLimits: loadSpecLimits(),

  // --- Filters ---
  filters: { hangerNo: '', product: '' },
  products: [], // LOV list from daily file

  // --- Import ---
  importing: false,
  importError: null,

  importFile: async (fileResult) => {
    set({ importing: true, importError: null })
    try {
      const parsed = parseFile(fileResult.data)
      const newDatasets = { ...get().datasets }
      newDatasets[parsed.type] = {
        records: parsed.records,
        fileName: fileResult.fileName,
      }

      const updates = {
        datasets: newDatasets,
        activeView: parsed.type,
        fileName: fileResult.fileName,
        importing: false,
        importError: null,
      }

      if (parsed.products.length > 0) {
        updates.products = parsed.products
      }

      set(updates)
    } catch (err) {
      set({ importing: false, importError: err.message })
    }
  },

  // --- View switching ---
  setActiveView: (view) => set({ activeView: view }),
  setFaceMode: (mode) => set({ faceMode: mode }),

  // --- Spec limit editing ---
  setSpecLimit: (mode, faceName, { lsl, usl }) => {
    const next = {
      ...get().specLimits,
      [mode]: {
        ...get().specLimits[mode],
        [faceName]: { lsl, usl },
      },
    }
    persistSpecLimits(next)
    set({ specLimits: next })
  },

  resetSpecLimit: (mode, faceName) => {
    const defaults = defaultSpecLimits()
    const next = {
      ...get().specLimits,
      [mode]: {
        ...get().specLimits[mode],
        [faceName]: defaults[mode][faceName],
      },
    }
    persistSpecLimits(next)
    set({ specLimits: next })
  },

  resetAllSpecLimits: () => {
    const defaults = defaultSpecLimits()
    persistSpecLimits(defaults)
    set({ specLimits: defaults })
  },

  // --- Filtering ---
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  clearFilters: () => set({ filters: { hangerNo: '', product: '' } }),
}))

export default useStore

// --- Pure utility functions (NOT selectors for useStore) ---
// Call these in useMemo inside components, NOT inside useStore()

export function getActiveRecords(datasets, activeView) {
  if (!activeView || !datasets[activeView]) return []
  return datasets[activeView].records
}

export function getFilteredRecords(records, filters, activeView) {
  let result = records

  if (filters.hangerNo) {
    result = result.filter(
      (r) => r.hangerNo && r.hangerNo.includes(filters.hangerNo)
    )
  }

  if (filters.product && activeView === 'daily') {
    result = result.filter((r) => r.product === filters.product)
  }

  return result
}

export function getHangerNumbers(records) {
  const hangers = new Set(records.map((r) => r.hangerNo).filter(Boolean))
  return [...hangers].sort((a, b) => Number(a) - Number(b))
}
