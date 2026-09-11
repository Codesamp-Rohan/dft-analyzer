function fmt(value) {
  if (value === null || value === undefined) return '—'
  return value.toFixed(2)
}

// Standard SPC thresholds: Cpk >= 1.33 capable, >= 1.0 marginal, below not capable.
function cpkColorClass(cpk) {
  if (cpk === null || cpk === undefined) return ''
  if (cpk >= 1.33) return 'text-signal-teal font-medium'
  if (cpk >= 1.0) return 'text-signal-amber font-medium'
  return 'text-signal-red font-medium'
}

export default function StatsTable({ stats, faceConfig, faceNames }) {
  const hasData = faceNames.some((f) => stats[f].totalCount > 0)

  if (!hasData) {
    return (
      <div className="border border-border p-4 sm:p-6">
        <h3 className="text-sm sm:text-base font-medium mb-2">Statistics</h3>
        <p className="text-sm text-muted">No data to display. Import a file first.</p>
      </div>
    )
  }

  return (
    <div className="border border-border p-4 sm:p-6">
      <h3 className="text-sm sm:text-base font-medium mb-4">
        Per-Face Statistics
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-2 py-1.5 sm:px-3 sm:py-2 font-medium">Face</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2 font-medium whitespace-nowrap">LSL / USL</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2 font-medium">Avg</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2 font-medium">Std Dev</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2 font-medium">Min</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2 font-medium">Max</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2 font-medium">Range</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2 font-medium">Cp</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2 font-medium">Cpk</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2 font-medium whitespace-nowrap">OOS Count</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {faceNames.map((faceName) => {
              const s = stats[faceName]
              const { lsl, usl } = faceConfig[faceName]
              const hasOOS = s.oosCount > 0

              return (
                <tr key={faceName} className="border-b border-border last:border-b-0">
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-medium whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block w-2 h-2"
                        style={{ backgroundColor: faceConfig[faceName].color }}
                      />
                      {faceName}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-muted whitespace-nowrap">
                    {lsl} / {usl}
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">{fmt(s.avg)}</td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">{fmt(s.stdDev)}</td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    <span className={s.min !== null && s.min < lsl ? 'text-signal-red font-medium' : ''}>
                      {fmt(s.min)}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    <span className={s.max !== null && s.max > usl ? 'text-signal-red font-medium' : ''}>
                      {fmt(s.max)}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">{fmt(s.range)}</td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">{fmt(s.cp)}</td>
                  <td className={`px-2 py-1.5 sm:px-3 sm:py-2 ${cpkColorClass(s.cpk)}`}>{fmt(s.cpk)}</td>
                  <td className={`px-2 py-1.5 sm:px-3 sm:py-2 ${hasOOS ? 'text-signal-red font-medium' : ''}`}>
                    {s.oosCount}
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-muted">{s.totalCount}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
