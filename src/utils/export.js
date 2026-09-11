/**
 * CSV / PDF export for the per-face stats table and charts.
 *
 * Both exports trigger a plain browser download (Blob + temporary <a> click),
 * not an Electron IPC round-trip — this keeps them working identically
 * whether the app runs inside Electron or is deployed as a static site.
 */

const STATS_COLUMNS = [
  { key: 'face', header: 'Face' },
  { key: 'lsl', header: 'LSL' },
  { key: 'usl', header: 'USL' },
  { key: 'avg', header: 'Avg' },
  { key: 'stdDev', header: 'Std Dev' },
  { key: 'min', header: 'Min' },
  { key: 'max', header: 'Max' },
  { key: 'range', header: 'Range' },
  { key: 'cp', header: 'Cp' },
  { key: 'cpk', header: 'Cpk' },
  { key: 'oosCount', header: 'OOS Count' },
  { key: 'totalCount', header: 'Total' },
]

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function csvEscape(value) {
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function roundOrBlank(v) {
  return v === null || v === undefined || Number.isNaN(v) ? '' : Math.round(v * 100) / 100
}

function buildStatsRows(stats, faceConfig, faceNames) {
  return faceNames.map((faceName) => {
    const s = stats[faceName]
    const { lsl, usl } = faceConfig[faceName]
    return {
      face: faceName,
      lsl,
      usl,
      avg: roundOrBlank(s.avg),
      stdDev: roundOrBlank(s.stdDev),
      min: roundOrBlank(s.min),
      max: roundOrBlank(s.max),
      range: roundOrBlank(s.range),
      cp: roundOrBlank(s.cp),
      cpk: roundOrBlank(s.cpk),
      oosCount: s.oosCount,
      totalCount: s.totalCount,
    }
  })
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10)
}

export function exportStatsCsv(stats, faceConfig, faceNames, meta) {
  const rows = buildStatsRows(stats, faceConfig, faceNames)
  const lines = [
    STATS_COLUMNS.map((c) => csvEscape(c.header)).join(','),
    ...rows.map((row) => STATS_COLUMNS.map((c) => csvEscape(row[c.key])).join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `dft-stats-${meta?.viewMode ?? 'export'}-${dateStamp()}.csv`)
}

/**
 * @param {object} opts
 * @param {object} opts.stats - result of computeStats()
 * @param {object} opts.faceConfig - effective face config (with any spec-limit overrides applied)
 * @param {string[]} opts.faceNames
 * @param {object} opts.meta - { viewMode, faceModeLabel, filtersLabel }
 * @param {HTMLElement|null} opts.chartsEl - DOM node to capture as an image (e.g. the charts grid)
 */
export async function exportPdfReport({ stats, faceConfig, faceNames, meta, chartsEl }) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  const html2canvas = (await import('html2canvas')).default

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 32
  let y = margin

  doc.setFontSize(14)
  doc.text('DFT Analyzer — Report', margin, y)
  y += 18

  doc.setFontSize(9)
  doc.setTextColor(100)
  const metaLine = [
    `View: ${meta?.viewMode === 'daily' ? 'Day' : meta?.viewMode === 'monthly' ? 'Month' : '—'}`,
    `Face mode: ${meta?.faceModeLabel ?? '—'}`,
    `Filters: ${meta?.filtersLabel ?? 'None'}`,
    `Exported: ${new Date().toLocaleString()}`,
  ].join('   ·   ')
  doc.text(metaLine, margin, y)
  y += 14
  doc.setTextColor(20)

  const rows = buildStatsRows(stats, faceConfig, faceNames)
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [STATS_COLUMNS.map((c) => c.header)],
    body: rows.map((row) => STATS_COLUMNS.map((c) => row[c.key])),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [21, 20, 21] },
  })

  y = doc.lastAutoTable.finalY + 20

  if (chartsEl) {
    const canvas = await html2canvas(chartsEl, { backgroundColor: '#ffffff', scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const imgWidth = pageWidth - margin * 2
    const imgHeight = (canvas.height / canvas.width) * imgWidth

    if (y + imgHeight > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
    doc.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight)
  }

  doc.save(`dft-report-${meta?.viewMode ?? 'export'}-${dateStamp()}.pdf`)
}
