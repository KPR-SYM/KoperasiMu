import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Warning, Archive, ArrowsLeftRight, ArrowsDownUp, Calendar, CheckCircle, Clock, FileXls, FileText, FileArrowUp, Tag, TextH, SlidersHorizontal, Users, DotsSixVertical, Eye, EyeSlash } from '@phosphor-icons/react'

import { Modal } from '@shared/components'

const COLUMN_DEFS = [
    { key: 'academic_year', label: 'Tahun Pelajaran', icon: Calendar },
    { key: 'semester', label: 'Semester', icon: TextH },
    { key: 'start_date', label: 'Mulai', icon: Calendar },
    { key: 'end_date', label: 'Selesai', icon: Clock },
    { key: 'is_active', label: 'Status Aktif', icon: CheckCircle },
    { key: 'is_locked', label: 'Status Kunci', icon: Archive },
]

const PRESETS = [
    { id: 'all', label: 'Data Lengkap', cols: ['academic_year', 'semester', 'start_date', 'end_date', 'is_active', 'is_locked'] },
    { id: 'general', label: 'Umum', cols: ['academic_year', 'semester', 'is_active'] },
    { id: 'schedule', label: 'Jadwal', cols: ['academic_year', 'semester', 'start_date', 'end_date'] },
]

const DEFAULT_COLUMNS = ['academic_year', 'semester']
const ALL_COLUMN_KEYS = COLUMN_DEFS.map(c => c.key)

const HEADER_OPTIONS = [
    { v: true, l: 'Ya' },
    { v: false, l: 'Tidak' },
]

const ORIENTATION_OPTIONS = [
    { v: 'landscape', l: 'Landscape', icon: ArrowsLeftRight },
    { v: 'portrait', l: 'Portrait', icon: ArrowsDownUp },
]

const PDF_TEMPLATE_OPTIONS = [
    { v: 'ringkas', l: 'Ringkas' },
    { v: 'lengkap', l: 'Lengkap' },
    { v: 'kartu', l: 'Kartu' },
]

const EXPORT_FORMAT_CONFIG = [
    { label: 'CSV', icon: FileXls, desc: 'Universal', color: 'hover:border-slate-400 hover:bg-slate-50', iconColor: 'text-slate-500', format: 'csv' },
    { label: 'Excel', icon: FileXls, desc: '.xlsx', color: 'hover:border-emerald-400 hover:bg-emerald-50 text-emerald-700', iconColor: 'text-emerald-500', format: 'excel' },
    { label: 'PDF', icon: FileText, desc: 'Cetak', color: 'hover:border-rose-400 hover:bg-rose-50 text-rose-700', iconColor: 'text-rose-500', format: 'pdf' },
    { label: 'iCal', icon: Calendar, desc: '.ics', color: 'hover:border-blue-400 hover:bg-blue-50 text-blue-700', iconColor: 'text-blue-500', format: 'ics' },
]

