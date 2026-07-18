import React, { useState, useRef, useMemo } from 'react'
import { WarningCircle, Warning, ArrowLeft, ArrowsLeftRight, ArrowRight, Calendar, Check, CheckCircle, CaretDown, CaretUp, Copy, DownloadSimple, FileArrowDown, FileText, SlidersHorizontal, List, Spinner, Pen, Tag, Trash, UploadSimple, Lightning, CheckSquare, Checks, MagnifyingGlass, X } from '@phosphor-icons/react'
import { createPortal } from 'react-dom'

import { Modal, RichSelect, EmptyState } from '@shared/components'

// --- Static config (module scope) ---

const STEPS = [
    { step: 1, label: 'Upload', desc: 'Pilih File' },
    { step: 2, label: 'Mapping', desc: 'Atur Kolom' },
    { step: 3, label: 'Review', desc: 'Validasi' },
]

const TEMPLATE_COLS = [
    { l: 'A', k: 'academic_year', n: 'Tahun Pelajaran', w: 'w-[25%]' },
    { l: 'B', k: 'semester', n: 'Semester', w: 'w-[25%]' },
    { l: 'C', k: 'start_date', n: 'Tanggal Mulai', w: 'w-[25%]' },
    { l: 'D', k: 'end_date', n: 'Tanggal Selesai', w: 'w-[25%]' },
]

const SAMPLE_ROWS = [
    ['2024/2025', 'Ganjil', '2024-07-01', '2024-12-31'],
    ['2024/2025', 'Genap', '2025-01-01', '2025-06-30'],
]

const ACCEPTED_EXTENSIONS = ['.xlsx', '.csv']

const REQUIRED_COL_KEYS = ['academic_year', 'semester', 'start_date', 'end_date']

// stat config — `value` is filled in-render
const STAT_DEFS = [
    { key: 'total', label: 'Total Baris', color: 'text-[var(--color-text-muted)]', bg: 'bg-[var(--color-border)]/20', icon: FileText },
    { key: 'ready', label: 'Siap Import', color: 'text-emerald-600', bg: 'bg-emerald-500/10', icon: CheckCircle },
    { key: 'dupe', label: 'Periode Duplikat', color: 'text-violet-600', bg: 'bg-violet-500/10', icon: Copy },
    { key: 'error', label: 'Ada Isu/Error', color: 'text-red-600', bg: 'bg-red-500/10', icon: WarningCircle },
]

// issue level -> style mapping
const ISSUE_LEVEL_STYLES = {
    error: { pill: 'bg-red-500/15 text-red-600', row: 'border-l-2 border-l-red-500 bg-red-500/3' },
    dupe: { pill: 'bg-violet-500/15 text-violet-600', row: 'border-l-2 border-l-violet-500 bg-violet-500/3' },
    warn: { pill: 'bg-amber-500/15 text-amber-600', row: 'border-l-2 border-l-amber-400 bg-amber-500/3' },
}

const getIssueLevelStyle = (level) => ISSUE_LEVEL_STYLES[level] || ISSUE_LEVEL_STYLES.warn

const SEMESTER_OPTIONS = [
    { id: 'Ganjil', name: 'Ganjil' },
    { id: 'Genap', name: 'Genap' },
]

// row status classification helper
const getRowStatus = (row) => {
    if (row._hasError) return 'error'
    if (row._isDupe) return 'dupe'
    if (row._hasWarn) return 'warn'
    return 'ok'
}

// status icon for a row's rightmost cell
const STATUS_ICON = {
    error: { cls: 'bg-red-500/15 text-red-600', extra: 'animate-pulse', Icon: WarningCircle },
    dupe: { cls: 'bg-violet-500/15 text-violet-600', extra: '', Icon: Copy },
    warn: { cls: 'bg-amber-500/15 text-amber-600', extra: '', Icon: Warning },
    ok: { cls: 'bg-green-500/15 text-green-600', extra: '', Icon: CheckCircle },
}

const getStatusIcon = (status) => STATUS_ICON[status] || STATUS_ICON.ok

const hasRowIssue = (r) => r._hasError || r._isDupe || r._hasWarn

const isMappingComplete = (mapping) =>
    mapping.academic_year && mapping.semester && mapping.start_date && mapping.end_date

