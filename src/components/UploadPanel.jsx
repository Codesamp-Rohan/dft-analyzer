import { useRef } from 'react'
import useStore from '../state/store.js'
import Spinner from './Spinner.jsx'

const hasElectronApi = typeof window !== 'undefined' && window.dftApi

export default function UploadPanel() {
  const importing = useStore((s) => s.importing)
  const importError = useStore((s) => s.importError)
  const activeView = useStore((s) => s.activeView)
  const datasets = useStore((s) => s.datasets)
  const importFile = useStore((s) => s.importFile)
  const fileInputRef = useRef(null)

  async function handleOpen() {
    if (hasElectronApi) {
      // Electron path: native file dialog via IPC
      const result = await window.dftApi.openExcelFile()
      if (!result) return
      importFile(result)
    } else {
      // Browser fallback: trigger hidden file input
      fileInputRef.current?.click()
    }
  }

  async function handleFileInput(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const arrayBuffer = await file.arrayBuffer()
    importFile({
      filePath: file.name,
      fileName: file.name,
      data: new Uint8Array(arrayBuffer),
    })
    // Reset so the same file can be re-selected
    e.target.value = ''
  }

  const activeDataset = activeView ? datasets[activeView] : null
  const recordCount = activeDataset ? activeDataset.records.length : 0

  return (
    <div className="border border-border px-4 py-3 sm:p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <h2 className="text-base sm:text-lg font-medium">Import Data</h2>
        {activeDataset && (
          <p className="text-sm sm:text-base text-muted">
            <span className="font-medium text-foreground">{activeDataset.fileName}</span>
            {' · '}
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-signal-teal" />
              {activeView === 'daily' ? 'Daily' : 'Monthly'}
            </span>
            {' · '}
            {recordCount.toLocaleString()} records
          </p>
        )}
        {importError && (
          <p className="text-sm text-signal-red">{importError}</p>
        )}
      </div>

      {/* Hidden file input for browser fallback */}
      {!hasElectronApi && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileInput}
          className="hidden"
        />
      )}

      <button
        onClick={handleOpen}
        disabled={importing}
        className="bg-black text-white px-4 py-2 text-sm sm:text-base font-medium disabled:opacity-50 whitespace-nowrap"
      >
        {importing ? (
          <span className="inline-flex items-center gap-2">
            <Spinner /> Parsing…
          </span>
        ) : (
          'Upload Excel File'
        )}
      </button>
    </div>
  )
}
