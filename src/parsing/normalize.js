import * as XLSX from 'xlsx'

/**
 * Convert an Excel serial date number to a "YYYY-MM-DD" string.
 * Excel epoch: 1900-01-01 is serial 1 (with the Lotus 1-2-3 leap-year bug).
 */
export function excelSerialToDate(serial) {
  if (typeof serial === 'string') {
    // Already a string like "01.07.2026" or "14.04.2026" — normalise to YYYY-MM-DD
    const parts = serial.split('.')
    if (parts.length === 3) {
      const [d, m, y] = parts
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
    return serial // return as-is if we can't parse
  }

  if (typeof serial !== 'number' || isNaN(serial)) return null

  // Use SheetJS's built-in utility
  const dateObj = XLSX.SSF.parse_date_code(serial)
  if (!dateObj) return null
  const y = String(dateObj.y)
  const m = String(dateObj.m).padStart(2, '0')
  const d = String(dateObj.d).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Convert an Excel time fraction (0–1) to an "HH:MM" string.
 */
export function excelTimeToString(fraction) {
  if (typeof fraction !== 'number' || isNaN(fraction)) return null
  const totalMinutes = Math.round(fraction * 24 * 60)
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
  const min = String(totalMinutes % 60).padStart(2, '0')
  return `${h}:${min}`
}

/**
 * Coerce a value to a number, returning null if it can't be parsed.
 */
function toNum(v) {
  if (v === '' || v === null || v === undefined) return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

/**
 * Normalize a raw row (array of cell values) into the canonical record shape.
 *
 * @param {object} opts
 * @param {string|number} opts.date     - Date string or Excel serial
 * @param {number|string} opts.hangerNo
 * @param {number}        opts.time     - Excel time fraction
 * @param {number|string} opts.barcodeNo
 * @param {string|null}   opts.product  - Product code or null
 * @param {Array}         opts.measurements - Array of 8 raw measurement values
 * @returns {object|null} Normalized record, or null if invalid
 */
export function normalizeRecord({ date, hangerNo, time, barcodeNo, product, measurements }) {
  const dateStr = excelSerialToDate(date)
  const timeStr = excelTimeToString(time)

  // Build measurements object m1..m8
  const m = {}
  for (let i = 0; i < 8; i++) {
    m[`m${i + 1}`] = toNum(measurements[i])
  }

  // Skip rows where all measurements are null (empty trailing rows)
  const hasAnyMeasurement = Object.values(m).some(v => v !== null)
  if (!hasAnyMeasurement) return null

  return {
    date: dateStr,
    hangerNo: hangerNo != null && hangerNo !== '' ? String(hangerNo) : null,
    time: timeStr,
    barcodeNo: barcodeNo != null && barcodeNo !== '' ? String(barcodeNo) : null,
    product: product && String(product).trim() !== '' ? String(product).trim() : null,
    measurements: m,
  }
}
