import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import { WarningCircle, Warning, ArrowLeft, ArrowsLeftRight, ArrowRight, Calendar, Check, CheckCircle, CaretDown, Copy, DownloadSimple, FileArrowDown, FileText, SlidersHorizontal, List, Spinner, Pen, Trash, UploadSimple, MagnifyingGlass, SquaresFour, ArrowClockwise, PencilSimple, GitDiff, ArrowFatRight } from '@phosphor-icons/react'
import { createPortal } from 'react-dom'

import { Modal, Select, EmptyState, Dropzone } from '@shared/components'

const STEPS = [
    { step: 1, label: 'Upload', desc: 'Pilih File' },
    { step: 2, label: 'Mapping', desc: 'Atur Kolom' },
    { step: 3, label: 'Review', desc: 'Validasi' },
]

const TEMPLATE_COLS = [
    { l: 'A', k: 'period', n: 'Tahun Pelajaran', w: 'w-[25%]' },
    { l: 'B', k: 'semester', n: 'Semester', w: 'w-[25%]' },
    { l: 'C', k: 'start_date', n: 'Tanggal Mulai', w: 'w-[25%]' },
    { l: 'D', k: 'end_date', n: 'Tanggal Selesai', w: 'w-[25%]' },
]

const COL_VISIBLE_DEFS = TEMPLATE_COLS.map(c => ({ key: c.k, label: c.n }))

const SAMPLE_ROWS = [
    ['2024/2025', 'Ganjil', '2024-07-01', '2024-12-31'],
    ['2024/2025', 'Genap', '2025-01-01', '2025-06-30'],
]

const ACCEPTED_EXTENSIONS = ['.xlsx', '.csv']

const REQUIRED_COL_KEYS = ['academic_year', 'semester', 'start_date', 'end_date']

const PAGE_SIZE = 100
const SEARCHABLE_THRESHOLD = 5
const MAX_FILE_SIZE_MB = 5

const STAT_DEFS = [
    { key: 'total', label: 'Total Baris', color: 'text-[var(--color-text-muted)]', bg: 'bg-[var(--color-border)]/20', icon: FileText },
    { key: 'ready', label: 'Siap Import', color: 'text-emerald-600', bg: 'bg-emerald-500/10', icon: CheckCircle },
    { key: 'dupe', label: 'Periode Duplikat', color: 'text-violet-600', bg: 'bg-violet-500/10', icon: Copy },
    { key: 'error', label: 'Ada Isu/Error', color: 'text-red-600', bg: 'bg-red-500/10', icon: WarningCircle },
]

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

const getRowStatus = (row) => {
    if (row._hasError) return 'error'
    if (row._isDupe) return 'dupe'
    if (row._hasWarn) return 'warn'
    return 'ok'
}

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

    const handleSemesterSelect = useCallback((optId) => {
        handleImportCellEdit(rowIdx, colKey, optId)
        setImportEditCell(null)
    }, [rowIdx, colKey, handleImportCellEdit, setImportEditCell])

    const handleInputChange = useCallback((e) => handleImportCellEdit(rowIdx, colKey, e.target.value), [rowIdx, colKey, handleImportCellEdit])

    const handleInputBlur = useCallback(() => setImportEditCell(null), [setImportEditCell])

    const handleInputKeyDown = useCallback((e) => e.key === 'Enter' && setImportEditCell(null), [setImportEditCell])

    const handleCellClick = useCallback(() => setImportEditCell({ row: rowIdx, col: colKey }), [rowIdx, colKey, setImportEditCell])

    const handleCellKeyDown = useCallback((e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setImportEditCell({ row: rowIdx, col: colKey })
        }
    }, [rowIdx, colKey, setImportEditCell])

    const renderDropdown = useCallback((content) => {
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
                <div className="fixed inset-0 -z-10 bg-black/0" onMouseDown={() => setImportEditCell(null)} />
            </div>,
            document.body
        )
    }, [coords, setImportEditCell])

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
                                    onClick={() => handleSemesterSelect(opt.id)}
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
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
            />
        )
    }

    const isCentered = ['semester'].includes(colKey)
    const displayValue = value || '-'
    const isEmpty = !value || value === '-'

    return (
        <div
            tabIndex={0}
            role="button"
            className={`group cursor-pointer hover:bg-[var(--color-primary)]/5 px-1.5 py-0.5 -mx-1.5 rounded-md transition-all flex items-center ${isCentered ? 'justify-center' : 'justify-between'} gap-2 min-h-[20px] ${isEmpty ? 'text-red-500/40 italic font-normal' : ''} outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1`}
            onClick={handleCellClick}
            onKeyDown={handleCellKeyDown}
            title={displayValue}
        >
            <span className={isCentered ? '' : 'truncate'}>{displayValue}</span>
            {!isCentered && <Pen className="w-2 h-2 opacity-0 group-hover:opacity-30 transition-opacity" />}
        </div>
    )
})

