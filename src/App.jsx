import { useMemo, useRef, useState } from 'react'
import useStore, { getActiveRecords, getFilteredRecords } from './state/store.js'
import { computeStats, computeTrendData } from './aggregation/statsCalculator.js'
import { FACE_MODES, getFaceNames, getEffectiveFaceConfig } from './aggregation/faceConfig.js'
import UploadPanel from './components/UploadPanel.jsx'
import FilterBar from './components/FilterBar.jsx'
import TrendChart from './components/TrendChart.jsx'
import FaceComparisonChart from './components/FaceComparisonChart.jsx'
import StatsTable from './components/StatsTable.jsx'
import SpecLimitsPanel from './components/SpecLimitsPanel.jsx'
import BarcodeLookup from './components/BarcodeLookup.jsx'
import ExportControls from './components/ExportControls.jsx'
import secureLogo from './assets/secureLogo.png'

function ViewToggle() {
  const activeView = useStore((s) => s.activeView)
  const datasets = useStore((s) => s.datasets)
  const setActiveView = useStore((s) => s.setActiveView)

  const views = [
    { key: 'daily', label: 'Day', available: !!datasets.daily },
    { key: 'monthly', label: 'Month', available: !!datasets.monthly },
  ]

  return (
    <div className="flex border border-border">
      {views.map((v) => (
        <button
          key={v.key}
          onClick={() => v.available && setActiveView(v.key)}
          disabled={!v.available}
          className={`px-4 py-2 text-sm sm:text-base font-medium transition-colors ${activeView === v.key
            ? 'bg-black text-white'
            : v.available
              ? 'hover:bg-black/5'
              : 'text-muted opacity-50 cursor-not-allowed'
            }`}
        >
          {v.label}
        </button>
      ))}
    </div>
  )
}

function FaceModeToggle() {
  const faceMode = useStore((s) => s.faceMode)
  const setFaceMode = useStore((s) => s.setFaceMode)

  return (
    <div className="flex border border-border">
      {FACE_MODES.map((m) => (
        <button
          key={m.key}
          onClick={() => setFaceMode(m.key)}
          className={`px-4 py-2 text-sm sm:text-base font-medium transition-colors ${faceMode === m.key ? 'bg-black text-white' : 'hover:bg-black/5'
            }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}

export default function App() {
  const activeView = useStore((s) => s.activeView)
  const datasets = useStore((s) => s.datasets)
  const filters = useStore((s) => s.filters)
  const faceMode = useStore((s) => s.faceMode)
  const specLimits = useStore((s) => s.specLimits)

  const [specPanelOpen, setSpecPanelOpen] = useState(false)
  const chartsRef = useRef(null)

  const faceConfig = useMemo(
    () => getEffectiveFaceConfig(faceMode, specLimits),
    [faceMode, specLimits]
  )
  const faceNames = useMemo(() => getFaceNames(faceMode), [faceMode])

  const activeRecords = useMemo(
    () => getActiveRecords(datasets, activeView),
    [datasets, activeView]
  )

  const filteredRecords = useMemo(
    () => getFilteredRecords(activeRecords, filters, activeView),
    [activeRecords, filters, activeView]
  )

  const stats = useMemo(
    () => computeStats(filteredRecords, faceConfig, faceNames),
    [filteredRecords, faceConfig, faceNames]
  )
  const trendData = useMemo(
    () => computeTrendData(filteredRecords, faceConfig, faceNames),
    [filteredRecords, faceConfig, faceNames]
  )

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 sm:px-8 sm:py-4 flex items-center justify-between">
        <h1 className="text-base sm:text-lg font-semibold">DFT Analyzer</h1>
        <div className="flex items-center gap-4">
          <FaceModeToggle />
          <ViewToggle />
          <button
            onClick={() => setSpecPanelOpen(true)}
            title="Edit spec limits"
            aria-label="Edit spec limits"
            className="w-9 h-9 flex items-center justify-center border border-border hover:bg-black/5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col gap-0 p-4 sm:p-8 pb-16 sm:pb-16">
        {/* Upload */}
        <UploadPanel />

        {activeView && (
          <>
            {/* Filters */}
            <div className="mt-4">
              <FilterBar activeRecords={activeRecords} />
            </div>

            {/* Record count summary + export */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs sm:text-sm text-muted">
                Showing {filteredRecords.length.toLocaleString()} records
              </p>
              <ExportControls
                stats={stats}
                faceConfig={faceConfig}
                faceNames={faceNames}
                chartsRef={chartsRef}
                meta={{
                  viewMode: activeView,
                  faceModeLabel: FACE_MODES.find((m) => m.key === faceMode)?.label ?? faceMode,
                  filtersLabel:
                    [
                      filters.hangerNo ? `Hanger ${filters.hangerNo}` : null,
                      filters.product ? `Product ${filters.product}` : null,
                    ]
                      .filter(Boolean)
                      .join(', ') || 'None',
                }}
              />
            </div>

            {/* Charts grid */}
            <div ref={chartsRef} className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TrendChart trendData={trendData} faceConfig={faceConfig} faceNames={faceNames} />
              <FaceComparisonChart stats={stats} faceConfig={faceConfig} faceNames={faceNames} />
            </div>

            {/* Stats table */}
            <div className="mt-4">
              <StatsTable stats={stats} faceConfig={faceConfig} faceNames={faceNames} />
            </div>

            {/* Barcode lookup */}
            <div className="mt-4">
              <BarcodeLookup activeRecords={activeRecords} faceConfig={faceConfig} faceNames={faceNames} />
            </div>
          </>
        )}

        {/* Empty state */}
        {!activeView && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm sm:text-base text-muted">
              Open an Excel file to get started.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 inset-x-0 z-10 border-t border-border bg-background px-4 py-4 sm:px-8 flex items-center gap-2 justify-between">
        <img src={secureLogo} alt="Secure" className="h-7 w-auto" />
        <span className="text-s text-bold text-muted">Designed & Developed by Projects Team - SND</span>
      </footer>

      <SpecLimitsPanel open={specPanelOpen} onClose={() => setSpecPanelOpen(false)} />
    </div>
  )
}