const ColumnToggle = React.memo(({ colKey, label, icon: Icon, exportColumns, onToggle, onReorder, index, dragIdx, onDragStart, onDragOver, onDrop, onDragEnd }) => {
    const orderIdx = exportColumns.indexOf(colKey) + 1
    const isSelected = orderIdx > 0

    const toggleColumn = useCallback(() => onToggle(colKey), [colKey, onToggle])
    const handleDragStart = useCallback((e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(index) }, [index, onDragStart])
    const handleDragOver = useCallback((e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onDragOver(index) }, [index, onDragOver])
    const handleDrop = useCallback((e) => { e.preventDefault(); onDrop(index) }, [index, onDrop])

    return (
        <button
            onClick={toggleColumn}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={onDragEnd}
            draggable={isSelected}
            aria-pressed={isSelected}
            aria-label={`Kolom ${label}${isSelected ? ` (urutan ${orderIdx})` : ''}`}
            className={`group relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border text-left transition-all
                ${isSelected
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)] shadow-sm'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-surface-alt)]'}
                ${dragIdx === index ? 'opacity-40 ring-2 ring-[var(--color-primary)] scale-95' : ''}
            `}
        >
            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all 
                ${isSelected ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)]'}`}>
                <Icon className="w-3 h-3" />
            </div>
            <div className="flex-1 min-w-0">
                <div className={`text-[9px] font-black uppercase tracking-tight truncate ${isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>{label}</div>
            </div>
            {isSelected && (
                <>
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[var(--color-primary)] text-white text-[8px] font-black flex items-center justify-center shadow-md border border-white dark:border-[var(--color-surface)] animate-in zoom-in duration-200">
                        {orderIdx}
                    </div>
                    <div className="opacity-0 group-hover:opacity-40 transition-opacity cursor-grab active:cursor-grabbing">
                        <DotsSixVertical className="w-3 h-3 text-[var(--color-text-muted)]" />
                    </div>
                </>
            )}
        </button>
    )
})

const FORMAT_ICONS = { csv: FileXls, excel: FileXls, pdf: FileText, ics: Calendar }

function ExportOverlay({ format, phase }) {
    const cfg = EXPORT_FORMAT_CONFIG.find(c => c.format === format)
    const Icon = format ? (FORMAT_ICONS[format] || FileArrowUp) : FileArrowUp
    const label = cfg ? `${cfg.label} · ${cfg.desc}` : ''
    const isDone = phase === 'success'

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-surface)]/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative bg-[var(--color-surface)] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)] border border-[var(--color-border)]/40 rounded-[2rem] p-10 flex flex-col items-center gap-5 scale-105 animate-in zoom-in-95 duration-300">
                <div className="absolute -inset-[1px] rounded-[2rem] bg-gradient-to-b from-[var(--color-primary)]/10 via-transparent to-[var(--color-primary)]/5 pointer-events-none"></div>

                {isDone ? (
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping"></div>
                        <div className="absolute inset-0 rounded-full border-[2px] border-emerald-500/10"></div>
                        <div className="absolute inset-0 rounded-full border-[2px] border-emerald-500/20 animate-pulse"></div>
                        <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.4)] z-10 animate-in zoom-in duration-500">
                            <CheckCircle className="text-white w-7 h-7" weight="fill" />
                        </div>
                    </div>
                ) : (
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-[var(--color-primary)]/5 animate-ping" style={{ animationDuration: '2s' }}></div>
                        <div
                            className="absolute inset-0 rounded-full"
                            style={{
                                background: 'conic-gradient(from 0deg, transparent 0%, var(--color-primary) 30%, transparent 60%)',
                                animation: 'spin 1.8s linear infinite',
                                filter: 'blur(1px)',
                                opacity: 0.35,
                            }}
                        ></div>
                        <div className="absolute inset-0 rounded-full border-[2px] border-[var(--color-primary)]/8"></div>
                        <div
                            className="absolute inset-[3px] rounded-full border-[2px] border-transparent border-t-[var(--color-primary)]"
                            style={{ animation: 'spin 1.2s cubic-bezier(0.6,0,0.4,1) infinite', filter: 'drop-shadow(0 0 6px var(--color-primary))' }}
                        ></div>
                        <div
                            className="absolute inset-[6px] rounded-full border-[1.5px] border-transparent border-b-[var(--color-primary)]/40"
                            style={{ animation: 'spin 2s cubic-bezier(0.6,0,0.4,1) infinite reverse' }}
                        ></div>
                        <div className="absolute inset-0 m-auto w-11 h-11 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)]/50 flex items-center justify-center shadow-md z-10">
                            <Icon className="text-[var(--color-primary)] w-5 h-5 animate-pulse" style={{ animationDuration: '1.5s' }} />
                        </div>
                    </div>
                )}

                <div className="flex flex-col items-center gap-2">
                    {isDone ? (
                        <>
                            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-600">Ekspor Berhasil</span>
                            {label && <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">{label}</span>}
                            <span className="text-[7px] font-extrabold text-emerald-500/50 uppercase tracking-[0.2em] animate-pulse">Menutup otomatis...</span>
                        </>
                    ) : (
                        <>
                            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--color-primary)]">Mengekspor Data</span>
                            {label && <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">{label}</span>}
                            <div className="flex items-center gap-1 mt-1">
                                <span className="w-1 h-1 rounded-full bg-[var(--color-primary)] animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.2s' }}></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]/60 animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1.2s' }}></span>
                                <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]/30 animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1.2s' }}></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]/60 animate-bounce" style={{ animationDelay: '600ms', animationDuration: '1.2s' }}></span>
                                <span className="w-1 h-1 rounded-full bg-[var(--color-primary)] animate-bounce" style={{ animationDelay: '800ms', animationDuration: '1.2s' }}></span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function PeriodExportModal(props) {
    const {
        isOpen,
        onClose,
        years,
        selectedIds,
        exportScope,
        setExportScope,
        exportColumns,
        setExportColumns,
        exporting,
        handleExportCSV,
        handleExportExcel,
        handleExportPDF,
        handleExportICS,
        exportError,
        addToast,
        getExportData,
    } = props

    const [fileName, setFileName] = useState(`Data Tahun Pelajaran ${new Date().toISOString().slice(0, 10)}`)
    const [pdfOrientation, setPdfOrientation] = useState('landscape')
    const [includeHeader, setIncludeHeader] = useState(true)
    const [exportTemplate, setExportTemplate] = useState('ringkas')
    const [exportFormat, setExportFormat] = useState(null)
    const [exportPhase, setExportPhase] = useState(null)
    const [allColumnsVisible, setAllColumnsVisible] = useState(false)
    const [dragIdx, setDragIdx] = useState(null)
    const containerRef = useRef(null)
    const exportStartRef = useRef(0)

    useEffect(() => {
        if (exporting && containerRef.current) {
            const scrollContainer = containerRef.current.parentElement
            if (scrollContainer) {
                scrollContainer.scrollTop = 0
            }
        }
    }, [exporting])

    useEffect(() => {
        if (exportPhase === 'loading' && !exporting) {
            if (exportError) {
                setExportPhase(null)
            } else {
                const elapsed = Date.now() - exportStartRef.current
                const remaining = Math.max(0, 2000 - elapsed)
                const timer = setTimeout(() => setExportPhase('success'), remaining)
                return () => clearTimeout(timer)
            }
        }
    }, [exporting, exportPhase, exportError])

    useEffect(() => {
        if (exportPhase === 'success') {
            const timer = setTimeout(() => {
                setExportPhase(null)
                setExportFormat(null)
                onClose()
            }, 1800)
            return () => clearTimeout(timer)
        }
    }, [exportPhase, onClose])

    const activePresetId = useMemo(() => {
        const sortedCols = [...exportColumns].sort().join(',')
        const active = PRESETS.find(preset => {
            const presetSorted = [...preset.cols].sort().join(',')
            return sortedCols === presetSorted
        })
        return active ? active.id : null
    }, [exportColumns])

    const handleToggleColumn = useCallback((key) => {
        setExportColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
    }, [])

    const handleReorderColumn = useCallback((from, to) => {
        if (from === to) return
        setExportColumns(prev => {
            const next = [...prev]
            const [moved] = next.splice(from, 1)
            next.splice(to, 0, moved)
            return next
        })
    }, [])

    const handleDragStart = useCallback((idx) => { setDragIdx(idx) }, [])
    const handleDragOver = useCallback((_idx) => { /* drag-over tracking: child already calls e.preventDefault() */ }, [])
    const handleDrop = useCallback((idx) => {
        if (dragIdx !== null && dragIdx !== idx) handleReorderColumn(dragIdx, idx)
        setDragIdx(null)
    }, [dragIdx, handleReorderColumn])
    const handleDragEnd = useCallback(() => { setDragIdx(null) }, [])

    const handlePresetClick = useCallback((cols) => setExportColumns(cols), [setExportColumns])

    const scopeOptions = useMemo(() => [
        { val: 'filtered', label: 'Filter Aktif', desc: `${years.length} periode`, icon: SlidersHorizontal, disabled: false },
        { val: 'selected', label: 'Dipilih', desc: `${selectedIds.length} periode`, icon: CheckCircle, disabled: selectedIds.length === 0 },
        { val: 'all', label: 'Semua', desc: 'Tanpa filter', icon: Users, disabled: false },
    ], [years.length, selectedIds.length])

    const exportOptions = useMemo(() => ({
        includeHeader,
        orientation: pdfOrientation,
        template: exportTemplate,
    }), [includeHeader, pdfOrientation, exportTemplate])

    const exportPreviewData = useMemo(() => {
        try {
            const allRows = getExportData()
            return { rows: allRows.slice(0, 5), total: allRows.length }
        } catch { return { rows: [], total: 0 } }
    }, [getExportData])

    const exportHandlers = useMemo(() => ({
        csv: handleExportCSV,
        excel: handleExportExcel,
        pdf: handleExportPDF,
        ics: handleExportICS,
    }), [handleExportCSV, handleExportExcel, handleExportPDF, handleExportICS])

    if (!isOpen) return null

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Export Data Tahun Pelajaran"
            description="Cadangkan atau pindahkan data periode akademik ke format CSV, Excel, atau PDF."
            icon={FileArrowUp}
            iconBg="bg-amber-500/10"
            iconColor="text-amber-600"
            size="lg"
            mobileVariant="bottom-sheet"
            contentClassName={exporting ? 'relative !overflow-hidden' : 'relative'}
            footer={
                <div className="flex items-center w-full">
                    <button
                        onClick={onClose}
                        className="h-10 px-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-surface-alt)] transition-all flex items-center justify-center"
                    >
                        Tutup
                    </button>
                    <div className="flex-1" />
                </div>
            }
        >
            <div ref={containerRef}>
                {exportPhase && <ExportOverlay format={exportFormat} phase={exportPhase} />}

                <div className={`space-y-6 pb-2 transition-all duration-500 ${exportPhase ? 'blur-sm grayscale-[0.5] opacity-50 pointer-events-none' : ''}`}>
                    {/* 1 — Jangkauan Data */}
                    <div className="space-y-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-70">1 &mdash; Jangkauan Data</p>
                        <div className="grid grid-cols-3 gap-2.5">
                            {scopeOptions.map(({ val, label, desc, icon: Icon, disabled }) => (
                                <button
                                    key={val}
                                    onClick={() => !disabled && setExportScope(val)}
                                    disabled={disabled}
                                    aria-pressed={exportScope === val}
                                    aria-label={`${label}: ${desc}`}
                                    className={`group p-3 rounded-2xl border-2 text-left transition-all
                                        ${exportScope === val
                                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                                            : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-surface-alt)]'}
                                        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
                                    `}
                                >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 transition-all 
                                        ${exportScope === val ? 'bg-[var(--color-primary)] text-white shadow-lg' : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] group-hover:bg-[var(--color-primary)]/10'}`}>
                                        <Icon className="w-3 h-3" />
                                    </div>
                                    <div className="text-[10px] font-black text-[var(--color-text)] mb-0.5">{label}</div>
                                    <div className="text-[9px] font-bold text-[var(--color-text-muted)] leading-tight">{desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2 — Kolom & Presets */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-70">2 &mdash; Kolom &amp; Presets</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePresetClick(ALL_COLUMN_KEYS)}
                                    className="text-[9px] font-black text-[var(--color-primary)] hover:underline uppercase tracking-widest bg-[var(--color-primary)]/5 px-2 py-1 rounded-lg transition-colors"
                                    aria-label="Pilih semua kolom"
                                >
                                    Semua
                                </button>
                                <button
                                    onClick={() => handlePresetClick(DEFAULT_COLUMNS)}
                                    className="text-[9px] font-black text-rose-500 hover:underline uppercase tracking-widest bg-rose-500/5 px-2 py-1 rounded-lg transition-colors"
                                    aria-label="Reset ke kolom default"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 p-3 bg-[var(--color-surface-alt)]/40 rounded-2xl border border-[var(--color-border)]/50">
                            <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-wider text-[var(--color-text-muted)] opacity-60">
                                <Tag className="w-3 h-3" />
                                <span>Pilih Paket Kolom (Preset)</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {PRESETS.map(preset => (
                                    <button
                                        key={preset.id}
                                        onClick={() => handlePresetClick(preset.cols)}
                                        aria-pressed={activePresetId === preset.id}
                                        aria-label={`Preset ${preset.label}`}
                                        className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 shrink-0
                                            ${activePresetId === preset.id
                                                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm shadow-[var(--color-primary)]/20'
                                                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]'}`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="relative flex items-center justify-center my-1">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-dashed border-[var(--color-border)]/65"></div>
                            </div>
                            <div className="relative bg-[var(--color-surface)] px-3 text-[8px] font-black uppercase tracking-widest text-[var(--color-text-muted)] opacity-50">
                                Pilih Kolom Kustom
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {COLUMN_DEFS.map(({ key, label, icon }, idx) => (
                                <ColumnToggle
                                    key={key}
                                    colKey={key}
                                    label={label}
                                    icon={icon}
                                    exportColumns={exportColumns}
                                    onToggle={handleToggleColumn}
                                    index={idx}
                                    dragIdx={dragIdx}
                                    onDragStart={handleDragStart}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    onDragEnd={handleDragEnd}
                                />
                            ))}
                        </div>
                    </div>

                    {/* 2b — Preview Data */}
                    <div className="space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-70">2b &mdash; Preview Data</p>
                        <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)] shadow-sm">
                            <button
                                onClick={() => setAllColumnsVisible(v => !v)}
                                className="w-full px-4 py-2 flex items-center justify-between bg-[var(--color-surface-alt)] border-b border-[var(--color-border)] hover:bg-[var(--color-border)]/30 transition-colors"
                            >
                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] flex items-center gap-2">
                                    {allColumnsVisible ? <EyeSlash className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    {allColumnsVisible ? 'Sembunyikan Preview' : 'Lihat Preview'} ({exportPreviewData.total} baris)
                                </span>
                                <span className="text-[8px] font-bold text-[var(--color-text-muted)] opacity-50">{exportColumns.length} kolom</span>
                            </button>
                            {allColumnsVisible && exportColumns.length > 0 && (
                                <div className="max-h-[200px] overflow-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-[var(--color-surface-alt)]/50">
                                                <th className="w-8 px-2 py-1.5 border-r border-b border-[var(--color-border)] text-[8px] font-black text-[var(--color-text-muted)] text-center">#</th>
                                                {exportColumns.map(k => {
                                                    const def = COLUMN_DEFS.find(c => c.key === k)
                                                    return (
                                                        <th key={k} className="px-2 py-1.5 border-r border-b border-[var(--color-border)] text-[9px] font-black text-[var(--color-text-muted)] text-left truncate max-w-[100px]">
                                                            {def?.label || k}
                                                        </th>
                                                    )
                                                })}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {exportPreviewData.rows.length === 0 ? (
                                                <tr>
                                                    <td colSpan={exportColumns.length + 1} className="px-4 py-6 text-center text-[10px] font-bold text-[var(--color-text-muted)] opacity-50">
                                                        Tidak ada data untuk jangkauan yang dipilih
                                                    </td>
                                                </tr>
                                            ) : exportPreviewData.rows.map((row, ri) => (
                                                <tr key={ri} className="hover:bg-[var(--color-surface-alt)]/30 transition-colors">
                                                    <td className="px-2 py-1 border-r border-b border-[var(--color-border)] text-[8px] font-bold text-[var(--color-text-muted)] text-center">{ri + 1}</td>
                                                    {exportColumns.map(k => (
                                                        <td key={k} className="px-2 py-1 border-r border-b border-[var(--color-border)] text-[9px] font-medium text-[var(--color-text)] truncate max-w-[120px]" title={String(row[k] ?? '')}>
                                                            {String(row[k] ?? '') || <span className="opacity-30 italic">—</span>}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3 — Konfigurasi File */}
                    <div className="space-y-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-70">3 &mdash; Konfigurasi File</p>

                        <div className="relative">
                            <input
                                type="text"
                                value={fileName}
                                onChange={(e) => setFileName(e.target.value)}
                                placeholder="Nama file export..."
                                aria-label="Nama file export"
                                className="w-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-xs font-bold focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/20 transition-all placeholder:opacity-50 pr-20"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-[var(--color-border)] text-[8px] font-black uppercase text-[var(--color-text-muted)]">
                                Multi Format
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-[var(--color-surface-alt)]/60 border border-[var(--color-border)] space-y-4">
                            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-[var(--color-text-muted)] opacity-50">Opsi Umum</p>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                                    <TextH />
                                    Sertakan Header
                                </label>
                                <div className="flex gap-1 bg-[var(--color-surface)] p-1 rounded-lg border border-[var(--color-border)]" role="radiogroup" aria-label="Sertakan header">
                                    {HEADER_OPTIONS.map(opt => (
                                        <button
                                            key={String(opt.v)}
                                            onClick={() => setIncludeHeader(opt.v)}
                                            role="radio"
                                            aria-checked={includeHeader === opt.v}
                                            className={`flex-1 py-1 rounded-md text-[9px] font-black uppercase transition-all ${includeHeader === opt.v ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]'}`}
                                        >
                                            {opt.l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <hr className="border-t border-dashed border-[var(--color-border)]/50" />

                            {exportFormat === 'pdf' && (
                                <>
                                    <p className="text-[8px] font-black uppercase tracking-[0.25em] text-[var(--color-text-muted)] opacity-50">Opsi PDF</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                                                <ArrowsLeftRight />
                                                Orientasi
                                            </label>
                                            <div className="flex gap-1 bg-[var(--color-surface)] p-1 rounded-lg border border-[var(--color-border)]" role="radiogroup" aria-label="Orientasi PDF">
                                                {ORIENTATION_OPTIONS.map(opt => (
                                                    <button
                                                        key={opt.v}
                                                        onClick={() => setPdfOrientation(opt.v)}
                                                        role="radio"
                                                        aria-checked={pdfOrientation === opt.v}
                                                        className={`flex-1 py-1 rounded-md text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${pdfOrientation === opt.v ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]'}`}
                                                    >
                                                        <opt.icon className="text-[8px]" />
                                                        {opt.l}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                                                <FileText />
                                                Template
                                            </label>
                                            <div className="flex gap-1 bg-[var(--color-surface)] p-1 rounded-lg border border-[var(--color-border)]" role="radiogroup" aria-label="Template PDF">
                                                {PDF_TEMPLATE_OPTIONS.map(opt => (
                                                    <button
                                                        key={opt.v}
                                                        onClick={() => setExportTemplate(opt.v)}
                                                        role="radio"
                                                        aria-checked={exportTemplate === opt.v}
                                                        className={`flex-1 py-1 rounded-md text-[9px] font-black uppercase transition-all ${exportTemplate === opt.v ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]'}`}
                                                    >
                                                        {opt.l}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* 4 — Mulai Ekspor */}
                    <div className="space-y-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-70">4 &mdash; Mulai Ekspor</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {EXPORT_FORMAT_CONFIG.map(({ label, icon: Icon, desc, color, iconColor, format }) => {
                                const handler = exportHandlers[format]
                                const handleClick = () => { setExportFormat(format); setExportPhase('loading'); exportStartRef.current = Date.now(); handler(fileName, exportOptions) }
                                return (
                                    <button
                                        key={label}
                                        onClick={handleClick}
                                        disabled={exporting || exportColumns.length === 0}
                                        aria-label={`Ekspor sebagai ${label}${desc ? ` (${desc})` : ''}`}
                                        className={`relative group h-24 rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 ${color}`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-transform group-hover:scale-110 ${iconColor} bg-[var(--color-surface-alt)]`}>
                                            <Icon className="text-xl" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
                                        <span className="text-[8px] font-bold opacity-60 uppercase">{desc}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {exportColumns.length === 0 && (
                        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-600 text-[10px] font-black uppercase tracking-tight animate-pulse" role="alert">
                            <Warning className="w-4 h-4 shrink-0" />
                            Pilih minimal satu kolom untuk melanjutkan
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    )
}
