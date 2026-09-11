import * as XLSX from 'xlsx'
import { isDailyFile, parseDailyFile } from './dailyFileParser.js'
import { isMonthlyFile, parseMonthlyFile } from './monthlyFileParser.js'

/**
 * Auto-detect file type and parse an Excel file into normalized records.
 *
 * @param {ArrayBuffer|Uint8Array} data - Raw file bytes
 * @returns {{ type: 'daily'|'monthly', records: object[], products: string[] }}
 * @throws {Error} if the file format is not recognized
 */
export function parseFile(data) {
  const workbook = XLSX.read(data, { type: 'array' })

  if (isDailyFile(workbook)) {
    return parseDailyFile(workbook)
  }

  if (isMonthlyFile(workbook)) {
    return parseMonthlyFile(workbook)
  }

  throw new Error(
    `Unrecognized file format. Expected a daily file with "RAW DATA" sheet ` +
    `or a monthly file with a "Month" header row. ` +
    `Found sheets: ${workbook.SheetNames.join(', ')}`
  )
}