function computeDropdownPosition(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const menuHeight = 220
    const spaceBelow = window.innerHeight - rect.bottom
    const showUp = spaceBelow < menuHeight && rect.top > menuHeight
    return {
        top: showUp ? (rect.top + window.scrollY - menuHeight - 8) : (rect.bottom + window.scrollY + 8),
        right: window.innerWidth - rect.right,
        showUp
    }
}

function ReviewTableSkeleton() {
    return (
        <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)] shadow-sm animate-pulse">
            <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-9 bg-[var(--color-surface-alt)] rounded-xl" />
                ))}
            </div>
        </div>
    )
}

const ReviewDesktopTable = React.memo(({ visibleRows, filterIssuesOnly, visibleCols, selectedRows, onToggleRow, importEditCell, setImportEditCell, handleImportCellEdit, handleRemoveImportRow }) => {
    const allSelected = visibleRows.length > 0 && selectedRows.size === visibleRows.length
    const someSelected = selectedRows.size > 0 && !allSelected

    const handleSelectAll = useCallback(() => {
        if (allSelected) {
            onToggleRow('clear')
        } else {
            visibleRows.forEach(r => onToggleRow(r.originalIdx))
        }
    }, [allSelected, visibleRows, onToggleRow])

    return (
        <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse table-fixed">
                <thead className="bg-[var(--color-surface-alt)] sticky top-0 z-10">
                    <tr className="border-b border-[var(--color-border)] text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                        <th className="px-4 py-3 text-center w-12">
                            <input
                                type="checkbox"
                                aria-label={allSelected ? 'Batalkan pilihan semua baris' : 'Pilih semua baris'}
                                className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] accent-[var(--color-primary)] cursor-pointer"
                                checked={allSelected}
                                ref={el => { if (el) el.indeterminate = someSelected }}
                                onChange={handleSelectAll}
                            />
                        </th>
                        <th className="px-2 py-3 text-center w-10 text-[9px]">#</th>
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
                            <td colSpan="7" className="py-16 text-center">
                                <EmptyState icon={MagnifyingGlass} title={filterIssuesOnly ? 'Tidak ada isu ditemukan' : 'Tidak ada data preview'} description={filterIssuesOnly ? 'Semua baris valid, tidak ada error/duplikat' : 'Upload file dan lakukan mapping untuk melihat preview'} color="slate" variant="plain" />
                            </td>
                        </tr>
                    ) : visibleRows.map((r) => {
                        const i = r.originalIdx
                        const rowNum = i + 1
                        const status = getRowStatus(r)
                        const rowBg = status === 'error' ? 'bg-red-500/3 border-l-2 border-l-red-500' : status === 'dupe' ? 'bg-violet-500/3 border-l-2 border-l-violet-500' : ''
                        const statusIcon = getStatusIcon(status)
                        return (
                            <tr key={i} className={`hover:bg-[var(--color-surface-alt)]/40 transition-colors ${rowBg}`}>
                                <td className="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        aria-label={`Pilih baris ${rowNum}: ${r.academic_year || 'Tahun tidak dikenal'}`}
                                        className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] accent-[var(--color-primary)] cursor-pointer"
                                        checked={selectedRows.has(i)}
                                        onChange={() => onToggleRow(i)}
                                    />
                                </td>
                                <td className="px-2 py-3 text-center text-[9px] font-bold text-[var(--color-text-muted)] opacity-50">{rowNum}</td>
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
    )
})

