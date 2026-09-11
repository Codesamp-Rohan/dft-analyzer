import { useMemo } from 'react'
import useStore, { getHangerNumbers } from '../state/store.js'

export default function FilterBar({ activeRecords }) {
  const activeView = useStore((s) => s.activeView)
  const filters = useStore((s) => s.filters)
  const products = useStore((s) => s.products)
  const setFilter = useStore((s) => s.setFilter)
  const clearFilters = useStore((s) => s.clearFilters)

  const hangerNumbers = useMemo(
    () => getHangerNumbers(activeRecords),
    [activeRecords]
  )

  if (!activeView) return null

  const hasActiveFilters = filters.hangerNo || filters.product

  return (
    <div className="border border-border p-4 sm:p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <span className="text-sm sm:text-base font-medium shrink-0">Filters</span>

      {/* Hanger No. */}
      <select
        value={filters.hangerNo}
        onChange={(e) => setFilter('hangerNo', e.target.value)}
        className="border border-border bg-background text-foreground px-3 py-2 text-sm sm:text-base min-w-0"
      >
        <option value="">All Hangers</option>
        {hangerNumbers.map((h) => (
          <option key={h} value={h}>
            Hanger {h}
          </option>
        ))}
      </select>

      {/* Product — only for daily view */}
      {activeView === 'daily' && products.length > 0 && (
        <select
          value={filters.product}
          onChange={(e) => setFilter('product', e.target.value)}
          className="border border-border bg-background text-foreground px-3 py-2 text-sm sm:text-base min-w-0"
        >
          <option value="">All Products</option>
          {products.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      )}

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="border border-border px-3 py-2 text-sm sm:text-base text-muted hover:text-foreground"
        >
          Clear
        </button>
      )}
    </div>
  )
}
