import * as XLSX from 'xlsx'
import { normalizeRecord } from './normalize.js'

/**
 * Check whether a workbook is a daily DFT file.
 * Signature: has a sheet named "RAW DATA" whose row-4 header contains "Product".
 */
export function isDailyFile(workbook) {
  return workbook.SheetNames.includes('RAW DATA')
}

/**
 * Parse a daily DFT Excel workbook.
 *
 * Expected layout of sheet "RAW DATA":
 *   Rows 0-3: title/metadata rows (skip)
 *   Row 4:    header → [Date, Hanger No., Time, Barcode No, 1, 2, 3, 4, 5, 6, 7, 8, Product]
 *   Rows 5+:  data
 *
 * Sheet "LOV" (optional): single-column list of valid Product values.
 *
 * @param {object} workbook - XLSX workbook object
 * @returns {{ type: 'daily', records: object[], products: string[] }}
 */
export function parseDailyFile(workbook) {
  const ws = workbook.Sheets['RAW DATA']
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  // Header is at index 4
  // Data starts at index 5
  const records = []
  for (let i = 5; i < raw.length; i++) {
    const row = raw[i]
    // Skip empty rows
    if (!row || row.every(c => c === '' || c === null || c === undefined)) continue

    const record = normalizeRecord({
      date: row[0],
      hangerNo: row[1],
      time: row[2],
      barcodeNo: row[3],
      product: row[12], // column M
      measurements: row.slice(4, 12), // columns 1–8 (indices 4–11)
    })

    if (record) records.push(record)
  }

  // Extract product list from LOV sheet if present
  let products = []
  if (workbook.SheetNames.includes('LOV')) {
    const lovSheet = workbook.Sheets['LOV']
    const lovData = XLSX.utils.sheet_to_json(lovSheet, { header: 1, defval: '' })
    products = lovData
      .map(row => (row[0] != null ? String(row[0]).trim() : ''))
      .filter(v => v !== '')
  }

  return { type: 'daily', records, products }
}
