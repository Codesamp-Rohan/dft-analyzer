import { useState } from 'react'
import { exportStatsCsv, exportPdfReport } from '../utils/export.js'

export default function ExportControls({ stats, faceConfig, faceNames, chartsRef, meta }) {
  const [exportingPdf, setExportingPdf] = useState(false)

  async function handleExportPdf() {
    setExportingPdf(true)
    try {
      await exportPdfReport({ stats, faceConfig, faceNames, meta, chartsEl: chartsRef?.current ?? null })
    } finally {
      setExportingPdf(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => exportStatsCsv(stats, faceConfig, faceNames, meta)}
        className="text-xs sm:text-sm px-3 py-2 border border-border hover:bg-black/5 whitespace-nowrap"
      >
        Export CSV
      </button>
      <button
        onClick={handleExportPdf}
        disabled={exportingPdf}
        className="text-xs sm:text-sm px-3 py-2 border border-border hover:bg-black/5 disabled:opacity-50 whitespace-nowrap"
      >
        {exportingPdf ? 'Exporting…' : 'Export PDF Report'}
      </button>
    </div>
  )
}
