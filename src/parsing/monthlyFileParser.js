import * as XLSX from 'xlsx'
import { normalizeRecord } from './normalize.js'

/**
 * Check whether a workbook is a monthly DFT analysis file.
 * Signature: has a sheet (usually "Sheet1") where one of the first 10 rows
 * starts with "Month" in its first non-empty cell.
 */
export function isMonthlyFile(workbook) {
  for (const name of workbook.SheetNames) {
    const ws = workbook.Sheets[name]
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
    for (let i = 0; i < Math.min(15, raw.length); i++) {
      const row = raw[i]
      // Find the first non-empty cell in the row
      const firstNonEmpty = row.find(c => c !== '' && c !== null && c !== undefined)
      if (firstNonEmpty === 'Month') return true
    }
  }
  return false
}

/**
 * Parse a monthly DFT analysis workbook.
 *
 * Expected layout:
 *   Rows 0-5:  summary block (LSL/USL, Min/Max/Avg/Std/Range) — SKIP
 *   Row 6:     blank
 *   Row 7:     header → [Month, Date, Hanger No., Time, Barcode No, 1, 2, 3, 4, 5, 6, 7, 8]
 *   Rows 8+:   data (Month column may be empty — forward-fill from last non-empty)
 *
 * @param {object} workbook - XLSX workbook object
 * @returns {{ type: 'monthly', records: object[], products: string[] }}
 */
export function parseMonthlyFile(workbook) {
  // Find the data sheet — use the first sheet that has a "Month" header
  let ws = null
  let raw = null

  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name]
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
    for (let i = 0; i < Math.min(15, data.length); i++) {
      const firstNonEmpty = data[i].find(c => c !== '' && c !== null && c !== undefined)
      if (firstNonEmpty === 'Month') {
        ws = sheet
        raw = data
        break
      }
    }
    if (ws) break
  }

  if (!ws) {
    throw new Error('Could not find data header row in monthly file')
  }

  // Find the header row index
  let headerIdx = -1
  for (let i = 0; i < raw.length; i++) {
    const firstNonEmpty = raw[i].find(c => c !== '' && c !== null && c !== undefined)
    if (firstNonEmpty === 'Month') {
      headerIdx = i
      break
    }
  }

  // Parse data rows (everything after the header)
  const records = []
  let lastMonth = ''

  for (let i = headerIdx + 1; i < raw.length; i++) {
    const row = raw[i]
    if (!row || row.every(c => c === '' || c === null || c === undefined)) continue

    // Forward-fill Month
    const monthVal = row[0]
    if (monthVal !== '' && monthVal !== null && monthVal !== undefined) {
      lastMonth = String(monthVal)
    }

    const record = normalizeRecord({
      date: row[1],         // Date column — may be serial or string
      hangerNo: row[2],
      time: row[3],
      barcodeNo: row[4],
      product: null,        // No product column in monthly file
      measurements: row.slice(5, 13), // columns 1–8 (indices 5–12)
    })

    if (record) {
      record.month = lastMonth
      records.push(record)
    }
  }

  return { type: 'monthly', records, products: [] }
}