const ReviewMobileCards = React.memo(({ visibleRows, filterIssuesOnly, visibleCols, selectedRows, onToggleRow, importEditCell, setImportEditCell, handleImportCellEdit, handleRemoveImportRow }) => {
    return (
        <div className="md:hidden divide-y divide-[var(--color-border)]/50 p-3">
            {visibleRows.length === 0 ? (
                <EmptyState icon={MagnifyingGlass} title={filterIssuesOnly ? 'Tidak ada isu ditemukan' : 'Tidak ada data preview'} description={filterIssuesOnly ? 'Semua baris valid, tidak ada error/duplikat' : 'Upload file dan lakukan mapping untuk melihat preview'} color="slate" variant="plain" className="py-8" />
                    ) : visibleRows.map((r) => {
                        const i = r.originalIdx
                        const rowNum = i + 1
                        const status = getRowStatus(r)
                        const rowBg = status === 'error' ? 'bg-red-500/3 border-l-4 border-l-red-500' : status === 'dupe' ? 'bg-violet-500/3 border-l-4 border-l-violet-500' : ''
                        const statusIcon = getStatusIcon(status)
                        return (
                            <div key={i} className={`rounded-xl p-3 transition-colors ${rowBg}`}>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            aria-label={`Pilih baris ${rowNum}: ${r.academic_year || 'Tahun tidak dikenal'}`}
                                            className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] accent-[var(--color-primary)] cursor-pointer"
                                            checked={selectedRows.has(i)}
                                            onChange={() => onToggleRow(i)}
                                        />
                                        <span className="text-[9px] font-bold text-[var(--color-text-muted)] opacity-40 min-w-[16px]">{rowNum}</span>
                                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${statusIcon.cls} ${statusIcon.extra}`}>
                                            <statusIcon.Icon className="w-3 h-3" />
                                        </span>
                                    </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 mb-1">
                                    <span className="font-bold text-[var(--color-text)] text-sm truncate">{r.academic_year || '-'}</span>
                                </div>
                                <div className="flex flex-wrap gap-2 text-[11px] text-[var(--color-text-muted)] items-center">
                                    {visibleCols.semester && (
                                        <EditableCell
                                            rowIdx={i} colKey="semester" value={r.semester}
                                            importEditCell={importEditCell} setImportEditCell={setImportEditCell}
                                            handleImportCellEdit={handleImportCellEdit}
                                        />
                                    )}
                                    {visibleCols.start_date && (
                                        <EditableCell
                                            rowIdx={i} colKey="start_date" value={r.start_date}
                                            importEditCell={importEditCell} setImportEditCell={setImportEditCell}
                                            handleImportCellEdit={handleImportCellEdit}
                                        />
                                    )}
                                    {visibleCols.end_date && (
                                        <EditableCell
                                            rowIdx={i} colKey="end_date" value={r.end_date}
                                            importEditCell={importEditCell} setImportEditCell={setImportEditCell}
                                            handleImportCellEdit={handleImportCellEdit}
                                        />
                                    )}
                                    <button
                                        onClick={() => handleRemoveImportRow(i)}
                                        className="w-7 h-7 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                        title="Hapus Baris"
                                    >
                                        <Trash className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
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
        importConflictStrategy,
        setImportConflictStrategy,
        importDetectedDateFormat,
        importColumnAliases,
        setImportColumnAliases,
        importAliasEditorOpen,
        setImportAliasEditorOpen,
        importDiffPreview = [],
        lastImportedIds,
        setLastImportedIds,
        handleUndoImport
    } = props

    const [filterIssuesOnly, setFilterIssuesOnly] = useState(false)
    const [importDiffOpen, setImportDiffOpen] = useState(false)
    const [colMenuOpen, setColMenuOpen] = useState(false)
    const colMenuBtnRef = useRef(null)
    const [colMenuPos, setColMenuPos] = useState({ top: 0, right: 0, showUp: false })
    const [visibleCols, setVisibleCols] = useState({
        period: true,
        semester: true,
        start_date: true,
        end_date: true,
    })
    const [selectedRows, setSelectedRows] = useState(new Set())
    const [searchQuery, setSearchQuery] = useState('')
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
    const [fileSizeError, setFileSizeError] = useState('')
    const [pendingDeletions, setPendingDeletions] = useState(new Set())
    const pendingDeletionsRef = useRef(pendingDeletions)
    const deletionTimerRef = useRef(null)
    const undoTimerRef = useRef(null)

    useEffect(() => {
        pendingDeletionsRef.current = pendingDeletions
    }, [pendingDeletions])

    const prevOpenRef = useRef(isOpen)
    useEffect(() => {
        if (isOpen && !prevOpenRef.current) {
            setSearchQuery('')
            setFilterIssuesOnly(false)
            setSelectedRows(new Set())
            setPendingDeletions(new Set())
            setVisibleCount(PAGE_SIZE)
            setImportStep(1)
            if (deletionTimerRef.current) {
                clearTimeout(deletionTimerRef.current)
                deletionTimerRef.current = null
            }
        }
        prevOpenRef.current = isOpen
    }, [isOpen, setImportStep])

    useEffect(() => {
        if (lastImportedIds.length > 0) {
            undoTimerRef.current = setTimeout(() => {
                setLastImportedIds([])
                onClose()
            }, 15000)
            return () => {
                if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
            }
        }
    }, [lastImportedIds, setLastImportedIds, onClose])

    const handleUndo = useCallback(() => {
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
        handleUndoImport()
    }, [handleUndoImport])

    const previewWithIdx = useMemo(() =>
        importPreview.map((r, i) => ({ ...r, originalIdx: i }))
    , [importPreview])

    const filteredPreview = useMemo(() => {
        let result = previewWithIdx
        if (filterIssuesOnly) result = result.filter(r => hasRowIssue(r))
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            result = result.filter(r =>
                (r.academic_year && r.academic_year.toLowerCase().includes(q)) ||
                (r.semester && r.semester.toLowerCase().includes(q))
            )
        }
        return result
    }, [previewWithIdx, filterIssuesOnly, searchQuery])

    const displayPreview = useMemo(() =>
        filteredPreview.filter(r => !pendingDeletions.has(r.originalIdx))
    , [filteredPreview, pendingDeletions])

    const visibleRows = useMemo(() => displayPreview.slice(0, visibleCount), [displayPreview, visibleCount])

    const statValues = useMemo(() => {
        let dupe = 0, error = 0
        for (let idx = 0; idx < importPreview.length; idx++) {
            if (pendingDeletions.has(idx)) continue
            if (importPreview[idx]._isDupe) dupe++
            else if (importPreview[idx]._hasError) error++
        }
        return { total: importPreview.length - pendingDeletions.size, ready: importReadyRows.length, dupe, error }
    }, [importPreview, importReadyRows, pendingDeletions])

    const diffUpdates = useMemo(() => importDiffPreview.filter(d => d.status === 'update'), [importDiffPreview])

    const fileHeaderOptions = useMemo(() =>
        importFileHeaders.map(h => ({ id: h, name: h }))
    , [importFileHeaders])

    const handleProcessFile = useCallback((file) => {
        setFileSizeError('')
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            setFileSizeError(`Ukuran file melebihi ${MAX_FILE_SIZE_MB}MB (${(file.size / 1024 / 1024).toFixed(1)}MB)`)
            return
        }
        processImportFile(file)
    }, [processImportFile])

    const toggleRowSelection = useCallback((idx) => {
        if (idx === 'clear') {
            setSelectedRows(new Set())
            return
        }
        setSelectedRows(prev => {
            const next = new Set(prev)
            if (next.has(idx)) {
                next.delete(idx)
            } else {
                next.add(idx)
            }
            return next
        })
    }, [])

    const flushPendingDeletions = useCallback(() => {
        const current = pendingDeletionsRef.current
        if (current.size === 0) return
        const sorted = [...current].sort((a, b) => b - a)
        sorted.forEach(i => handleRemoveImportRow(i))
        setPendingDeletions(new Set())
        setSelectedRows(new Set())
        deletionTimerRef.current = null
    }, [handleRemoveImportRow])

    const addPendingDeletion = useCallback((idx) => {
        setPendingDeletions(prev => {
            const next = new Set(prev)
            next.add(idx)
            return next
        })
        if (deletionTimerRef.current) clearTimeout(deletionTimerRef.current)
        deletionTimerRef.current = setTimeout(flushPendingDeletions, 5000)
    }, [flushPendingDeletions])

    const undoDeletions = useCallback(() => {
        if (deletionTimerRef.current) clearTimeout(deletionTimerRef.current)
        deletionTimerRef.current = null
        setPendingDeletions(new Set())
    }, [])

    const handleDeleteRow = useCallback((i) => addPendingDeletion(i), [addPendingDeletion])

    const handleBulkDelete = useCallback(() => {
        if (selectedRows.size === 0) return
        const current = pendingDeletionsRef.current
        const next = new Set(current)
        selectedRows.forEach(i => next.add(i))
        setPendingDeletions(next)
        if (deletionTimerRef.current) clearTimeout(deletionTimerRef.current)
        deletionTimerRef.current = setTimeout(flushPendingDeletions, 5000)
        setSelectedRows(new Set())
    }, [selectedRows, flushPendingDeletions])

    const handleToggleFilterIssues = useCallback(() => setFilterIssuesOnly(v => !v), [])

    const handleToggleColMenu = useCallback((e) => {
        const pos = computeDropdownPosition(e)
        setColMenuPos(pos)
        setColMenuOpen(v => !v)
    }, [])

    useEffect(() => {
        if (!colMenuOpen) return
        const handleClickOutside = (e) => {
            if (colMenuBtnRef.current && !colMenuBtnRef.current.contains(e.target)) {
                setColMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [colMenuOpen])

    const handleToggleColVisibility = useCallback((key) => {
        setVisibleCols(p => ({ ...p, [key]: !p[key] }))
    }, [])

    const handleGoToStep = useCallback((stepOrFn) => {
        setImportStep(prev => {
            const next = typeof stepOrFn === 'function' ? stepOrFn(prev) : stepOrFn
            return Math.max(1, Math.min(3, next))
        })
    }, [setImportStep])

    const handleReviewPreview = useCallback(async () => {
        setPendingDeletions(new Set())
        if (deletionTimerRef.current) clearTimeout(deletionTimerRef.current)
        deletionTimerRef.current = null
        handleGoToStep(3)
        setImportLoading(true)
        await buildImportPreview(importRawData, importColumnMapping)
        setImportLoading(false)
    }, [handleGoToStep, setImportLoading, buildImportPreview, importRawData, importColumnMapping])

    useEffect(() => {
        return () => {
            if (deletionTimerRef.current) {
                clearTimeout(deletionTimerRef.current)
                const current = pendingDeletionsRef.current
                if (current.size > 0) {
                    const sorted = [...current].sort((a, b) => b - a)
                    sorted.forEach(i => handleRemoveImportRow(i))
                }
            }
        }
    }, [handleRemoveImportRow])

    const importMappingContent = (<div className="space-y-3">
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
                                            <Select
                                                small
                                                value={mapped || ''}
                                                onChange={(val) => setImportColumnMapping(v => ({ ...v, [sys.key]: val }))}
                                                options={fileHeaderOptions}
                                                placeholder="-- Lewati Kolom --"
                                                extraOption={{ id: '', name: '-- Lewati Kolom --' }}
                                                status={mapped ? 'success' : 'normal'}
                                                searchable={importFileHeaders.length > SEARCHABLE_THRESHOLD}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <button
                            onClick={() => setImportAliasEditorOpen(v => !v)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all ${importAliasEditorOpen ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'}`}
                        >
                            <PencilSimple className="w-3 h-3" />
                            Alias Kolom
                        </button>
                    </div>
                    {importAliasEditorOpen && (
                        <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Sesuaikan Nama Kolom Kustom</p>
                            {SYSTEM_COLS.map(sys => (
                                <div key={sys.key} className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-[var(--color-text-muted)] w-28 shrink-0 truncate" title={sys.label}>{sys.label}</span>
                                    <input
                                        type="text"
                                        value={importColumnAliases[sys.key] || ''}
                                        onChange={e => setImportColumnAliases(prev => ({ ...prev, [sys.key]: e.target.value }))}
                                        placeholder="Nama kolom di file (kosongkan untuk auto-match)"
                                        className="flex-1 h-7 px-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[10px] font-bold outline-none focus:border-[var(--color-primary)] transition-all placeholder:text-[var(--color-text-muted)] placeholder:opacity-30"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                    </div>)

    if (!isOpen) return null

    const successScreen = (
        <div className="flex flex-col items-center justify-center py-10 gap-5 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping"></div>
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/15"></div>
                <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                    <CheckCircle className="text-white w-7 h-7" weight="fill" />
                </div>
            </div>
            <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-black text-emerald-700">Import Berhasil</span>
                <span className="text-[10px] font-bold text-[var(--color-text-muted)]">{lastImportedIds.length} periode berhasil ditambahkan</span>
                <span className="text-[8px] font-extrabold text-emerald-500/60 uppercase tracking-[0.2em] animate-pulse mt-2">Menutup otomatis 15 detik...</span>
            </div>
        </div>
    )

    const importSteps = (<>
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
                <div key={importStep} className="space-y-2.5 animate-in fade-in slide-in-from-right-4 duration-300">
                    <Dropzone
                        onFileSelect={handleProcessFile}
                        dragOver={importDragOver}
                        setDragOver={setImportDragOver}
                    />
                    {fileSizeError && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/5 border border-red-500/20 text-red-600 text-[10px] font-bold animate-in fade-in slide-in-from-top-2 duration-300">
                            <WarningCircle className="w-3 h-3 shrink-0" />
                            {fileSizeError}
                        </div>
                    )}

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
                <div key={importStep} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Cocokkan Kolom File</span>
                        <span className="text-[9px] font-bold py-1 px-2 rounded-lg bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                            {importFileHeaders.length} kolom ditemukan
                        </span>
                        {importDetectedDateFormat && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[8px] font-black uppercase tracking-wider ml-2">
                                <Calendar className="w-2.5 h-2.5" />
                                Format: {importDetectedDateFormat}
                            </span>
                        )}
                    </div>

                    {importFileHeaders.length === 0 ? (
                        <div className="py-8">
                            <EmptyState icon={FileText} title="Belum ada data kolom" description="Upload file Excel/CSV terlebih dahulu untuk melihat mapping kolom" color="slate" variant="plain" />
                        </div>
                    ) : importMappingContent
                    }
                </div>
            )}

            {importStep === 3 && (
                <div key={importStep} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    {importLoading ? (
                        <ReviewTableSkeleton />
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
                                    <div className="flex items-center gap-0.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-0.5">
                                        {[
                                            { id: 'skip', label: 'Lewati', short: 'Lwt', icon: Copy },
                                            { id: 'replace', label: 'Timpa', short: 'Tmp', icon: ArrowClockwise },
                                            { id: 'keep', label: 'Biarkan', short: 'Brk', icon: Check },
                                        ].map(strat => (
                                            <button
                                                key={strat.id}
                                                onClick={() => setImportConflictStrategy(strat.id)}
                                                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all
                                                    ${importConflictStrategy === strat.id
                                                        ? 'bg-violet-500 text-white shadow-sm'
                                                        : 'text-[var(--color-text-muted)] hover:text-violet-600 hover:bg-violet-500/5'}`}
                                                title={strat.label}
                                            >
                                                <strat.icon className="w-3 h-3" />
                                                <span className="hidden sm:inline">{strat.label}</span>
                                                <span className="sm:hidden">{strat.short}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleToggleFilterIssues}
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
                                            onClick={handleToggleColMenu}
                                            title="Atur tampilan kolom"
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${colMenuOpen ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'}`}
                                        >
                                            <SquaresFour />
                                        </button>
                                        {colMenuOpen && createPortal(
                                            <div className={`fixed z-[9999] w-48 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl shadow-black/10 p-2 space-y-0.5 animate-in fade-in zoom-in-95 ${colMenuPos.showUp ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2'}`}
                                                style={{ top: colMenuPos.top, right: colMenuPos.right }}>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] px-3 py-2">Atur Kolom</p>
                                                {COL_VISIBLE_DEFS.map(({ key, label }) => (
                                                    <button key={key} onClick={() => handleToggleColVisibility(key)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-alt)] transition-all group text-left">
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

                            {/* Diff Preview Section */}
                            {diffUpdates.length > 0 && (
                                <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)] shadow-sm">
                                    <button
                                        type="button"
                                        onClick={() => setImportDiffOpen(v => !v)}
                                        className="w-full px-3 py-2 bg-[var(--color-surface-alt)] border-b border-[var(--color-border)] flex items-center justify-between hover:bg-[var(--color-border)]/30 transition-colors cursor-pointer"
                                    >
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] flex items-center gap-1.5">
                                            <CaretDown className={`w-2 h-2 transition-transform ${importDiffOpen ? '' : '-rotate-90'}`} />
                                            <GitDiff className="w-3 h-3 text-amber-500" />
                                            Perubahan Data ({diffUpdates.length} baris akan ditimpa)
                                        </span>
                                        <span className="text-[8px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full">update</span>
                                    </button>
                                    {importDiffOpen && (
                                        <div className="max-h-[180px] overflow-auto divide-y divide-[var(--color-border)]/50">
                                            {diffUpdates.map((diff, idx) => (
                                                <div key={idx} className="px-3 py-2.5 space-y-1.5 hover:bg-[var(--color-surface-alt)]/30 transition-colors">
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--color-text)]">
                                                        <span>{diff.academic_year}</span>
                                                        <span className="px-1.5 py-0.5 rounded bg-[var(--color-surface-alt)] text-[8px] font-black text-[var(--color-text-muted)]">{diff.semester}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-[9px] font-bold pl-2">
                                                        <div className="flex-1 space-y-0.5">
                                                            <span className="text-[8px] font-black uppercase tracking-wider text-red-500/60">Existing</span>
                                                            {diff.existing ? (
                                                                <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                                                                    <span>{diff.existing.start_date}</span>
                                                                    <ArrowFatRight className="w-2 h-2 opacity-40" />
                                                                    <span>{diff.existing.end_date}</span>
                                                                    {diff.existing.is_active && <span className="px-1 py-0.5 rounded bg-green-500/10 text-green-600 text-[7px] font-black">Aktif</span>}
                                                                </div>
                                                            ) : (
                                                                <span className="text-red-500/40 italic">-- tidak ada --</span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 space-y-0.5">
                                                            <span className="text-[8px] font-black uppercase tracking-wider text-emerald-500/60">Incoming</span>
                                                            <div className="flex items-center gap-2 text-[var(--color-text)]">
                                                                <span>{diff.incoming.start_date}</span>
                                                                <ArrowFatRight className="w-2 h-2 opacity-40" />
                                                                <span>{diff.incoming.end_date}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Search filter */}
                            <div className="relative">
                                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--color-text-muted)] opacity-40" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => { setSearchQuery(e.target.value); setVisibleCount(PAGE_SIZE) }}
                                    placeholder="Cari tahun pelajaran atau semester..."
                                    className="w-full h-9 pl-8 pr-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[10px] font-bold text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] placeholder:opacity-40 outline-none focus:border-[var(--color-primary)] transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => { setSearchQuery(''); setVisibleCount(PAGE_SIZE) }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--color-surface-alt)] flex items-center justify-center text-[8px] font-black text-[var(--color-text-muted)] hover:bg-[var(--color-border)] transition-all"
                                    >
                                        X
                                    </button>
                                )}
                            </div>

                            {/* Bulk action bar when rows selected */}
                            {selectedRows.size > 0 && (
                                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-red-500/5 border border-red-500/20 animate-in slide-in-from-top-2 fade-in">
                                    <span className="text-[10px] font-black text-red-600">{selectedRows.size} baris terpilih</span>
                                    <div className="flex-1" />
                                    <button
                                        onClick={handleBulkDelete}
                                        className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all"
                                    >
                                        <Trash className="w-3 h-3" />
                                        Hapus
                                    </button>
                                    <button
                                        onClick={() => setSelectedRows(new Set())}
                                        className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest hover:text-[var(--color-text)] transition-colors"
                                    >
                                        Batal
                                    </button>
                                </div>
                            )}

                            {/* Undo bar when rows pending deletion */}
                            {pendingDeletions.size > 0 && (
                                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 animate-in slide-in-from-top-2 fade-in">
                                    <span className="text-[10px] font-black text-amber-600">{pendingDeletions.size} baris akan dihapus otomatis</span>
                                    <div className="flex-1" />
                                    <button
                                        onClick={undoDeletions}
                                        className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all"
                                    >
                                        <ArrowClockwise className="w-3 h-3" />
                                        Undo
                                    </button>
                                </div>
                            )}

                            <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)] shadow-sm">
                                <div className="max-h-[40vh] overflow-auto scrollbar-none">
                                    <ReviewDesktopTable
                                        visibleRows={visibleRows}
                                        filterIssuesOnly={filterIssuesOnly}
                                        visibleCols={visibleCols}
                                        selectedRows={selectedRows}
                                        onToggleRow={toggleRowSelection}
                                        importEditCell={importEditCell}
                                        setImportEditCell={setImportEditCell}
                                        handleImportCellEdit={handleImportCellEdit}
                                        handleRemoveImportRow={handleDeleteRow}
                                    />

                                    <ReviewMobileCards
                                        visibleRows={visibleRows}
                                        filterIssuesOnly={filterIssuesOnly}
                                        visibleCols={visibleCols}
                                        selectedRows={selectedRows}
                                        onToggleRow={toggleRowSelection}
                                        importEditCell={importEditCell}
                                        setImportEditCell={setImportEditCell}
                                        handleImportCellEdit={handleImportCellEdit}
                                        handleRemoveImportRow={handleDeleteRow}
                                    />
                                </div>
                                {displayPreview.length > visibleCount && (
                                    <div className="px-4 py-2 border-t border-[var(--color-border)]">
                                        <button
                                            onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                                            className="w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all active:scale-[0.99]"
                                        >
                                            Muat {Math.min(PAGE_SIZE, displayPreview.length - visibleCount)} baris lagi ({displayPreview.length - visibleCount} tersisa) <CaretDown className="w-2 h-2 inline-block ml-1" />
                                        </button>
                                    </div>
                                )}
                                <div className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] bg-[var(--color-surface-alt)] border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-4">
                                        <span>Menampilkan {visibleRows.length} dari {displayPreview.length} baris (difilter)</span>
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
            )}</>)

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
                    {lastImportedIds.length > 0 ? (
                        <>
                            <button onClick={handleUndo} className="h-10 px-6 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-red-500/20">
                                <Trash className="w-3 h-3" /> Batalkan Import
                            </button>
                            <div className="flex-1" />
                            <button onClick={onClose} className="h-10 px-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-surface-alt)] transition-all">
                                Tutup
                            </button>
                        </>
                    ) : (<React.Fragment>
                    {importStep === 1 ? (
                        <button
                            onClick={onClose}
                            className="h-10 px-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-surface-alt)] transition-all flex items-center justify-center"
                        >
                            Batal
                        </button>
                    ) : (
                        <button
                            onClick={() => handleGoToStep(v => v - 1)}
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
                                <span className="text-[var(--color-primary)]">({Math.round((importProgress.done / Math.max(importProgress.total, 1)) * 100)}%)</span>
                            </span>
                        )}

                        {importStep === 1 ? (
                            <button
                                onClick={() => (importRawData.length > 0 && importFileName) ? handleGoToStep(2) : importFileInputRef.current?.click()}
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
                                onClick={handleReviewPreview}
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
                </React.Fragment>)}
            </div>
            }
        >
            {lastImportedIds.length > 0 ? successScreen : importSteps}
        </Modal>
    )
}
