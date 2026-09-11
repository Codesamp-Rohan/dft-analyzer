import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
  Brush,
} from 'recharts'

// Zoom in/out this fraction of the current visible span per step (wheel notch or button click).
const ZOOM_STEP = 0.2

// Slim drag handle for the Brush's range selector — a small rounded bar.
function ZoomTraveller({ x, y, width, height }) {
  const barWidth = Math.min(4, width)
  const barX = x + (width - barWidth) / 2
  return (
    <rect
      x={barX}
      y={y + height * 0.2}
      width={barWidth}
      height={height * 0.6}
      rx={barWidth / 2}
      fill="var(--muted)"
      style={{ cursor: 'ew-resize' }}
    />
  )
}

export default function TrendChart({ trendData, faceConfig, faceNames }) {
  const [range, setRange] = useState(null) // { startIndex, endIndex } | null = full range
  if (!trendData || trendData.length === 0) {
    return (
      <div className="border border-border p-4 sm:p-6">
        <h3 className="text-sm sm:text-base font-medium mb-2">Trend Chart</h3>
        <p className="text-sm text-muted">No data to display. Import a file first.</p>
      </div>
    )
  }

  // Collect all unique LSL/USL values for reference lines
  const refLines = []
  const seenLimits = new Set()
  for (const faceName of faceNames) {
    const { lsl, usl, color } = faceConfig[faceName]
    const lslKey = `lsl-${lsl}`
    const uslKey = `usl-${usl}`
    if (!seenLimits.has(lslKey)) {
      seenLimits.add(lslKey)
      refLines.push({ value: lsl, label: `LSL ${lsl}`, color })
    }
    if (!seenLimits.has(uslKey)) {
      seenLimits.add(uslKey)
      refLines.push({ value: usl, label: `USL ${usl}`, color })
    }
  }

  const total = trendData.length
  const startIndex = range?.startIndex ?? 0
  const endIndex = range?.endIndex ?? total - 1
  const isZoomed = startIndex !== 0 || endIndex !== total - 1

  // For large visible ranges, only show every Nth tick label
  const visibleCount = endIndex - startIndex + 1
  const tickInterval = visibleCount > 50 ? Math.floor(visibleCount / 20) : 0

  function handleBrushChange(r) {
    if (!r || r.startIndex == null || r.endIndex == null) return
    if (r.startIndex === 0 && r.endIndex === total - 1) {
      setRange(null)
    } else {
      setRange({ startIndex: r.startIndex, endIndex: r.endIndex })
    }
  }

  function zoomBy(factor, center = (startIndex + endIndex) / 2) {
    if (total < 2) return
    const span = endIndex - startIndex
    const newSpan = Math.max(4, Math.min(total - 1, span * factor))

    let newStart = Math.round(center - newSpan / 2)
    let newEnd = Math.round(center + newSpan / 2)
    if (newStart < 0) {
      newEnd -= newStart
      newStart = 0
    }
    if (newEnd > total - 1) {
      newStart -= newEnd - (total - 1)
      newEnd = total - 1
    }
    newStart = Math.max(0, newStart)
    newEnd = Math.min(total - 1, newEnd)

    if (newStart === 0 && newEnd === total - 1) {
      setRange(null)
    } else {
      setRange({ startIndex: newStart, endIndex: newEnd })
    }
  }

  function handleWheel(e) {
    if (total < 2) return
    e.preventDefault()
    zoomBy(e.deltaY < 0 ? 1 - ZOOM_STEP : 1 + ZOOM_STEP)
  }

  return (
    <div className="border border-border p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mb-4">
        <h3 className="text-sm sm:text-base font-medium">
          Measurement Trend — Per-Face Average
        </h3>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs text-muted tabular-nums">
            {isZoomed
              ? `${visibleCount.toLocaleString()} / ${total.toLocaleString()} samples`
              : `${total.toLocaleString()} samples`}
          </span>
          <div className="flex items-center border border-border divide-x divide-border">
            <button
              onClick={() => zoomBy(1 + ZOOM_STEP)}
              disabled={!isZoomed}
              title="Zoom out"
              aria-label="Zoom out"
              className="w-7 h-7 flex items-center justify-center text-sm leading-none disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5"
            >
              −
            </button>
            <button
              onClick={() => zoomBy(1 - ZOOM_STEP)}
              disabled={visibleCount <= 4}
              title="Zoom in"
              aria-label="Zoom in"
              className="w-7 h-7 flex items-center justify-center text-sm leading-none disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5"
            >
              +
            </button>
          </div>
          <button
            onClick={() => setRange(null)}
            disabled={!isZoomed}
            className="text-xs px-2 py-1.5 border border-border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5"
          >
            Reset zoom
          </button>
        </div>
      </div>
      <div onWheel={handleWheel} title="Scroll to zoom">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="index"
              tick={{ fontSize: 11, fill: 'var(--muted)' }}
              interval={tickInterval}
              label={{ value: 'Sample #', position: 'insideBottom', offset: -2, fontSize: 11, fill: 'var(--muted)' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--muted)' }}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--background)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
                fontSize: '12px',
              }}
              formatter={(value) => value != null ? value.toFixed(2) : '—'}
              labelFormatter={(idx) => {
                const p = trendData[idx]
                return p ? `#${idx} · ${p.date || ''} ${p.time || ''}` : `#${idx}`
              }}
            />
            <Legend
              verticalAlign="top"
              height={28}
              wrapperStyle={{ fontSize: '12px', color: 'var(--foreground)' }}
            />

            {/* Reference lines for LSL/USL */}
            {refLines.map((rl) => (
              <ReferenceLine
                key={rl.label}
                y={rl.value}
                stroke={rl.color}
                strokeDasharray="6 3"
                strokeOpacity={0.7}
                label={{
                  value: rl.label,
                  position: 'right',
                  fontSize: 10,
                  fill: rl.color,
                }}
              />
            ))}

            {/* One line per face */}
            {faceNames.map((faceName) => (
              <Line
                key={faceName}
                type="monotone"
                dataKey={faceName}
                stroke={faceConfig[faceName].color}
                strokeWidth={1.5}
                dot={false}
                connectNulls
                name={faceName}
              />
            ))}

            <Brush
              dataKey="index"
              startIndex={startIndex}
              endIndex={endIndex}
              onChange={handleBrushChange}
              height={22}
              gap={1}
              fill="var(--background)"
              stroke="var(--border)"
              travellerWidth={10}
              traveller={ZoomTraveller}
              tickFormatter={(idx) => {
                const p = trendData[idx]
                return p ? p.label : String(idx)
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