// --- EditableCell Component ---
const EditableCell = React.memo(({ rowIdx, colKey, value, importEditCell, setImportEditCell, handleImportCellEdit }) => {
    const isEditing = importEditCell?.row === rowIdx && importEditCell?.col === colKey
    const cellRef = useRef(null)
    const [coords, setCoords] = useState(null)

    React.useLayoutEffect(() => {
        if (isEditing && cellRef.current) {
            const rect = cellRef.current.getBoundingClientRect()
            setCoords({
                anchorTop: rect.top,
                left: rect.left,
                width: rect.width
            })
        } else {
            setCoords(null)
        }
    }, [isEditing])

    const renderDropdown = (content) => {
        if (!coords) return null

        return createPortal(
            <div
                className="fixed z-[9999]"
                style={{
                    bottom: (window.innerHeight - coords.anchorTop) + 8,
                    left: coords.left,
                    minWidth: Math.max(coords.width, 140)
                }}
            >
                <div className="flex flex-col bg-[var(--color-surface)] border border-[var(--color-primary)] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl border-t-[var(--color-primary)]">
                    {content}
                </div>
                <div className="fixed inset-0 -z-10 bg-black/0" onClick={() => setImportEditCell(null)} />
            </div>,
            document.body
        )
    }

    if (isEditing) {
        if (colKey === 'semester') {
            return (
                <div ref={cellRef} className="relative">
                    <div className="bg-[var(--color-primary)]/10 rounded-lg px-2 py-1 text-[var(--color-primary)] font-black uppercase text-center border border-[var(--color-primary)] shadow-sm">
                        {value || '-'}
                    </div>
                    {renderDropdown(
                        <div className="py-1">
                            {SEMESTER_OPTIONS.map(opt => (
                                <button
                                    key={opt.id}
                                    className="w-full px-4 py-2.5 text-left text-[10px] font-bold hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] transition-colors flex items-center justify-between"
                                    onClick={() => {
                                        handleImportCellEdit(rowIdx, colKey, opt.id)
                                        setImportEditCell(null)
                                    }}
                                >
                                    <span>{opt.name}</span>
                                    {value === opt.id && <Check className="w-2 h-2" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )
        }

        return (
            <input
                autoFocus
                className="w-full bg-[var(--color-surface)] border-2 border-[var(--color-primary)] rounded-lg px-2 py-1 text-[10px] font-black outline-none shadow-lg transition-all"
                value={value || ''}
                onChange={(e) => handleImportCellEdit(rowIdx, colKey, e.target.value)}
                onBlur={() => setImportEditCell(null)}
                onKeyDown={(e) => e.key === 'Enter' && setImportEditCell(null)}
            />
        )
    }

    const isCentered = ['semester'].includes(colKey)
    const displayValue = value || '-'
    const isEmpty = !value || value === '-'

    return (
        <div
            className={`group cursor-pointer hover:bg-[var(--color-primary)]/5 px-1.5 py-0.5 -mx-1.5 rounded-md transition-all flex items-center ${isCentered ? 'justify-center' : 'justify-between'} gap-2 min-h-[20px] ${isEmpty ? 'text-red-500/40 italic font-normal' : ''}`}
            onClick={() => setImportEditCell({ row: rowIdx, col: colKey })}
        >
            <span className={isCentered ? '' : 'truncate'}>{displayValue}</span>
            {!isCentered && <Pen className="w-2 h-2 opacity-0 group-hover:opacity-30 transition-opacity" />}
        </div>
    )
})

export default function PeriodImportModal(props) {
    const {
        isOpen,
        onClose,
        importing,
        importStep,
        setImportStep,
        importPreview,
        importFileName,
        importFileInputRef,
        importDragOver,
        setImportDragOver,
        processImportFile,
        handleDownloadTemplate,
        importFileHeaders,
        SYSTEM_COLS,
        importColumnMapping,
        setImportColumnMapping,
        importRawData,
        importLoading,
        setImportLoading,
        buildImportPreview,
        importIssues,
        importValidationOpen,
        setImportValidationOpen,
        importProgress,
        handleCommitImport,
        handleImportClick,
        hasImportBlockingErrors,
        importReadyRows,
        handleImportCellEdit,
        importEditCell,
        setImportEditCell,
        handleRemoveImportRow,
        importSkipDupes,
        setImportSkipDupes
    } = props

    const [filterIssuesOnly, setFilterIssuesOnly] = useState(false)
    const [colMenuOpen, setColMenuOpen] = useState(false)
    const colMenuBtnRef = useRef(null)
    const [colMenuPos, setColMenuPos] = useState({ top: 0, right: 0, showUp: false })
    const [visibleCols, setVisibleCols] = useState({
        period: true,
        semester: true,
        start_date: true,
        end_date: true,
    })

    // derived view data for review table
    const visiblePreview = useMemo(() =>
        importPreview
            .map((r, originalIdx) => ({ ...r, originalIdx }))
            .filter(r => !filterIssuesOnly || hasRowIssue(r))
    , [importPreview, filterIssuesOnly])

    const visibleRows = useMemo(() => visiblePreview.slice(0, 300), [visiblePreview])

    const statValues = useMemo(() => ({
        total: importPreview.length,
        ready: importReadyRows.length,
        dupe: importPreview.filter(r => r._isDupe).length,
        error: importPreview.filter(r => r._hasError).length,
    }), [importPreview, importReadyRows])

    if (!isOpen) return null

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Import Data Tahun Pelajaran"
            description="Unggah data periode masal dari file Excel/CSV"
            icon={FileArrowDown}
            iconBg="bg-emerald-500/10"
            iconColor="text-emerald-600"
            size="lg"
            mobileVariant="bottom-sheet"
            footer={
                <div className="flex items-center w-full gap-3">
                    {importStep === 1 ? (
                        <button
                            onClick={onClose}
                            className="h-10 px-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-surface-alt)] transition-all flex items-center justify-center"
                        >
                            Batal
                        </button>
                    ) : (
                        <button
                            onClick={() => setImportStep(v => v - 1)}
                            disabled={importing}
                            className="h-10 px-6 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-muted)] text-[11px] font-black uppercase tracking-widest disabled:opacity-50 hover:bg-[var(--color-border)] transition-all flex items-center gap-2"
                        >
                            <ArrowLeft />
                            Kembali
                        </button>
                    )}

                    <div className="flex-1" />

                    <div className="flex items-center gap-3">
                        {importing && (
                            <span className="text-[10px] font-bold text-[var(--color-text-muted)] flex items-center gap-2">
                                <Spinner className="animate-spin text-[var(--color-primary)]" />
                                {importProgress.done}/{importProgress.total}
                            </span>
                        )}

                        {importStep === 1 ? (
                            <button
                                onClick={() => (importRawData.length > 0 && importFileName) ? setImportStep(2) : importFileInputRef.current?.click()}
                                className="h-10 px-6 rounded-xl bg-[var(--color-primary)] hover:brightness-110 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-[var(--color-primary)]/20 transition-all flex items-center gap-2"
                            >
                                {(importRawData.length > 0 && importFileName) ? (
                                    <>Lanjutkan <ArrowRight /></>
                                ) : (
                                    <>Pilih File <UploadSimple /></>
                                )}
                            </button>
                        ) : importStep === 2 ? (
                            <button
                                onClick={async () => {
                                    setImportStep(3)
                                    setImportLoading(true)
                                    await buildImportPreview(importRawData, importColumnMapping)
                                    setImportLoading(false)
                                }}
                                disabled={!isMappingComplete(importColumnMapping)}
                                className="h-10 px-6 rounded-xl bg-[var(--color-primary)] hover:brightness-110 text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-40 shadow-lg shadow-[var(--color-primary)]/20 transition-all flex items-center gap-2"
                            >
                                Review Data <ArrowRight />
                            </button>
                        ) : (
                            <button
                                onClick={handleCommitImport}
                                disabled={importing || hasImportBlockingErrors || importReadyRows.length === 0}
                                className="h-10 px-6 rounded-xl bg-[var(--color-primary)] hover:brightness-110 text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-40 shadow-lg shadow-[var(--color-primary)]/20 transition-all flex items-center gap-2"
                            >
                                {importing
                                    ? <><Spinner className="animate-spin" /> Mengimport...</>
                                    : <><Check /> Selesaikan Import</>}
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            {/* Header Progress Steppers */}
            <div className="flex items-center justify-center gap-3 mb-6">
                {STEPS.map((s) => (
                    <React.Fragment key={s.step}>
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black transition-all shadow-sm
                                ${importStep >= s.step ? 'bg-[var(--color-primary)] text-white scale-110' : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] border border-[var(--color-border)] opacity-40'}`}>
                                {importStep > s.step ? <Check className="w-3 h-3" /> : s.step}
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-[10px] md:text-[11px] font-black uppercase tracking-wider leading-none ${importStep >= s.step ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)] opacity-50'}`}>{s.label}</span>
                                <span className="text-[9px] font-bold text-[var(--color-text-muted)] opacity-40 uppercase tracking-tight mt-1">{s.desc}</span>
                            </div>
                        </div>
                        {s.step < 3 && <div className={`w-6 h-0.5 rounded-full transition-all ${importStep > s.step ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)] opacity-30'}`} />}
                    </React.Fragment>
                ))}
            </div>

            {/* Consolidated File Status Bar (SaaS Style) */}
            {importFileName && (
                <div className="flex items-center justify-between gap-4 mb-6 px-1 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 shrink-0 shadow-sm">
                            <FileText className="w-3 h-3" />
                            <span className="text-[10.5px] font-black truncate max-w-[240px]">{importFileName}</span>
                        </div>
                        {importPreview.length > 0 && (
                            <div className="px-3.5 py-1.5 rounded-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-muted)] text-[10px] font-black shadow-sm shrink-0">
                                {importPreview.length} baris
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleImportClick}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-red-500 hover:border-red-500/30 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm group"
                    >
                        <ArrowsLeftRight className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                        Ganti File
                    </button>
                </div>
            )}

            {importStep === 1 && (
                <div className="space-y-2.5">
                    <div
                        onDragOver={e => { e.preventDefault(); setImportDragOver(true) }}
                        onDragLeave={() => setImportDragOver(false)}
                        onDrop={async e => {
                            e.preventDefault()
                            setImportDragOver(false)
                            const file = e.dataTransfer.files?.[0]
                            if (file) await processImportFile(file)
                        }}
                        onClick={() => importFileInputRef.current?.click()}
                        className={`w-full h-14 rounded-xl border-2 border-dashed cursor-pointer flex items-center justify-center gap-3 transition-all
                        ${importDragOver
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 scale-[1.01]'
                                : 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/4 hover:border-[var(--color-primary)]/60 hover:bg-[var(--color-primary)]/8'}`}
                    >
                        <UploadSimple className={`w-4 h-4 transition-all ${importDragOver ? 'text-[var(--color-primary)] scale-110' : 'text-[var(--color-primary)]/60'}`} />
                        <div className="text-left">
                            <p className="text-[11px] font-black text-[var(--color-primary)] uppercase tracking-wider leading-none">
                                {importDragOver ? 'Lepaskan file di sini' : 'Drag & Drop atau Klik untuk Pilih File'}
                            </p>
                            <p className="text-[10px] text-[var(--color-text-muted)] font-bold mt-1 opacity-60">Mendukung .csv dan .xlsx</p>
                        </div>
                    </div>

                    {/* --- Reference & Guidance Rows --- */}
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-[var(--color-surface-alt)]/50 rounded-2xl border border-[var(--color-border)] shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                    <Calendar className="w-3 h-3" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text)]">Format Data Valid</span>
                                    <span className="text-[8px] font-bold text-emerald-600">Pastikan format tanggal YYYY-MM-DD</span>
                                </div>
                            </div>

                            <button
                                onClick={handleDownloadTemplate}
                                className="shrink-0 h-9 px-4 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                            >
                                <DownloadSimple /> Download Template
                            </button>
                        </div>

                        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-sm flex flex-col">
                            <div className="px-4 py-2 bg-[var(--color-surface-alt)] border-b border-[var(--color-border)] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <List className="text-[var(--color-primary)] w-3 h-3" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">Visualisasi Struktur Kolom Excel</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-50"></span>
                                    </span>
                                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Auto-Match Active</span>
                                </div>
                            </div>

                            <div className="overflow-hidden bg-[var(--color-surface-alt)]/10">
                                <table className="w-full border-collapse table-fixed">
                                    <thead>
                                        <tr className="bg-[var(--color-surface)]">
                                            <th className="w-8 border-r border-b border-[var(--color-border)]"></th>
                                            {TEMPLATE_COLS.map((col, i) => (
                                                <th key={i} className={`px-2 py-1.5 border-r border-b border-[var(--color-border)] text-left ${col.w} min-w-0 overflow-hidden`}>
                                                    <div className="flex flex-col min-w-0">
                                                        <div className="flex items-center justify-between gap-1 min-w-0">
                                                            <span className="text-[9px] font-black text-[var(--color-text)] shrink-0">{col.l}</span>
                                                            <span className="text-[7.5px] font-bold text-emerald-600 opacity-80 truncate" title={col.k}>({col.k})</span>
                                                        </div>
                                                        <div className="h-0.5 w-full bg-emerald-500/20 rounded-full mt-1"></div>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {SAMPLE_ROWS.map((row, rIdx) => (
                                            <tr key={rIdx}>
                                                <td className="bg-[var(--color-surface-alt)] border-r border-b border-[var(--color-border)] text-[8px] font-bold text-[var(--color-text-muted)] text-center py-1">
                                                    {rIdx + 1}
                                                </td>
                                                {row.map((cell, cIdx) => (
                                                    <td key={cIdx} className="px-2 py-1 border-r border-b border-[var(--color-border)] bg-[var(--color-surface)]/40 overflow-hidden">
                                                        <span className="text-[9px] font-medium text-[var(--color-text)] opacity-70 truncate block" title={cell}>{cell}</span>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-4 py-1.5 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center justify-between">
                                <p className="text-[8px] text-[var(--color-text-muted)] font-medium italic opacity-60">
                                    * Gunakan judul kolom yang mendekati nama di atas untuk pencocokan otomatis.
                                </p>
                                <div className="flex gap-1.5">
                                    {ACCEPTED_EXTENSIONS.map(ext => (
                                        <span key={ext} className="text-[7.5px] font-black text-[var(--color-primary)] px-1 py-0.5 bg-[var(--color-primary)]/5 rounded border border-[var(--color-primary)]/10">{ext}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {importStep === 2 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Cocokkan Kolom File</span>
                        <span className="text-[9px] font-bold py-1 px-2 rounded-lg bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                            {importFileHeaders.length} kolom ditemukan
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[35vh] overflow-y-auto pr-1 custom-scrollbar">
                        {SYSTEM_COLS.map(sys => {
                            const mapped = importColumnMapping[sys.key]
                            return (
                                <div key={sys.key} className={`p-2.5 rounded-xl border transition-all ${mapped ? 'bg-emerald-500/4 border-emerald-500/20' : 'bg-[var(--color-surface-alt)]/50 border-[var(--color-border)]'}`}>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex flex-col w-[130px] shrink-0">
                                            <span className="text-[10px] font-black text-[var(--color-text)] flex items-center gap-1">
                                                {sys.label}
                                                {REQUIRED_COL_KEYS.includes(sys.key) && <span className="text-red-500 text-[9px]">*</span>}
                                            </span>
                                            <span className="text-[8px] font-bold text-[var(--color-text-muted)] opacity-50 uppercase tracking-tight">Sistem</span>
                                        </div>

                                        <div className="flex items-center gap-1.5 opacity-30">
                                            <ArrowRight className={`w-2 h-2 ${mapped ? 'text-emerald-500 opacity-100' : ''}`} />
                                        </div>

                                        <div className="flex-1 min-w-0 relative">
                                            <RichSelect
                                                small
                                                value={mapped || ''}
                                                onChange={(val) => setImportColumnMapping(v => ({ ...v, [sys.key]: val }))}
                                                options={importFileHeaders.map(h => ({ id: h, name: h }))}
                                                placeholder="-- Lewati Kolom --"
                                                extraOption={{ id: '', name: '-- Lewati Kolom --' }}
                                                status={mapped ? 'success' : 'normal'}
                                                searchable={importFileHeaders.length > 5}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {importStep === 3 && (
                <div className="space-y-4">
                    {importLoading ? (
                        <div className="flex items-center justify-center py-14 text-[var(--color-text-muted)] gap-2">
                            <Spinner className="animate-spin" />
                            <span className="w-3 h-3 font-bold">Memproses preview...</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Minimal Status & Action Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-[var(--color-surface-alt)]/50 border border-[var(--color-border)] shadow-sm">
                                {/* Stats */}
                                <div className="flex items-center gap-2 p-1 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]/50">
                                    {STAT_DEFS.map((stat) => (
                                        <div key={stat.key} className={`flex items-center gap-2 px-2 py-1 rounded-lg ${stat.bg} ${stat.color} transition-all`} title={stat.label}>
                                            <stat.icon className="text-[10px] opacity-70" />
                                            <span className="text-[11px] font-black">{statValues[stat.key]}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setImportSkipDupes(!importSkipDupes)}
                                        className={`flex items-center gap-2 h-8 px-3 rounded-xl border text-[10px] font-black uppercase tracking-tight transition-all
                                            ${importSkipDupes
                                                ? 'bg-violet-500 text-white border-violet-500 shadow-md shadow-violet-500/20'
                                                : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-violet-500/40 hover:text-violet-600'}`}
                                    >
                                        <Copy className="w-3 h-3" />
                                        <span className="hidden sm:inline">{importSkipDupes ? 'Lewati Duplikat' : 'Ikutkan Duplikat'}</span>
                                        <span className="sm:hidden">{importSkipDupes ? 'Lewati' : 'Ikut'}</span>
                                    </button>

                                    <button
                                        onClick={() => setFilterIssuesOnly(!filterIssuesOnly)}
                                        className={`flex items-center gap-2 h-8 px-3 rounded-xl border text-[10px] font-black uppercase tracking-tight transition-all
                                            ${filterIssuesOnly
                                                ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/20'
                                                : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-red-500/40 hover:text-red-500'}`}
                                    >
                                        {filterIssuesOnly ? <Check className="w-3 h-3" /> : <SlidersHorizontal className="w-3 h-3" />}
                                        <span>{filterIssuesOnly ? 'Hanya Isu' : 'Semua'}</span>
                                    </button>

                                    {/* Column Visibility Toggle */}
                                    <div className="relative">
                                        <button
                                            ref={colMenuBtnRef}
                                            onClick={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect()
                                                const menuHeight = 220
                                                const spaceBelow = window.innerHeight - rect.bottom
                                                const showUp = spaceBelow < menuHeight && rect.top > menuHeight
                                                setColMenuPos({
                                                    top: showUp ? (rect.top + window.scrollY - menuHeight - 8) : (rect.bottom + window.scrollY + 8),
                                                    right: window.innerWidth - rect.right,
                                                    showUp
                                                })
                                                setColMenuOpen(v => !v)
                                            }}
                                            title="Atur tampilan kolom"
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${colMenuOpen ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'}`}
                                        >
                                            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><rect x="0" y="0" width="5" height="5" rx="1" /><rect x="7" y="0" width="5" height="5" rx="1" /><rect x="0" y="7" width="5" height="5" rx="1" /><rect x="7" y="7" width="5" height="5" rx="1" /></svg>
                                        </button>
                                        {colMenuOpen && createPortal(
                                            <div className={`fixed z-[9999] w-48 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl shadow-black/10 p-2 space-y-0.5 animate-in fade-in zoom-in-95 ${colMenuPos.showUp ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2'}`}
                                                style={{ top: colMenuPos.top, right: colMenuPos.right }}>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] px-3 py-2">Atur Kolom</p>
                                                {[
                                                    { key: 'period', label: 'Tahun Pelajaran' },
                                                    { key: 'semester', label: 'Semester' },
                                                    { key: 'start_date', label: 'Tanggal Mulai' },
                                                    { key: 'end_date', label: 'Tanggal Selesai' },
                                                ].map(({ key, label }) => (
                                                    <button key={key} onClick={() => setVisibleCols(p => ({ ...p, [key]: !p[key] }))} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-alt)] transition-all group text-left">
                                                        <span className="text-[11px] font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{label}</span>
                                                        <div className={`w-8 h-4.5 rounded-full transition-all flex items-center px-0.5 ${visibleCols[key] ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}>
                                                            <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all ${visibleCols[key] ? 'translate-x-[14px]' : 'translate-x-0'}`} />
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>,
                                            document.body
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)] shadow-sm">
                                <div className="max-h-[40vh] overflow-auto scrollbar-none">
                                    {/* Desktop Table */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full border-collapse table-fixed">
                                            <thead className="bg-[var(--color-surface-alt)] sticky top-0 z-10">
                                                <tr className="border-b border-[var(--color-border)] text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                                                    <th className="px-4 py-3 text-center w-12">
                                                        <input type="checkbox" className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] accent-[var(--color-primary)] cursor-pointer" disabled />
                                                    </th>
                                                    {visibleCols.period && <th className="px-4 py-3 text-left">Tahun Pelajaran</th>}
                                                    {visibleCols.semester && <th className="px-4 py-3 text-center w-24">Semester</th>}
                                                    {visibleCols.start_date && <th className="px-4 py-3 text-left w-32">Tanggal Mulai</th>}
                                                    {visibleCols.end_date && <th className="px-4 py-3 text-left w-32">Tanggal Selesai</th>}
                                                    <th className="px-4 py-3 text-center w-20">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--color-border)]/50">
                                                {visibleRows.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="6" className="py-16 text-center">
                                                            <EmptyState icon={MagnifyingGlass} title={filterIssuesOnly ? 'Tidak ada isu ditemukan' : 'Tidak ada data preview'} description={filterIssuesOnly ? 'Semua baris valid, tidak ada error/duplikat' : 'Upload file dan lakukan mapping untuk melihat preview'} color="slate" variant="plain" />
                                                        </td>
                                                    </tr>
                                                ) : visibleRows.map((r) => {
                                                    const i = r.originalIdx
                                                    const status = getRowStatus(r)
                                                    const rowBg = status === 'error' ? 'bg-red-500/3 border-l-2 border-l-red-500' : status === 'dupe' ? 'bg-violet-500/3 border-l-2 border-l-violet-500' : ''
                                                    const statusIcon = getStatusIcon(status)
                                                    return (
                                                        <tr key={i} className={`hover:bg-[var(--color-surface-alt)]/40 transition-colors ${rowBg}`}>
                                                            <td className="px-4 py-3">
                                                                <input type="checkbox" disabled className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] accent-[var(--color-primary)] cursor-pointer" />
                                                            </td>
                                                            {visibleCols.period && (
                                                                <td className="px-4 py-3">
                                                                    <EditableCell
                                                                        rowIdx={i} colKey="academic_year" value={r.academic_year}
                                                                        importEditCell={importEditCell} setImportEditCell={setImportEditCell}
                                                                        handleImportCellEdit={handleImportCellEdit}
                                                                    />
                                                                </td>
                                                            )}
                                                            {visibleCols.semester && (
                                                                <td className="px-4 py-3 text-center">
                                                                    <EditableCell
                                                                        rowIdx={i} colKey="semester" value={r.semester}
                                                                        importEditCell={importEditCell} setImportEditCell={setImportEditCell}
                                                                        handleImportCellEdit={handleImportCellEdit}
                                                                    />
                                                                </td>
                                                            )}
                                                            {visibleCols.start_date && (
                                                                <td className="px-4 py-3">
                                                                    <EditableCell
                                                                        rowIdx={i} colKey="start_date" value={r.start_date}
                                                                        importEditCell={importEditCell} setImportEditCell={setImportEditCell}
                                                                        handleImportCellEdit={handleImportCellEdit}
                                                                    />
                                                                </td>
                                                            )}
                                                            {visibleCols.end_date && (
                                                                <td className="px-4 py-3">
                                                                    <EditableCell
                                                                        rowIdx={i} colKey="end_date" value={r.end_date}
                                                                        importEditCell={importEditCell} setImportEditCell={setImportEditCell}
                                                                        handleImportCellEdit={handleImportCellEdit}
                                                                    />
                                                                </td>
                                                            )}
                                                            <td className="px-4 py-3 text-center">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${statusIcon.cls} ${statusIcon.extra}`}>
                                                                        <statusIcon.Icon className="w-3.5 h-3.5" />
                                                                    </span>

                                                                    <button
                                                                        onClick={() => handleRemoveImportRow(i)}
                                                                        className="w-7 h-7 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center group/del"
                                                                        title="Hapus Baris"
                                                                    >
                                                                        <Trash className="w-3.5 h-3.5 group-hover/del:scale-110 transition-transform" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Card View */}
                                    <div className="md:hidden divide-y divide-[var(--color-border)]/50 p-3">
                                        {visibleRows.length === 0 ? (
                                            <EmptyState icon={MagnifyingGlass} title={filterIssuesOnly ? 'Tidak ada isu ditemukan' : 'Tidak ada data preview'} description={filterIssuesOnly ? 'Semua baris valid, tidak ada error/duplikat' : 'Upload file dan lakukan mapping untuk melihat preview'} color="slate" variant="plain" className="py-8" />
                                        ) : visibleRows.map((r) => {
                                            const i = r.originalIdx
                                            const status = getRowStatus(r)
                                            const rowBg = status === 'error' ? 'bg-red-500/3 border-l-4 border-l-red-500' : status === 'dupe' ? 'bg-violet-500/3 border-l-4 border-l-violet-500' : ''
                                            const statusIcon = getStatusIcon(status)
                                            return (
                                                <div key={i} className={`rounded-xl p-3 transition-colors ${rowBg}`}>
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${statusIcon.cls} ${statusIcon.extra}`}>
                                                                    <statusIcon.Icon className="w-3 h-3" />
                                                                </span>
                                                                <span className="font-bold text-[var(--color-text)] text-sm truncate">{r.academic_year || '-'}</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2 text-[11px] text-[var(--color-text-muted)]">
                                                                {visibleCols.semester && <span className={`px-2 py-0.5 rounded-lg font-black uppercase tracking-wider ${r.semester === 'Ganjil' ? 'bg-indigo-500/10 text-indigo-600' : 'bg-purple-500/10 text-purple-600'}`}>{r.semester}</span>}
                                                                {visibleCols.start_date && <span className="font-mono">{r.start_date || '-'}</span>}
                                                                {visibleCols.end_date && <span className="font-mono">{r.end_date || '-'}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-end">
                                                        <button
                                                            onClick={() => handleRemoveImportRow(i)}
                                                            className="w-7 h-7 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                                            title="Hapus Baris"
                                                        >
                                                            <Trash className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] bg-[var(--color-surface-alt)] border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-4">
                                        <span>Menampilkan {Math.min(visibleRows.length, 300)} dari {importPreview.length} total baris</span>
                                        <div className="w-px h-4 bg-[var(--color-border)]" />
                                        <span className="text-emerald-600 flex items-center gap-1.5">
                                            <CheckCircle className="w-2 h-2" />
                                            {importReadyRows.length} baris siap diimport
                                        </span>
                                    </div>
                                    {filterIssuesOnly && <span className="text-red-500 animate-pulse">Filter "Hanya Isu" Aktif</span>}
                                </div>
                            </div>

                            {importIssues.length > 0 && (
                                <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface-alt)]/20">
                                    <button
                                        type="button"
                                        onClick={() => setImportValidationOpen(v => !v)}
                                        className="w-full px-3 py-2 bg-[var(--color-surface-alt)] border-b border-[var(--color-border)] flex items-center justify-between hover:bg-[var(--color-border)]/30 transition-colors cursor-pointer"
                                    >
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] flex items-center gap-1.5">
                                            <CaretDown className={`w-2 h-2 transition-transform ${importValidationOpen ? '' : '-rotate-90'}`} />
                                            Catatan Validasi
                                        </span>
                                        <span className="text-[8px] font-bold text-[var(--color-text-muted)] opacity-50">{importIssues.length} isu</span>
                                    </button>
                                    {importValidationOpen && <div className="max-h-[140px] overflow-auto divide-y divide-[var(--color-border)]">
                                        {importIssues.map((issue, idx) => {
                                            const levelStyle = getIssueLevelStyle(issue.level)
                                            return (
                                                <div key={idx} className={`flex items-start gap-3 px-3 py-2 ${levelStyle.row}`}>
                                                    <span className={`mt-0.5 shrink-0 px-1.5 py-0.5 rounded text-[8px] font-black ${levelStyle.pill}`}>
                                                        {issue.level === 'dupe' ? 'DUPLIKAT' : issue.level.toUpperCase()}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[9px] font-black text-[var(--color-text-muted)] mb-0.5">Baris {issue.row}</p>
                                                        {issue.messages.map((msg, mi) => (
                                                            <p key={mi} className="text-[10px] font-bold text-[var(--color-text)] leading-snug">{msg}</p>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </Modal>
    )
}
