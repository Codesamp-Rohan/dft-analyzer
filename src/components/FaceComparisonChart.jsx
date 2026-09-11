import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts'
const TEAL = '#1d9e75'
const RED = '#e24b4a'
const AMBER = '#ba7517'

function getBarColor(avg, lsl, usl) {
  if (avg === null) return 'var(--muted)'
  if (avg < lsl || avg > usl) return RED
  // Near limit: within 10% of range from either boundary
  const range = usl - lsl
  const margin = range * 0.1
  if (avg < lsl + margin || avg > usl - margin) return AMBER
  return TEAL
}

export default function FaceComparisonChart({ stats, faceConfig, faceNames }) {
  const chartData = faceNames.map((faceName) => {
    const { avg } = stats[faceName]
    const { lsl, usl } = faceConfig[faceName]
    return {
      face: faceName,
      avg: avg != null ? Math.round(avg * 100) / 100 : 0,
      lsl,
      usl,
      color: getBarColor(avg, lsl, usl),
    }
  })

  const hasData = chartData.some((d) => d.avg > 0)

  if (!hasData) {
    return (
      <div className="border border-border p-4 sm:p-6">
        <h3 className="text-sm sm:text-base font-medium mb-2">Face Comparison</h3>
        <p className="text-sm text-muted">No data to display. Import a file first.</p>
      </div>
    )
  }

  // Collect unique reference lines
  const refLines = []
  const seenLimits = new Set()
  for (const d of chartData) {
    if (!seenLimits.has(`lsl-${d.lsl}`)) {
      seenLimits.add(`lsl-${d.lsl}`)
      refLines.push({ value: d.lsl, label: `LSL ${d.lsl}` })
    }
    if (!seenLimits.has(`usl-${d.usl}`)) {
      seenLimits.add(`usl-${d.usl}`)
      refLines.push({ value: d.usl, label: `USL ${d.usl}` })
    }
  }

  return (
    <div className="border border-border p-4 sm:p-6">
      <h3 className="text-sm sm:text-base font-medium mb-4">
        Face Comparison — Average
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="face"
            tick={{ fontSize: 12, fill: 'var(--foreground)' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--muted)' }}
            domain={[0, 'auto']}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--background)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              fontSize: '12px',
            }}
            formatter={(value) => [value.toFixed(2), 'Average']}
          />

          {refLines.map((rl) => (
            <ReferenceLine
              key={rl.label}
              y={rl.value}
              stroke="var(--muted)"
              strokeDasharray="6 3"
              strokeOpacity={0.6}
              label={{
                value: rl.label,
                position: 'right',
                fontSize: 10,
                fill: 'var(--muted)',
              }}
            />
          ))}

          <Bar dataKey="avg" name="Average" maxBarSize={80}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
