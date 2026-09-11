/**
 * Compute per-face statistics for a set of records.
 *
 * @param {object[]} records - Array of normalized records with .measurements
 * @param {object} faceConfig - Face config map, e.g. FACE_CONFIGS.standard
 * @param {string[]} faceNames - Ordered face names to compute, e.g. getFaceNames(mode)
 * @returns {Object<string, { avg: number, stdDev: number, min: number, max: number, range: number, cp: number|null, cpk: number|null, oosCount: number, totalCount: number }>}
 */
export function computeStats(records, faceConfig, faceNames) {
  const result = {}

  for (const faceName of faceNames) {
    const { keys, lsl, usl } = faceConfig[faceName]

    // Collect all valid measurement values for this face
    const values = []
    for (const record of records) {
      for (const key of keys) {
        const v = record.measurements[key]
        if (v !== null && v !== undefined && !isNaN(v)) {
          values.push(v)
        }
      }
    }

    if (values.length === 0) {
      result[faceName] = {
        avg: null,
        stdDev: null,
        min: null,
        max: null,
        range: null,
        cp: null,
        cpk: null,
        oosCount: 0,
        totalCount: 0,
      }
      continue
    }

    const sum = values.reduce((a, b) => a + b, 0)
    const avg = sum / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)

    // Population standard deviation
    const sqDiffSum = values.reduce((acc, v) => acc + (v - avg) ** 2, 0)
    const stdDev = Math.sqrt(sqDiffSum / values.length)

    // Out-of-spec count
    const oosCount = values.filter(v => v < lsl || v > usl).length

    // Process capability indices — undefined when there's no spread to measure against.
    const cp = stdDev > 0 ? (usl - lsl) / (6 * stdDev) : null
    const cpk = stdDev > 0
      ? Math.min((usl - avg) / (3 * stdDev), (avg - lsl) / (3 * stdDev))
      : null

    result[faceName] = {
      avg,
      stdDev,
      min,
      max,
      range: max - min,
      cp,
      cpk,
      oosCount,
      totalCount: values.length,
    }
  }

  return result
}

/**
 * Compute per-record face averages for trend charting.
 * Returns an array of { index, date, time, <faceName>: avg, ... } for each face in faceNames.
 *
 * @param {object[]} records
 * @param {object} faceConfig - Face config map, e.g. FACE_CONFIGS.standard
 * @param {string[]} faceNames - Ordered face names to compute, e.g. getFaceNames(mode)
 */
export function computeTrendData(records, faceConfig, faceNames) {
  return records.map((record, index) => {
    const point = {
      index,
      date: record.date,
      time: record.time,
      label: `${record.date || ''} ${record.time || ''}`.trim() || String(index),
    }

    for (const faceName of faceNames) {
      const { keys } = faceConfig[faceName]
      const values = keys
        .map(k => record.measurements[k])
        .filter(v => v !== null && v !== undefined && !isNaN(v))

      point[faceName] = values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : null
    }

    return point
  })
}
