# DFT Analyzer

Offline desktop app (Electron + React) for importing DFT Excel exports
(daily or monthly) and viewing them as charts against spec limits.

## Stack
- Electron (offline shell, native file dialogs)
- React + Vite
- Tailwind CSS v4
- SheetJS (`xlsx`) for parsing
- Recharts for charts
- Zustand for state

## Project layout
```
electron/         Main process (window, file-open dialog) + preload bridge
src/parsing/       Excel -> normalized record parsers (daily/monthly layouts)
src/aggregation/   Stats: avg/std/range vs LSL/USL, spec-flagging
src/components/    UI: upload panel, view toggle, filters, charts, tables
src/state/         Zustand store
```

## Getting started
```bash
npm install
npm run electron:dev   # runs Vite + Electron together, with hot reload
```

## Build a distributable
```bash
npm run electron:build
```
Output goes to `release/`.

## Status
Setup verified: Electron's native file-open dialog reads Excel file bytes
via IPC and hands them to the React renderer (see `src/App.jsx`).
Parsing, aggregation, and dashboard UI are the next pass.
