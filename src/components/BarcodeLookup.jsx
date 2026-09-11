import { useMemo, useState } from 'react'

function fmt(value) {
  return value === null || value === undefined || Number.isNaN(value) ? '—' : value.toFixed(2)
}

function faceValue(record, faceName, faceConfig) {
  const { keys, lsl, usl } = faceConfig[faceName]
  const values = keys
    .map((k) => record.measurements[k])
    .filter((v) => v !== null && v !== undefined && !Number.isNaN(v))
  if (values.length === 0) return { value: null, inSpec: null }
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  return { value: avg, inSpec: avg >= lsl && avg <= usl }
}

export default function BarcodeLookup({ activeRecords, faceConfig, faceNames }) {
  const [query, setQuery] = useState('')
  const [searched, setSearched] = useState(null)

  const matches = useMemo(() => {
    if (searched === null) return []
    return activeRecords.filter((r) => r.barcodeNo === searched)
  }, [activeRecords, searched])

  function handleSearch(e) {
    e.preventDefault()
    setSearched(query.trim())
  }

  const measurementKeys = activeRecords[0] ? Object.keys(activeRecords[0].measurements) : []

  return (
    <div className="border border-border p-4 sm:p-6">
      <h3 className="text-sm sm:text-base font-medium mb-4">Barcode Lookup</h3>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter barcode number"
          className="border border-border bg-background text-foreground px-3 py-2 text-sm sm:text-base flex-1 min-w-0"
        />
        <button
          type="submit"
          disabled={!query.trim()}
          className="bg-black text-white px-4 py-2 text-sm sm:text-base font-medium whitespace-nowrap disabled:opacity-50"
        >
          Search
        </button>
      </form>

      {searched !== null && matches.length === 0 && (
        <p className="text-sm text-muted">No record found for barcode "{searched}".</p>
      )}

      {matches.length > 1 && (
        <p className="text-xs text-signal-amber mb-3">
          {matches.length} records found for this barcode.
        </p>
      )}

      {matches.length > 0 && (
        <div className="flex flex-col gap-4">
          {matches.map((record, idx) => (
            <div key={idx} className="border border-border p-3">
              <p className="text-xs text-muted mb-3">
                {record.date || '—'} {record.time || ''} · Hanger {record.hangerNo || '—'}
                {record.product ? ` · ${record.product}` : ''}
                {' · Barcode '}{record.barcodeNo}
              </p>

              <div className="overflow-x-auto mb-3">
                <table className="text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr>
                      {measurementKeys.map((k) => (
                        <th key={k} className="px-2 py-1 font-medium text-muted whitespace-nowrap">
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {measurementKeys.map((k) => (
                        <td key={k} className="px-2 py-1 whitespace-nowrap">
                          {fmt(record.measurements[k])}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap gap-2">
                {faceNames.map((faceName) => {
                  const { value, inSpec } = faceValue(record, faceName, faceConfig)
                  return (
                    <span
                      key={faceName}
                      className={`text-xs px-2 py-1 border whitespace-nowrap ${
                        inSpec === null
                          ? 'border-border text-muted'
                          : inSpec
                            ? 'border-signal-teal text-signal-teal'
                            : 'border-signal-red text-signal-red'
                      }`}
                    >
                      {faceName}: {fmt(value)}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
