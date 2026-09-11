import { useEffect, useState } from 'react'
import useStore from '../state/store.js'
import { FACE_CONFIGS, FACE_MODES, getFaceNames } from '../aggregation/faceConfig.js'

export default function SpecLimitsPanel({ open, onClose }) {
  const faceMode = useStore((s) => s.faceMode)
  const specLimits = useStore((s) => s.specLimits)
  const setSpecLimit = useStore((s) => s.setSpecLimit)
  const resetSpecLimit = useStore((s) => s.resetSpecLimit)
  const resetAllSpecLimits = useStore((s) => s.resetAllSpecLimits)

  const faceNames = getFaceNames(faceMode)
  const modeLabel = FACE_MODES.find((m) => m.key === faceMode)?.label ?? faceMode

  const [drafts, setDrafts] = useState({})
  const [errors, setErrors] = useState({})

  // Re-seed the draft inputs from the store whenever the panel opens or the face mode changes.
  useEffect(() => {
    if (!open) return
    const initial = {}
    for (const faceName of faceNames) {
      const limits = specLimits[faceMode]?.[faceName] ?? FACE_CONFIGS[faceMode][faceName]
      initial[faceName] = { lsl: String(limits.lsl), usl: String(limits.usl) }
    }
    setDrafts(initial)
    setErrors({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, faceMode])

  if (!open) return null

  function handleChange(faceName, field, rawValue) {
    const nextDraft = { ...drafts[faceName], [field]: rawValue }
    setDrafts((d) => ({ ...d, [faceName]: nextDraft }))

    const lsl = Number(nextDraft.lsl)
    const usl = Number(nextDraft.usl)
    if (nextDraft.lsl === '' || nextDraft.usl === '' || Number.isNaN(lsl) || Number.isNaN(usl)) {
      setErrors((e) => ({ ...e, [faceName]: 'Enter valid numbers' }))
      return
    }
    if (lsl >= usl) {
      setErrors((e) => ({ ...e, [faceName]: 'LSL must be less than USL' }))
      return
    }
    setErrors((e) => {
      if (!(faceName in e)) return e
      const next = { ...e }
      delete next[faceName]
      return next
    })
    setSpecLimit(faceMode, faceName, { lsl, usl })
  }

  function handleResetFace(faceName) {
    resetSpecLimit(faceMode, faceName)
    const defaults = FACE_CONFIGS[faceMode][faceName]
    setDrafts((d) => ({ ...d, [faceName]: { lsl: String(defaults.lsl), usl: String(defaults.usl) } }))
    setErrors((e) => {
      if (!(faceName in e)) return e
      const next = { ...e }
      delete next[faceName]
      return next
    })
  }

  function handleResetAll() {
    resetAllSpecLimits()
    const initial = {}
    for (const faceName of faceNames) {
      const defaults = FACE_CONFIGS[faceMode][faceName]
      initial[faceName] = { lsl: String(defaults.lsl), usl: String(defaults.usl) }
    }
    setDrafts(initial)
    setErrors({})
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-start sm:items-center justify-center bg-black/40 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border w-full max-w-lg my-8 sm:my-0 max-h-[85vh] overflow-y-auto p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-medium">Spec Limits</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-foreground text-sm px-1"
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-muted mb-4">{modeLabel} view</p>

        <div className="flex flex-col gap-3">
          {faceNames.map((faceName) => {
            const draft = drafts[faceName] ?? { lsl: '', usl: '' }
            const error = errors[faceName]
            return (
              <div key={faceName} className="border border-border p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium inline-flex items-center gap-2">
                    <span
                      className="inline-block w-2 h-2"
                      style={{ backgroundColor: FACE_CONFIGS[faceMode][faceName].color }}
                    />
                    {faceName}
                  </span>
                  <button
                    onClick={() => handleResetFace(faceName)}
                    className="text-xs text-muted hover:text-foreground"
                  >
                    Reset
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-muted flex items-center gap-1.5">
                    LSL
                    <input
                      type="number"
                      inputMode="decimal"
                      value={draft.lsl}
                      onChange={(e) => handleChange(faceName, 'lsl', e.target.value)}
                      className="border border-border bg-background text-foreground px-2 py-1 w-20 text-sm"
                    />
                  </label>
                  <label className="text-xs text-muted flex items-center gap-1.5">
                    USL
                    <input
                      type="number"
                      inputMode="decimal"
                      value={draft.usl}
                      onChange={(e) => handleChange(faceName, 'usl', e.target.value)}
                      className="border border-border bg-background text-foreground px-2 py-1 w-20 text-sm"
                    />
                  </label>
                </div>
                {error && <p className="text-xs text-signal-red">{error}</p>}
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleResetAll}
            className="text-xs px-3 py-2 border border-border hover:bg-black/5"
          >
            Reset all to defaults
          </button>
        </div>
      </div>
    </div>
  )
}
