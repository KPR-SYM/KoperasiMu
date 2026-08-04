import React, { useState, useRef, useMemo, useCallback, useEffect, createContext, useContext } from 'react'
import { WarningCircle, Warning, ArrowLeft, ArrowsLeftRight, ArrowRight, Calendar, Check, CheckCircle, CaretDown, Copy, DownloadSimple, FileArrowDown, FileText, SlidersHorizontal, List, Spinner, Pen, Trash, UploadSimple, MagnifyingGlass, SquaresFour, ArrowClockwise, PencilSimple, GitDiff, ArrowFatRight, Funnel, Export, DotsSix, Shield } from '@phosphor-icons/react'
import { createPortal } from 'react-dom'

import { Select, EmptyState, Dropzone } from '@shared/components'

const STEPS = [
    { step: 1, label: 'Upload' },
    { step: 2, label: 'Atur' },
    { step: 3, label: 'Pratinjau' },
]

const TEMPLATE_COLS = [
    { l: 'A', k: 'academic_year', n: 'Tahun Pelajaran', w: 'w-[25%]' },
    { l: 'B', k: 'semester', n: 'Semester', w: 'w-[25%]' },
    { l: 'C', k: 'start_date', n: 'Tanggal Mulai', w: 'w-[25%]' },
    { l: 'D', k: 'end_date', n: 'Tanggal Selesai', w: 'w-[25%]' },
]

const COL_VISIBLE_DEFS = TEMPLATE_COLS.map(c => ({ key: c.k, label: c.n }))

const SAMPLE_ROWS = [
    ['2023/2024', 'Ganjil', '2023-07-01', '2023-12-31'],
    ['2023/2024', 'Genap', '2024-01-01', '2024-06-30'],
    ['2024/2025', 'Ganjil', '2024-07-01', '2024-12-31'],
    ['2024/2025', 'Genap', '2025-01-01', '2025-06-30'],
    ['2025/2026', 'Ganjil', '2025-07-01', '2025-12-31'],
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

const DragDropContext = createContext(null)

function useDragDrop() {
    return useContext(DragDropContext)
}

function DraggableItem({ id, index, onMove, children, className = '' }) {
    const { draggedId, setDraggedId, dragOverId, setDragOverId } = useDragDrop()
    const isDragging = draggedId === id
    const isDragOver = dragOverId === id

    const handleDragStart = useCallback((e) => {
        setDraggedId(id)
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', id)
    }, [id, setDraggedId])

    const handleDragOver = useCallback((e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (dragOverId !== id) setDragOverId(id)
    }, [id, dragOverId, setDragOverId])

    const handleDragLeave = useCallback(() => {
        if (dragOverId === id) setDragOverId(null)
    }, [id, dragOverId, setDragOverId])

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        if (draggedId && draggedId !== id) {
            onMove(draggedId, id)
        }
        setDraggedId(null)
        setDragOverId(null)
    }, [draggedId, id, onMove, setDraggedId, setDragOverId])

    const handleDragEnd = useCallback(() => {
        setDraggedId(null)
        setDragOverId(null)
    }, [setDraggedId, setDragOverId])

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            className={`transition-all ${isDragging ? 'opacity-40 scale-[0.98]' : ''} ${isDragOver ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20' : ''} ${className}`}
        >
            {children}
        </div>
    )
}

function DragDropProvider({ children }) {
    const [draggedId, setDraggedId] = useState(null)
    const [dragOverId, setDragOverId] = useState(null)
    return (
        <DragDropContext.Provider value={{ draggedId, setDraggedId, dragOverId, setDragOverId }}>
            {children}
        </DragDropContext.Provider>
    )
}

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
                    <div className="bg-[var(--color-primary)]/10 rounded-lg px-1.5 py-0.5 text-[var(--color-primary)] font-black text-[10px] uppercase text-center border border-[var(--color-primary)] shadow-sm">
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
                className="w-full bg-[var(--color-surface)] border-2 border-[var(--color-primary)] rounded-lg px-1.5 py-0.5 text-[10px] font-black outline-none shadow-lg transition-all"
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
            className={`group cursor-pointer hover:bg-[var(--color-primary)]/5 px-1 py-0.5 -mx-1 rounded-md transition-all flex items-center ${isCentered ? 'justify-center' : 'justify-between'} gap-1 min-h-[18px] text-[10px] font-bold ${isEmpty ? 'text-red-500/40 italic font-normal' : ''} outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1`}
            onClick={handleCellClick}
            onKeyDown={handleCellKeyDown}
            title={displayValue}
        >
            <span className={isCentered ? '' : 'truncate'}>{displayValue}</span>
            {!isCentered && <Pen className="w-1.5 h-1.5 opacity-0 group-hover:opacity-30 transition-opacity" />}
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

const CONFLICT_OPTS = [
    { id: 'skip', label: 'Lewati', color: 'text-slate-500', bg: 'bg-slate-500/10', activeBg: 'bg-slate-500 text-white', pill: 'bg-slate-500/15 text-slate-600' },
    { id: 'replace', label: 'Timpa', color: 'text-amber-600', bg: 'bg-amber-500/10', activeBg: 'bg-amber-500 text-white', pill: 'bg-amber-500/15 text-amber-600' },
    { id: 'keep', label: 'Biarkan', color: 'text-violet-600', bg: 'bg-violet-500/10', activeBg: 'bg-violet-500 text-white', pill: 'bg-violet-500/15 text-violet-600' },
]

function RowActionDropdown({ rowIdx, currentStrategy, onSelect }) {
    const [open, setOpen] = useState(false)
    const btnRef = useRef(null)
    const current = CONFLICT_OPTS.find(o => o.id === currentStrategy) || CONFLICT_OPTS[0]

    const handleToggle = useCallback((e) => {
        e.stopPropagation()
        setOpen(v => !v)
    }, [])

    const handleSelect = useCallback((optId) => {
        onSelect(rowIdx, optId)
        setOpen(false)
    }, [rowIdx, onSelect])

    useEffect(() => {
        if (!open) return
        const handlePointerDown = (e) => {
            if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('pointerdown', handlePointerDown)
        return () => document.removeEventListener('pointerdown', handlePointerDown)
    }, [open])

    return (
        <div className="relative inline-flex items-center">
            <div ref={btnRef}>
                <button
                    onClick={handleToggle}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all border ${open ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)]'}`}
                    title={`Aksi: ${current.label}`}
                >
                    <DotsSix className="w-3.5 h-3.5" weight="bold" />
                </button>
                {open && createPortal(
                    <div className="fixed z-[9999] w-36 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl shadow-black/10 p-1.5 animate-in fade-in zoom-in-95 duration-150"
                        style={{ top: btnRef.current ? btnRef.current.getBoundingClientRect().bottom + 4 : 0, right: btnRef.current ? window.innerWidth - btnRef.current.getBoundingClientRect().right : 0 }}>
                        <p className="text-[7px] font-black uppercase tracking-widest text-[var(--color-text-muted)] px-3 pt-1 pb-1.5">Aksi Konflik</p>
                        {CONFLICT_OPTS.map(opt => (
                            <button
                                key={opt.id}
                                onPointerDown={(e) => { e.stopPropagation(); e.preventDefault() }}
                                onClick={(e) => { e.stopPropagation(); handleSelect(opt.id) }}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold transition-all text-left
                                    ${currentStrategy === opt.id ? 'bg-[var(--color-surface-alt)] text-[var(--color-text)]' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]'}`}
                            >
                                <span className={`w-2 h-2 rounded-full ${opt.bg} ${opt.color}`} />
                                {opt.label}
                                {currentStrategy === opt.id && <Check className="w-2.5 h-2.5 ml-auto text-[var(--color-primary)]" />}
                            </button>
                        ))}
                    </div>,
                    document.body
                )}
            </div>
        </div>
    )
}
const ReviewDesktopTable = React.memo(({ visibleRows, filterIssuesOnly, visibleCols, selectedRows, onToggleRow, importEditCell, setImportEditCell, handleImportCellEdit, handleRemoveImportRow, getRowErrorMessage, rowConflictOverrides, onSetRowConflictOverride, importConflictStrategy }) => {
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
        <div className="hidden md:block">
            <table className="w-full border-collapse table-fixed" role="grid" aria-label="Data import preview">
                <colgroup>
                    <col className="w-8" />
                    <col className="w-6" />
                    {visibleCols.academic_year && <col />}
                    {visibleCols.semester && <col className="w-[15%]" />}
                    {visibleCols.start_date && <col />}
                    {visibleCols.end_date && <col />}
                    <col className="w-16" />
                </colgroup>
                <thead className="bg-[var(--color-surface-alt)] sticky top-0 z-10">
                    <tr className="border-b border-[var(--color-border)] text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                        <th className="px-2 py-2.5 text-center" scope="col">
                            <input
                                type="checkbox"
                                aria-label={allSelected ? 'Batalkan pilihan semua baris' : 'Pilih semua baris'}
                                className="w-3.5 h-3.5 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] accent-[var(--color-primary)] cursor-pointer"
                                checked={allSelected}
                                ref={el => { if (el) el.indeterminate = someSelected }}
                                onChange={handleSelectAll}
                            />
                        </th>
                        <th className="px-2 py-2.5 text-center text-[9px]" scope="col">#</th>
                        {visibleCols.academic_year && <th className="px-3 py-2.5 text-left truncate" scope="col">Tahun Pelajaran</th>}
                        {visibleCols.semester && <th className="px-3 py-2.5 text-center truncate" scope="col">Semester</th>}
                        {visibleCols.start_date && <th className="px-3 py-2.5 text-left truncate" scope="col">Tanggal Mulai</th>}
                        {visibleCols.end_date && <th className="px-3 py-2.5 text-left truncate" scope="col">Tanggal Selesai</th>}
                        <th className="px-2 py-2.5 text-center" scope="col">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]/50">
                    {visibleRows.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="py-12 text-center">
                                <EmptyState icon={MagnifyingGlass} title={filterIssuesOnly ? 'Tidak ada isu ditemukan' : 'Tidak ada data preview'} description={filterIssuesOnly ? 'Semua baris valid, tidak ada error/duplikat' : 'Upload file dan lakukan mapping untuk melihat preview'} color="slate" variant="plain" />
                            </td>
                        </tr>
                    ) : visibleRows.map((r) => {
                        const i = r.originalIdx
                        const rowNum = i + 1
                        const status = getRowStatus(r)
                        const rowBg = status === 'error' ? 'bg-red-500/3 border-l-2 border-l-red-500' : status === 'dupe' ? 'bg-violet-500/3 border-l-2 border-l-violet-500' : ''
                        const statusIcon = getStatusIcon(status)
                        const errorMsg = getRowErrorMessage(r)
                        return (
                            <tr key={i} className={`hover:bg-[var(--color-surface-alt)]/40 transition-colors ${rowBg}`} title={errorMsg}>
                                <td className="px-2 py-2">
                                    <input
                                        type="checkbox"
                                        aria-label={`Pilih baris ${rowNum}: ${r.academic_year || 'Tahun tidak dikenal'}`}
                                        className="w-3.5 h-3.5 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] accent-[var(--color-primary)] cursor-pointer"
                                        checked={selectedRows.has(i)}
                                        onChange={() => onToggleRow(i)}
                                    />
                                </td>
                                <td className="px-2 py-2 text-center text-[9px] font-bold text-[var(--color-text-muted)] opacity-50">{rowNum}</td>
                                {visibleCols.academic_year && (
                                    <td className="px-3 py-2 min-w-0">
                                        <EditableCell
                                            rowIdx={i} colKey="academic_year" value={r.academic_year}
                                            importEditCell={importEditCell} setImportEditCell={setImportEditCell}
                                            handleImportCellEdit={handleImportCellEdit}
                                        />
                                    </td>
                                )}
                                {visibleCols.semester && (
                                    <td className="px-3 py-2 text-center min-w-0">
                                        <EditableCell
                                            rowIdx={i} colKey="semester" value={r.semester}
                                            importEditCell={importEditCell} setImportEditCell={setImportEditCell}
                                            handleImportCellEdit={handleImportCellEdit}
                                        />
                                    </td>
                                )}
                                {visibleCols.start_date && (
                                    <td className="px-3 py-2 min-w-0">
                                        <EditableCell
                                            rowIdx={i} colKey="start_date" value={r.start_date}
                                            importEditCell={importEditCell} setImportEditCell={setImportEditCell}
                                            handleImportCellEdit={handleImportCellEdit}
                                        />
                                    </td>
                                )}
                                {visibleCols.end_date && (
                                    <td className="px-3 py-2 min-w-0">
                                        <EditableCell
                                            rowIdx={i} colKey="end_date" value={r.end_date}
                                            importEditCell={importEditCell} setImportEditCell={setImportEditCell}
                                            handleImportCellEdit={handleImportCellEdit}
                                        />
                                    </td>
                                )}
                                <td className="px-2 py-2 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        {status === 'dupe' ? (
                                            <RowActionDropdown
                                                rowIdx={i}
                                                currentStrategy={rowConflictOverrides?.[i] || importConflictStrategy}
                                                onSelect={onSetRowConflictOverride}
                                            />
                                        ) : (
                                            <>
                                                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${statusIcon.cls} ${statusIcon.extra}`} title={errorMsg || status}>
                                                    <statusIcon.Icon className="w-2.5 h-2.5" />
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveImportRow(i)}
                                                    className="w-5 h-5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center group/del"
                                                    title="Hapus Baris"
                                                    aria-label={`Hapus baris ${rowNum}`}
                                                >
                                                    <Trash className="w-2.5 h-2.5 group-hover/del:scale-110 transition-transform" />
                                                </button>
                                            </>
                                        )}
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

const ReviewMobileCards = React.memo(({ visibleRows, filterIssuesOnly, visibleCols, selectedRows, onToggleRow, importEditCell, setImportEditCell, handleImportCellEdit, handleRemoveImportRow, getRowErrorMessage, rowConflictOverrides, onSetRowConflictOverride, importConflictStrategy }) => {
    return (
        <div className="md:hidden divide-y divide-[var(--color-border)]/50 p-3" role="list" aria-label="Data import preview mobile">
            {visibleRows.length === 0 ? (
                <EmptyState icon={MagnifyingGlass} title={filterIssuesOnly ? 'Tidak ada isu ditemukan' : 'Tidak ada data preview'} description={filterIssuesOnly ? 'Semua baris valid, tidak ada error/duplikat' : 'Upload file dan lakukan mapping untuk melihat preview'} color="slate" variant="plain" className="py-8" />
            ) : visibleRows.map((r) => {
                const i = r.originalIdx
                const rowNum = i + 1
                const status = getRowStatus(r)
                const rowBg = status === 'error' ? 'bg-red-500/3 border-l-4 border-l-red-500' : status === 'dupe' ? 'bg-violet-500/3 border-l-4 border-l-violet-500' : ''
                const statusIcon = getStatusIcon(status)
                const errorMsg = getRowErrorMessage(r)
                return (
                    <div key={i} className={`rounded-xl p-2.5 transition-colors ${rowBg}`} role="listitem" title={errorMsg}>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5">
                                <input
                                    type="checkbox"
                                    aria-label={`Pilih baris ${rowNum}: ${r.academic_year || 'Tahun tidak dikenal'}`}
                                    className="w-3.5 h-3.5 rounded border-[var(--color-border)] text-[var(--color-primary)] accent-[var(--color-primary)] cursor-pointer"
                                    checked={selectedRows.has(i)}
                                    onChange={() => onToggleRow(i)}
                                />
                                <span className="text-[9px] font-bold text-[var(--color-text-muted)] opacity-40 min-w-[14px]">{rowNum}</span>
                                <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${statusIcon.cls} ${statusIcon.extra}`} title={errorMsg || status}>
                                    <statusIcon.Icon className="w-2 h-2" />
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 mb-0.5">
                                    <span className="font-bold text-[var(--color-text)] text-[11px] truncate">{r.academic_year || '-'}</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 text-[10px] text-[var(--color-text-muted)] items-center">
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
                                    {status === 'dupe' ? (
                                        <RowActionDropdown
                                            rowIdx={i}
                                            currentStrategy={rowConflictOverrides?.[i] || importConflictStrategy}
                                            onSelect={onSetRowConflictOverride}
                                        />
                                    ) : (
                                        <button
                                            onClick={() => handleRemoveImportRow(i)}
                                            className="w-5 h-5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                            title="Hapus Baris"
                                            aria-label={`Hapus baris ${rowNum}`}
                                        >
                                            <Trash className="w-2.5 h-2.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
})

export default function PeriodImportPanel(props) {
    const {
        isOpen,
        onClose,
        importing,
        importStep,
        setImportStep,
        importPreview = [],
        importFileName,
        importFileInputRef,
        importDragOver,
        setImportDragOver,
        processImportFile,
        handleDownloadTemplate,
        importFileHeaders = [],
        SYSTEM_COLS,
        importColumnMapping = {},
        setImportColumnMapping,
        importRawData,
        importLoading,
        setImportLoading,
        buildImportPreview,
        importIssues = [],
        importValidationOpen,
        setImportValidationOpen,
        importProgress,
        handleCommitImport,
        handleImportClick,
        hasImportBlockingErrors,
        importReadyRows = [],
        handleImportCellEdit,
        importEditCell,
        setImportEditCell,
        handleRemoveImportRow,
        importConflictStrategy,
        setImportConflictStrategy,
        importDetectedDateFormat,
        importColumnAliases = {},
        setImportColumnAliases,
        importAliasEditorOpen,
        setImportAliasEditorOpen,
        importDiffPreview = [],
        lastImportedIds = [],
        setLastImportedIds,
        handleUndoImport
    } = props

    const [filterIssuesOnly, setFilterIssuesOnly] = useState(false)
    const [importDiffOpen, setImportDiffOpen] = useState(false)
    const [mappingOrder, setMappingOrder] = useState([])
    const [colMenuOpen, setColMenuOpen] = useState(false)
    const colMenuBtnRef = useRef(null)
    const [colMenuPos, setColMenuPos] = useState({ top: 0, right: 0, showUp: false })
    const [visibleCols, setVisibleCols] = useState({
        academic_year: true,
        semester: true,
        start_date: true,
        end_date: true,
    })
    const [selectedRows, setSelectedRows] = useState(new Set())
    const [searchQuery, setSearchQuery] = useState('')
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
    const [fileSizeError, setFileSizeError] = useState('')
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [pendingDeletions, setPendingDeletions] = useState(new Set())
    const [rowConflictOverrides, setRowConflictOverrides] = useState({})
    const [showSidebar, setShowSidebar] = useState(true)
    const [templateTableCollapsed, setTemplateTableCollapsed] = useState(false)
    const importStartTimeRef = useRef(null)
    const [importEta, setImportEta] = useState(null)
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
            setRowConflictOverrides({})
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

    const mappingProgress = useMemo(() => {
        if (!SYSTEM_COLS || SYSTEM_COLS.length === 0) return { mapped: 0, total: 0 }
        const mapped = SYSTEM_COLS.filter(sys => importColumnMapping[sys.key]).length
        return { mapped, total: SYSTEM_COLS.length }
    }, [SYSTEM_COLS, importColumnMapping])

    const columnExampleValues = useMemo(() => {
        if (!importRawData || importRawData.length === 0 || !importFileHeaders || importFileHeaders.length === 0) return {}
        const headerIdx = Object.fromEntries(importFileHeaders.map((h, i) => [h, i]))
        const result = {}
        for (const sys of (SYSTEM_COLS || [])) {
            const fileHeader = importColumnMapping[sys.key]
            if (!fileHeader || headerIdx[fileHeader] === undefined) continue
            const colIdx = headerIdx[fileHeader]
            const values = []
            for (let r = 0; r < Math.min(importRawData.length, 20); r++) {
                const v = importRawData[r]?.[colIdx]
                if (v !== undefined && v !== null && String(v).trim() !== '' && !values.includes(String(v))) {
                    values.push(String(v))
                    if (values.length >= 3) break
                }
            }
            result[sys.key] = values
        }
        return result
    }, [importRawData, importFileHeaders, importColumnMapping, SYSTEM_COLS])

    const importSummary = useMemo(() => {
        const summary = {
            total: importReadyRows.length,
            willInsert: 0,
            willUpdate: 0,
            willSkip: 0,
        }
        importReadyRows.forEach(r => {
            const rowIdx = r.originalIdx ?? importPreview.indexOf(r)
            const override = rowConflictOverrides[rowIdx]
            const effectiveStrategy = override || importConflictStrategy
            if (r._isDupe) {
                if (effectiveStrategy === 'replace') summary.willUpdate++
                else summary.willSkip++
            } else {
                summary.willInsert++
            }
        })
        return summary
    }, [importReadyRows, importConflictStrategy, rowConflictOverrides, importPreview])

    const fileHeaderOptions = useMemo(() =>
        (importFileHeaders || []).map(h => ({ id: h, name: h }))
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

    const handleSetRowConflictOverride = useCallback((rowIdx, strategy) => {
        setRowConflictOverrides(prev => {
            const next = { ...prev }
            if (next[rowIdx] === strategy) {
                delete next[rowIdx]
            } else {
                next[rowIdx] = strategy
            }
            return next
        })
    }, [])

    const handleToggleFilterIssues = useCallback(() => setFilterIssuesOnly(v => !v), [])

    const handleToggleColMenu = useCallback((e) => {
        e.stopPropagation()
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
        const timer = setTimeout(() => document.addEventListener('pointerdown', handleClickOutside), 0)
        return () => { clearTimeout(timer); document.removeEventListener('pointerdown', handleClickOutside) }
    }, [colMenuOpen])

    const handleToggleColVisibility = useCallback((key) => {
        setVisibleCols(p => ({ ...p, [key]: !p[key] }))
    }, [])

    const handleCommitWithConfirmation = useCallback(() => {
        setShowConfirmDialog(true)
    }, [])

    const handleConfirmImport = useCallback(() => {
        setShowConfirmDialog(false)
        handleCommitImport()
    }, [handleCommitImport])

    const handleCancelImport = useCallback(() => {
        setShowConfirmDialog(false)
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

    const handleBatchSemester = useCallback((semester) => {
        if (selectedRows.size === 0) return
        selectedRows.forEach(idx => {
            handleImportCellEdit(idx, 'semester', semester)
        })
        setSelectedRows(new Set())
    }, [selectedRows, handleImportCellEdit])

    const handleExportFiltered = useCallback(() => {
        const dataToExport = selectedRows.size > 0
            ? displayPreview.filter(r => selectedRows.has(r.originalIdx))
            : displayPreview

        if (dataToExport.length === 0) return

        const headers = ['Tahun Pelajaran', 'Semester', 'Tanggal Mulai', 'Tanggal Selesai']
        const csvRows = [headers.join(',')]
        dataToExport.forEach(r => {
            csvRows.push([
                r.academic_year || '',
                r.semester || '',
                r.start_date || '',
                r.end_date || ''
            ].join(','))
        })

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `import_preview_${new Date().toISOString().slice(0, 10)}.csv`
        link.click()
        URL.revokeObjectURL(url)
    }, [displayPreview, selectedRows])

    const hasUnmappedRequired = useMemo(() => {
        if (!SYSTEM_COLS) return false
        return SYSTEM_COLS.some(sys => REQUIRED_COL_KEYS.includes(sys.key) && !importColumnMapping[sys.key])
    }, [SYSTEM_COLS, importColumnMapping])

    const getRowErrorMessage = useCallback((row) => {
        if (row._errorMessages && row._errorMessages.length > 0) {
            return row._errorMessages.join('. ')
        }
        if (row._isDupe) return 'Periode ini sudah ada di database'
        if (row._hasError) return 'Ada error pada data baris ini'
        if (row._hasWarn) return 'Ada peringatan pada data baris ini'
        return null
    }, [])

    useEffect(() => {
        if (!isOpen) return
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (showConfirmDialog) {
                    handleCancelImport()
                } else if (colMenuOpen) {
                    setColMenuOpen(false)
                } else {
                    onClose()
                }
            }
            if (e.key === 'Enter' && showConfirmDialog) {
                e.preventDefault()
                handleConfirmImport()
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, showConfirmDialog, colMenuOpen, onClose, handleCancelImport, handleConfirmImport])

    useEffect(() => {
        if (SYSTEM_COLS && SYSTEM_COLS.length > 0 && mappingOrder.length === 0) {
            setMappingOrder(SYSTEM_COLS.map(s => s.key))
        }
    }, [SYSTEM_COLS, mappingOrder.length])

    const orderedSystemCols = useMemo(() => {
        if (!SYSTEM_COLS || mappingOrder.length === 0) return SYSTEM_COLS || []
        const colMap = new Map(SYSTEM_COLS.map(s => [s.key, s]))
        return mappingOrder.filter(key => colMap.has(key)).map(key => colMap.get(key))
    }, [SYSTEM_COLS, mappingOrder])

    const handleMoveMapping = useCallback((fromKey, toKey) => {
        setMappingOrder(prev => {
            const arr = [...prev]
            const fromIdx = arr.indexOf(fromKey)
            const toIdx = arr.indexOf(toKey)
            if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev
            arr.splice(fromIdx, 1)
            arr.splice(toIdx, 0, fromKey)
            return arr
        })
    }, [])

    const focusNextRequiredRef = useRef(null)

    const focusNextRequired = useCallback((currentKey) => {
        if (!orderedSystemCols || orderedSystemCols.length === 0) return
        const requiredKeys = REQUIRED_COL_KEYS
        const currentIdx = orderedSystemCols.findIndex(s => s.key === currentKey)
        for (let offset = 1; offset < orderedSystemCols.length; offset++) {
            const nextIdx = (currentIdx + offset) % orderedSystemCols.length
            const nextKey = orderedSystemCols[nextIdx].key
            if (requiredKeys.includes(nextKey) && !importColumnMapping[nextKey]) {
                focusNextRequiredRef.current = nextKey
                setTimeout(() => { focusNextRequiredRef.current = null }, 100)
                return
            }
        }
    }, [orderedSystemCols, importColumnMapping])

    useEffect(() => {
        if (importing && importProgress.done === 0) {
            importStartTimeRef.current = Date.now()
            setImportEta(null)
        }
        if (importing && importProgress.done > 0 && importStartTimeRef.current) {
            const elapsed = (Date.now() - importStartTimeRef.current) / 1000
            const rate = importProgress.done / elapsed
            const remaining = (importProgress.total - importProgress.done) / Math.max(rate, 0.1)
            setImportEta(Math.round(remaining))
        }
        if (!importing) {
            importStartTimeRef.current = null
            setImportEta(null)
        }
    }, [importing, importProgress.done, importProgress.total])

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

    if (!isOpen) return null

    const importMappingContent = (<DragDropProvider>
        <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-1">
                {orderedSystemCols.map((sys, idx) => {
                    const mapped = importColumnMapping[sys.key]
                    const isRequired = REQUIRED_COL_KEYS.includes(sys.key)
                    const isUnmappedRequired = isRequired && !mapped
                    return (
                        <DraggableItem key={sys.key} id={sys.key} index={idx} onMove={handleMoveMapping}>
                            <div className={`p-2.5 rounded-xl border transition-all ${isUnmappedRequired ? 'bg-amber-500/4 border-amber-500/30 ring-1 ring-amber-500/20' : mapped ? 'bg-emerald-500/4 border-emerald-500/20' : 'bg-[var(--color-surface-alt)]/50 border-[var(--color-border)]'}`}>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="cursor-grab active:cursor-grabbing text-[var(--color-text-muted)] opacity-30 hover:opacity-60 transition-opacity" title="Drag untuk mengurutkan">
                                            <DotsSix className="w-3 h-3" />
                                        </div>
                                        <div className="flex flex-col w-[130px] shrink-0">
                                            <span className="text-[10px] font-black text-[var(--color-text)] flex items-center gap-1">
                                                {sys.label}
                                                {isRequired && <span className="text-red-500 text-[9px]">*</span>}
                                            </span>
                                            <span className="text-[8px] font-bold text-[var(--color-text-muted)] opacity-50 uppercase tracking-tight">Sistem</span>
                                        </div>
                                    </div>

                                    <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-all ${mapped ? 'bg-emerald-500/15' : isUnmappedRequired ? 'bg-amber-500/15' : ''}`}>
                                        <ArrowRight className={`w-3.5 h-3.5 transition-all ${mapped ? 'text-emerald-500' : isUnmappedRequired ? 'text-amber-500' : 'text-[var(--color-text-muted)] opacity-30'}`} />
                                    </div>

                                    <div className="flex-1 min-w-0 relative">
                                        <Select
                                            small
                                            value={mapped || ''}
                                            onChange={(val) => {
                                                setImportColumnMapping(v => ({ ...v, [sys.key]: val }))
                                                if (val && isRequired) focusNextRequired(sys.key)
                                            }}
                                            options={fileHeaderOptions}
                                            placeholder="-- Lewati Kolom --"
                                            extraOption={{ id: '', name: '-- Lewati Kolom --' }}
                                            status={mapped ? 'success' : isUnmappedRequired ? 'warning' : 'normal'}
                                            searchable={importFileHeaders.length > SEARCHABLE_THRESHOLD}
                                            autoFocus={focusNextRequiredRef.current === sys.key}
                                        />
                                    </div>
                                </div>
                                {mapped && columnExampleValues[sys.key]?.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-dashed border-emerald-500/20 flex items-center gap-2">
                                        <span className="text-[8px] font-black uppercase tracking-tight text-[var(--color-text-muted)]">Contoh:</span>
                                        <span className="text-[10px] font-bold text-[var(--color-text-muted)] font-mono">{columnExampleValues[sys.key].join(', ')}</span>
                                    </div>
                                )}
                            </div>
                        </DraggableItem>
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
                    {orderedSystemCols.map(sys => (
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
        </div>
    </DragDropProvider>)

    const successScreen = (
        <div className="flex flex-col items-center justify-center h-full py-16 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping"></div>
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/15"></div>
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.35)]">
                    <CheckCircle className="text-white w-8 h-8" weight="fill" />
                </div>
            </div>
            <div className="flex flex-col items-center gap-2">
                <span className="text-base font-black text-emerald-700">Import Berhasil</span>
                <span className="text-xs font-bold text-[var(--color-text-muted)]">{lastImportedIds.length} periode berhasil ditambahkan</span>
                <div className="mt-3 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200/60 text-center">
                    <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-[0.2em] animate-pulse whitespace-nowrap">Menutup otomatis 15 detik</span>
                </div>
            </div>
        </div>
    )

    const stepBody = (<>
        {importStep === 1 && (
            <div key={importStep} className="animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Dropzone */}
                <button
                    onClick={() => importFileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setImportDragOver(true) }}
                    onDragLeave={() => setImportDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setImportDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleProcessFile(f) }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left
                        ${importFileName
                            ? 'border-solid border-emerald-500/40 bg-emerald-500/5'
                            : importDragOver
                                ? 'border-dashed border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                                : 'border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-surface-alt)]'}`}
                >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${importFileName ? 'bg-emerald-500/10 text-emerald-600' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'}`}>
                        {importFileName ? <CheckCircle className="w-4 h-4" /> : <UploadSimple className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        {importFileName ? (
                            <>
                                <span className="text-[12px] font-bold text-[var(--color-text)] block">{importFileName}</span>
                                <span className="text-[10px] text-[var(--color-text-muted)]">klik untuk ganti file</span>
                            </>
                        ) : (
                            <>
                                <span className="text-[12px] font-bold text-[var(--color-text)]">Pilih atau tarik file Excel/CSV</span>
                                <span className="text-[10px] text-[var(--color-text-muted)] block">.xlsx atau .csv — Maks 5MB</span>
                            </>
                        )}
                    </div>
                </button>

                {fileSizeError && (
                    <div className="flex items-center gap-2 px-3 py-1.5 mt-2 rounded-xl bg-red-500/5 border border-red-500/20 text-red-600 text-[10px] font-bold">
                        <WarningCircle className="w-3 h-3 shrink-0" />
                        {fileSizeError}
                    </div>
                )}

                {/* Info row */}
                {importFileName && importFileHeaders.length > 0 && (
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                            <CheckCircle className="w-3 h-3" />
                            File terbaca
                        </span>
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] text-[10px] font-bold">
                            <span className="font-black text-[var(--color-text)]">{importFileHeaders.length}</span> kolom
                        </span>
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] text-[10px] font-bold">
                            <span className="font-black text-[var(--color-text)]">{importRawData.length}</span> baris data
                        </span>
                        {importDetectedDateFormat && importDetectedDateFormat !== 'YYYY-MM-DD' && (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-700 text-[9px] font-bold">
                                Format: {importDetectedDateFormat} — Konversi otomatis
                            </span>
                        )}
                    </div>
                )}

                {/* Template Table — collapsible */}
                <div className={`mt-4 rounded-xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)] ${templateTableCollapsed ? '' : ''}`}>
                    <button
                        type="button"
                        onClick={() => setTemplateTableCollapsed(v => !v)}
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-[var(--color-surface-alt)]/60 hover:bg-[var(--color-surface-alt)] transition-colors cursor-pointer"
                    >
                        <div className="flex items-center gap-2">
                            <CaretDown className={`w-3 h-3 text-[var(--color-text-muted)] transition-transform ${templateTableCollapsed ? '-rotate-90' : ''}`} />
                            <List className="w-3 h-3 text-[var(--color-primary)]" />
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Contoh Format Import</span>
                        </div>
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 text-[9px] font-extrabold uppercase tracking-wider">
                            <FileText className="w-2.5 h-2.5" />
                            Contoh Format
                        </span>
                    </button>

                    {!templateTableCollapsed && (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-[var(--color-surface)]">
                                            <th className="w-8 px-2 py-2 border-b border-r border-[var(--color-border)] text-center text-[10px] font-extrabold text-[var(--color-text-muted)]">#</th>
                                            {TEMPLATE_COLS.map((col, i) => (
                                                <th key={i} className="px-3 py-2 border-b border-r border-[var(--color-border)] text-left">
                                                    <span className="text-[10px] font-extrabold text-[var(--color-text)]">{col.n}</span>
                                                    {REQUIRED_COL_KEYS.includes(col.k) && <sup className="text-red-500 text-[9px] ml-0.5">*</sup>}
                                                    <span className="float-right text-[8px] font-bold text-[var(--color-text-muted)] opacity-40">{col.l}</span>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {SAMPLE_ROWS.map((row, rIdx) => (
                                            <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-[var(--color-surface-alt)]/30' : ''}>
                                                <td className="px-2 py-2 border-b border-r border-[var(--color-border)] text-center text-[10px] font-bold text-[var(--color-text-muted)]">{rIdx + 1}</td>
                                                {row.map((cell, cIdx) => (
                                                    <td key={cIdx} className="px-3 py-2 border-b border-r border-[var(--color-border)] text-[11px] font-medium text-[var(--color-text)]">{cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-4 py-2 border-t border-[var(--color-border)] flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--color-text-muted)]">
                                        <Check className="w-2.5 h-2.5 text-emerald-500" />
                                        Urutan kolom bebas
                                    </span>
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--color-text-muted)]">
                                        <Check className="w-2.5 h-2.5 text-emerald-500" />
                                        Duplikat otomatis terdeteksi
                                    </span>
                                </div>
                                <div className="flex gap-1">
                                    {ACCEPTED_EXTENSIONS.map(ext => (
                                        <span key={ext} className="text-[9px] font-extrabold text-[var(--color-primary)] bg-[var(--color-primary)]/5 px-1.5 py-0.5 rounded border border-[var(--color-primary)]/10">{ext}</span>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {importFileName && importFileHeaders.length > 0 && (
                    <p className="text-[10px] text-[var(--color-text-muted)] italic mt-2 ml-0.5">File sudah terbaca — tabel contoh di atas cuma referensi format, bukan data dari file kamu.</p>
                )}
            </div>
        )}

        {importStep === 2 && (
            <div key={importStep} className="animate-in fade-in slide-in-from-right-4 duration-300">
                {/* File Context */}
                <div className="flex items-center justify-between mb-5">
                    <button
                        onClick={() => handleGoToStep(1)}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        Ubah File
                    </button>
                    {importFileName && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-600 text-[10px] font-bold">
                            <FileText className="w-3 h-3" />
                            <span className="max-w-[180px] truncate">{importFileName}</span>
                            <button onClick={handleImportClick} className="ml-0.5 hover:text-violet-800 transition-colors" title="Ganti File">
                                <PencilSimple className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                </div>

                {importFileHeaders.length === 0 ? (
                    <div className="py-10 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-surface-alt)] flex items-center justify-center">
                            <FileText className="w-8 h-8 text-[var(--color-text-muted)] opacity-30" />
                        </div>
                        <p className="text-[12px] font-black text-[var(--color-text)] mb-1">Belum ada file yang diupload</p>
                        <p className="text-[10px] font-bold text-[var(--color-text-muted)] mb-4">Upload file Excel/CSV terlebih dahulu</p>
                        <button
                            onClick={() => handleGoToStep(1)}
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
                        >
                            <ArrowLeft className="w-3 h-3" />
                            Kembali ke Upload
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Section 1: Pemetaan Kolom */}
                        <div>
                            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center text-[10px] font-extrabold shrink-0">1</span>
                                    <span className="text-[13px] font-extrabold">Pemetaan Kolom</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {importDetectedDateFormat && (
                                        <span className="text-[9px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-700 px-2 py-1 rounded-full">
                                            Format Tanggal: {importDetectedDateFormat}
                                        </span>
                                    )}
                                    <span className={`flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-full ${mappingProgress.mapped === mappingProgress.total ? 'bg-emerald-500/10 text-emerald-600' : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]'}`}>
                                        {mappingProgress.mapped === mappingProgress.total && <Check className="w-2.5 h-2.5" />}
                                        {mappingProgress.mapped}/{mappingProgress.total} Kolom Cocok
                                    </span>
                                </div>
                            </div>
                            <p className="text-[11px] text-[var(--color-text-muted)] mb-3 ml-7">Cocokkan kolom di file kamu dengan field sistem. Contoh nilai dari file ditampilkan di bawah tiap kartu untuk membantu verifikasi.</p>

                            {hasUnmappedRequired && (
                                <div className="flex items-center gap-2 px-3 py-2 mb-3 ml-7 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                    <Warning className="w-3 h-3 text-amber-500 shrink-0" />
                                    <span className="text-[9px] font-bold text-amber-600">Semua kolom wajib (*) harus dipetakan sebelum melanjutkan</span>
                                </div>
                            )}

                            {importMappingContent}
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-[var(--color-border)]" />

                        {/* Section 2: Strategi Data Duplikat */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center text-[10px] font-extrabold shrink-0">2</span>
                                    <span className="text-[13px] font-extrabold">Strategi Data Duplikat</span>
                                </div>
                            </div>
                            <p className="text-[11px] text-[var(--color-text-muted)] mb-3 ml-7">Pilih perlakuan default kalau periode di file sudah ada di database. Bisa diubah lagi per-baris nanti di langkah Pratinjau.</p>

                            <div className="flex items-center gap-3 flex-wrap ml-7">
                                <div className="flex items-center rounded-xl bg-[var(--color-surface-alt)] p-0.5">
                                    {[
                                        { id: 'skip', label: 'Lewati Duplikat', icon: Copy },
                                        { id: 'replace', label: 'Timpa Data Lama', icon: ArrowClockwise },
                                        { id: 'keep', label: 'Biarkan Tetap Ada', icon: Check },
                                    ].map((strat) => (
                                        <button
                                            key={strat.id}
                                            onClick={() => setImportConflictStrategy(strat.id)}
                                            className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold rounded-lg transition-all
                                                ${importConflictStrategy === strat.id
                                                    ? 'bg-violet-500 text-white shadow-sm'
                                                    : 'text-[var(--color-text-muted)] hover:text-violet-600'}`}
                                        >
                                            <strat.icon className="w-3 h-3" />
                                            {strat.label}
                                        </button>
                                    ))}
                                </div>

                                {diffUpdates.length > 0 && (
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold bg-amber-500/10 text-amber-700 px-3 py-2 rounded-lg">
                                        <Warning className="w-3 h-3 shrink-0" />
                                        {diffUpdates.length} kemungkinan duplikat terdeteksi — detail lengkap di Pratinjau
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {importStep === 3 && (
            <div key={importStep} className="animate-in fade-in slide-in-from-right-4 duration-300">
                {importLoading ? (
                    <ReviewTableSkeleton />
                ) : (
                    <div className="space-y-4">
                        {/* Stats Row */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] text-[11px] font-extrabold">
                                    <FileText className="w-3 h-3 opacity-60" />
                                    {statValues.total} Total
                                </span>
                                <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-[11px] font-extrabold">
                                    <CheckCircle className="w-3 h-3" />
                                    {statValues.ready} Siap
                                </span>
                                <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-500/10 text-violet-600 text-[11px] font-extrabold">
                                    <Copy className="w-3 h-3" />
                                    {statValues.dupe} Duplikat
                                </span>
                                <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-600 text-[11px] font-extrabold">
                                    <WarningCircle className="w-3 h-3" />
                                    {statValues.error} Error
                                </span>
                            </div>
                            {importFileName && (
                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-600 text-[10px] font-bold">
                                    <FileText className="w-3 h-3" />
                                    <span className="max-w-[180px] truncate">{importFileName}</span>
                                </span>
                            )}
                        </div>

                        {/* Diff Preview Section */}
                        {diffUpdates.length > 0 && (
                            <div className="rounded-xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
                                <button
                                    type="button"
                                    onClick={() => setImportDiffOpen(v => !v)}
                                    className="w-full px-3 py-2 bg-[var(--color-surface-alt)]/60 border-b border-[var(--color-border)] flex items-center justify-between hover:bg-[var(--color-surface-alt)] transition-colors cursor-pointer"
                                >
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                                        <CaretDown className={`w-3 h-3 transition-transform ${importDiffOpen ? '' : '-rotate-90'}`} />
                                        <GitDiff className="w-3 h-3 text-amber-500" />
                                        Perubahan Data ({diffUpdates.length} baris akan ditimpa)
                                    </span>
                                    <span className="text-[9px] font-extrabold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">Update</span>
                                </button>
                                {importDiffOpen && (
                                    <div className="max-h-[180px] overflow-auto divide-y divide-[var(--color-border)]/50">
                                        {diffUpdates.map((diff, idx) => (
                                            <div key={idx} className="px-3 py-2.5 space-y-1.5 hover:bg-[var(--color-surface-alt)]/30 transition-colors">
                                                <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--color-text)]">
                                                    <span>{diff.academic_year}</span>
                                                    <span className="px-1.5 py-0.5 rounded bg-[var(--color-surface-alt)] text-[9px] font-extrabold text-[var(--color-text-muted)]">{diff.semester}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-[10px] font-bold pl-2">
                                                    <div className="flex-1 space-y-0.5">
                                                        <span className="text-[8px] font-extrabold uppercase tracking-wider text-red-500/60">Existing</span>
                                                        {diff.existing ? (
                                                            <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                                                                <span>{diff.existing.start_date}</span>
                                                                <ArrowFatRight className="w-2 h-2 opacity-40" />
                                                                <span>{diff.existing.end_date}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-red-500/40 italic">-- tidak ada --</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 space-y-0.5">
                                                        <span className="text-[8px] font-extrabold uppercase tracking-wider text-emerald-500/60">Incoming</span>
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
                            <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--color-text-muted)] opacity-40" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setVisibleCount(PAGE_SIZE) }}
                                placeholder="Cari tahun pelajaran atau semester..."
                                className="w-full h-8 pl-7 pr-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[11px] font-bold text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] placeholder:opacity-40 outline-none focus:border-[var(--color-primary)] transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => { setSearchQuery(''); setVisibleCount(PAGE_SIZE) }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--color-surface-alt)] flex items-center justify-center text-[7px] font-black text-[var(--color-text-muted)] hover:bg-[var(--color-border)] transition-all"
                                >
                                    X
                                </button>
                            )}
                        </div>

                        {/* Bulk action bar when rows selected */}
                        {selectedRows.size > 0 && (
                            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-red-500/5 border border-red-500/20 animate-in slide-in-from-top-2 fade-in">
                                <span className="text-[10px] font-black text-red-600">{selectedRows.size} baris terpilih</span>
                                <div className="w-px h-4 bg-red-500/20" />
                                <div className="flex items-center gap-1">
                                    <span className="text-[9px] font-bold text-[var(--color-text-muted)]">Set Semester:</span>
                                    <button
                                        onClick={() => handleBatchSemester('Ganjil')}
                                        className="h-6 px-2 rounded-lg bg-violet-500/10 text-violet-600 text-[9px] font-black hover:bg-violet-500 hover:text-white transition-all"
                                    >
                                        Ganjil
                                    </button>
                                    <button
                                        onClick={() => handleBatchSemester('Genap')}
                                        className="h-6 px-2 rounded-lg bg-violet-500/10 text-violet-600 text-[9px] font-black hover:bg-violet-500 hover:text-white transition-all"
                                    >
                                        Genap
                                    </button>
                                </div>
                                <div className="flex-1" />
                                <button
                                    onClick={handleExportFiltered}
                                    className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all"
                                >
                                    <Export className="w-3 h-3" />
                                    Export
                                </button>
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

                        {/* Review Table */}
                        <div className="rounded-xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
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
                                    getRowErrorMessage={getRowErrorMessage}
                                    rowConflictOverrides={rowConflictOverrides}
                                    onSetRowConflictOverride={handleSetRowConflictOverride}
                                    importConflictStrategy={importConflictStrategy}
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
                                    getRowErrorMessage={getRowErrorMessage}
                                    rowConflictOverrides={rowConflictOverrides}
                                    onSetRowConflictOverride={handleSetRowConflictOverride}
                                    importConflictStrategy={importConflictStrategy}
                                />
                            </div>
                            {displayPreview.length > visibleCount && (
                                <div className="px-4 py-2 border-t border-[var(--color-border)]">
                                    <button
                                        onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                                        className="w-full py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all"
                                    >
                                        Muat {Math.min(PAGE_SIZE, displayPreview.length - visibleCount)} baris lagi ({displayPreview.length - visibleCount} tersisa) <CaretDown className="w-2 h-2 inline-block ml-1" />
                                    </button>
                                </div>
                            )}
                            <div className="px-4 py-2 text-[10px] font-bold text-[var(--color-text-muted)] bg-[var(--color-surface-alt)]/60 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2">
                                <span>Menampilkan {visibleRows.length} dari {displayPreview.length} baris</span>
                                <span className="text-emerald-600 flex items-center gap-1 font-extrabold">
                                    <CheckCircle className="w-2.5 h-2.5" />
                                    {importReadyRows.length} baris siap diimport
                                </span>
                            </div>
                        </div>

                        {/* Validation Card */}
                        {importIssues.length > 0 && (
                            <div className="rounded-xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
                                <button
                                    type="button"
                                    onClick={() => setImportValidationOpen(v => !v)}
                                    className="w-full px-4 py-2.5 bg-[var(--color-surface-alt)]/60 border-b border-[var(--color-border)] flex items-center justify-between hover:bg-[var(--color-surface-alt)] transition-colors cursor-pointer"
                                >
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Catatan Validasi</span>
                                    <span className="text-[10px] font-bold text-[var(--color-text-muted)]">{importIssues.length} isu</span>
                                </button>
                                {importValidationOpen && (
                                    <div className="divide-y divide-[var(--color-border)]">
                                        {importIssues.map((issue, idx) => {
                                            const levelStyle = getIssueLevelStyle(issue.level)
                                            return (
                                                <div key={idx} className="flex items-start gap-3 px-4 py-2.5">
                                                    <span className={`mt-0.5 shrink-0 px-2 py-0.5 rounded text-[9px] font-extrabold ${levelStyle.pill}`}>
                                                        {issue.level === 'dupe' ? 'DUPLIKAT' : issue.level.toUpperCase()}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] font-extrabold text-[var(--color-text-muted)] mb-0.5">Baris {issue.row}</p>
                                                        {issue.messages.map((msg, mi) => (
                                                            <p key={mi} className="text-[11px] font-bold text-[var(--color-text)] leading-snug">{msg}</p>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Summary Card */}
                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Ringkasan Import</p>
                            <div className="flex items-center gap-5 flex-wrap">
                                <span className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-text-muted)]">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    {importSummary.willInsert} baris akan ditambahkan
                                </span>
                                {importSummary.willUpdate > 0 && (
                                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-text-muted)]">
                                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                                        {importSummary.willUpdate} baris akan ditimpa
                                    </span>
                                )}
                                {importSummary.willSkip > 0 && (
                                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-text-muted)]">
                                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                                        {importSummary.willSkip} baris dilewati
                                    </span>
                                )}
                                <span className="text-[11px] font-extrabold text-[var(--color-text)]">Total: {importSummary.total} baris</span>
                            </div>
                            <p className="mt-2 text-[9px] font-bold text-[var(--color-text-muted)] opacity-50">
                                Strategi: {importConflictStrategy === 'skip' ? 'Lewati duplikat' : importConflictStrategy === 'replace' ? 'Timpa data lama' : 'Biarkan tetap ada'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        )}</>)

    const importSteps = (<>
        <div className="flex items-center justify-center gap-2 mb-5">
            {STEPS.map((s) => (
                <React.Fragment key={s.step}>
                    <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black transition-all shadow-sm
                                ${importStep >= s.step ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] border border-[var(--color-border)] opacity-40'}`}>
                            {importStep > s.step ? <Check className="w-2.5 h-2.5" /> : s.step}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-wider leading-none ${importStep >= s.step ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)] opacity-50'}`}>{s.label}</span>
                    </div>
                    {s.step < 3 && <div className={`w-6 h-px rounded-full transition-all ${importStep > s.step ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)] opacity-30'}`} />}
                </React.Fragment>
            ))}
        </div>
        {stepBody}
    </>)

    const stepContent = lastImportedIds.length > 0 ? successScreen : importSteps

    return (
        <>
            <div className="grid gap-5 h-full w-full min-h-0" style={{ gridTemplateColumns: showSidebar ? '230px 1fr' : '1fr' }}>
                {showSidebar && (
                    <div className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] h-full overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-4 pb-5 custom-scrollbar">
                            <div className="flex flex-col gap-0">
                                {STEPS.map((s, idx) => {
                                    const isActive = importStep === s.step
                                    const isDone = s.step < importStep
                                    return (
                                        <div key={s.step} className="flex gap-3 relative" style={{ paddingBottom: idx < STEPS.length - 1 ? 22 : 0 }}>
                                            {idx < STEPS.length - 1 && (
                                                <div className={`absolute left-[13px] top-[28px] bottom-0 w-0.5 ${isDone ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`} />
                                            )}
                                            <div className={`w-[27px] h-[27px] rounded-full flex items-center justify-center text-[11.5px] font-extrabold shrink-0 z-10 transition-all ${isDone ? 'bg-[var(--color-primary)] text-white' : isActive ? 'bg-[var(--color-primary)] text-white shadow-[0_0_0_4px_var(--color-primary-soft,var(--color-primary)/10)]' : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]'}`}>
                                                {isDone ? <Check className="w-3 h-3" weight="bold" /> : s.step}
                                            </div>
                                            <div className="pt-0.5">
                                                <div className={`text-[13px] font-bold ${isActive || isDone ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>{s.label}</div>
                                                <div className={`text-[11px] mt-px ${isActive ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-muted)] opacity-60'}`}>
                                                    {s.step === 1 && 'Unggah file'}
                                                    {s.step === 2 && 'Atur mapping & konflik'}
                                                    {s.step === 3 && 'Preview & import'}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                                <div className="text-[10.5px] font-extrabold uppercase tracking-wide text-[var(--color-text-muted)] mb-2.5">Yang Perlu Disiapkan</div>
                                <div className="flex flex-col gap-2.5">
                                    <div className="flex items-start gap-2">
                                        <div className="w-[15px] h-[15px] rounded-[5px] bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-px">
                                            <Check className="w-2.5 h-2.5" weight="bold" />
                                        </div>
                                        <div className="text-[11.5px] text-[var(--color-text-muted)] leading-snug">
                                            Kolom wajib: <strong className="font-bold text-[var(--color-text)]">Tahun Pelajaran, Semester, Tanggal Mulai, Tanggal Selesai</strong>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-[15px] h-[15px] rounded-[5px] bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-px">
                                            <Check className="w-2.5 h-2.5" weight="bold" />
                                        </div>
                                        <div className="text-[11.5px] text-[var(--color-text-muted)] leading-snug">
                                            Format tanggal <strong className="font-bold text-[var(--color-text)]">YYYY-MM-DD</strong> (contoh: 2026-07-14)
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-[15px] h-[15px] rounded-[5px] bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-px">
                                            <Check className="w-2.5 h-2.5" weight="bold" />
                                        </div>
                                        <div className="text-[11.5px] text-[var(--color-text-muted)] leading-snug">
                                            Format file <strong className="font-bold text-[var(--color-text)]">.xlsx</strong> atau <strong className="font-bold text-[var(--color-text)]">.csv</strong>, maks <strong className="font-bold text-[var(--color-text)]">5MB</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex gap-2 bg-amber-500/10 rounded-[11px] p-3">
                                <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" weight="fill" />
                                <p className="text-[10.5px] text-amber-700 leading-relaxed m-0">
                                    Data belum tersimpan ke database sampai kamu menekan "Selesaikan Import".
                                </p>
                            </div>
                        </div>

                        <div className="sticky bottom-0 shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3.5">
                            <button
                                onClick={() => setShowSidebar(false)}
                                className="h-[38px] w-full flex items-center justify-center gap-1.5 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] text-[10px] font-bold hover:bg-[var(--color-surface-alt)] transition-all"
                            >
                                <List className="w-3 h-3" />
                                Sembunyikan
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden min-h-0">
                    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                        {lastImportedIds.length > 0 ? successScreen : stepBody}
                    </div>

                    <div className="flex items-center justify-between px-5 py-3.5 border-t border-[var(--color-border)] bg-[var(--color-surface-alt)]/30">
                        <div className="flex items-center gap-3">
                            {!showSidebar && (
                                <button
                                    onClick={() => setShowSidebar(true)}
                                    className="h-[38px] px-3 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] text-[10px] font-bold hover:bg-[var(--color-surface-alt)] transition-all flex items-center gap-1.5"
                                >
                                    <List className="w-3 h-3" />
                                    Panduan
                                </button>
                            )}
                            {importStep === 1 && (
                                <button
                                    onClick={handleDownloadTemplate}
                                    className="h-[38px] px-4 rounded-[10px] border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-[12.5px] font-bold hover:bg-emerald-500/20 transition-all flex items-center gap-2"
                                >
                                    <DownloadSimple className="w-3.5 h-3.5" />
                                    Template
                                </button>
                            )}
                            {importStep > 1 && !importing && (
                                <button
                                    onClick={() => handleGoToStep(v => v - 1)}
                                    className="h-[38px] px-4 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] text-[12.5px] font-bold hover:bg-[var(--color-surface-alt)] transition-all flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    Kembali
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {importStep === 1 ? (
                                <button
                                    onClick={() => (importRawData.length > 0 && importFileName) ? handleGoToStep(2) : importFileInputRef.current?.click()}
                                    className="h-[38px] px-5 rounded-[10px] bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[12.5px] font-bold shadow-md shadow-[var(--color-primary)]/20 transition-all flex items-center gap-2"
                                >
                                    {(importRawData.length > 0 && importFileName) ? (
                                        <>Lanjutkan <ArrowRight className="w-3.5 h-3.5" /></>
                                    ) : (
                                        <>Pilih File <UploadSimple className="w-3.5 h-3.5" /></>
                                    )}
                                </button>
                            ) : importStep === 2 ? (
                                <button
                                    onClick={handleReviewPreview}
                                    disabled={!isMappingComplete(importColumnMapping)}
                                    className="h-[38px] px-5 rounded-[10px] bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[12.5px] font-bold disabled:opacity-40 shadow-md shadow-[var(--color-primary)]/20 transition-all flex items-center gap-2"
                                >
                                    Review Data <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleCommitWithConfirmation}
                                    disabled={importing || hasImportBlockingErrors || importReadyRows.length === 0}
                                    className="h-[38px] px-5 rounded-[10px] bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[12.5px] font-bold disabled:opacity-40 shadow-md shadow-[var(--color-primary)]/20 transition-all flex items-center gap-2"
                                >
                                    {importing
                                        ? <><Spinner className="animate-spin w-3.5 h-3.5" /> Mengimport...</>
                                        : <><Check className="w-3.5 h-3.5" weight="bold" /> Selesaikan Import</>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showConfirmDialog && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCancelImport} />
                    <div className="relative bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-2xl max-w-sm w-full p-5 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <Warning className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-[var(--color-text)]">Konfirmasi Import</h3>
                                <p className="text-[9px] font-bold text-[var(--color-text-muted)]">Pastikan data sudah benar sebelum diimport</p>
                            </div>
                        </div>
                        <div className="mb-4 p-3 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)]">
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                    <span className="text-[var(--color-text-muted)]">Baris siap import</span>
                                    <span className="font-black text-[var(--color-text)]">{importSummary.total} baris</span>
                                </div>
                                {importSummary.willInsert > 0 && (
                                    <div className="flex items-center justify-between text-[10px] font-bold">
                                        <span className="text-emerald-600 flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            Ditambahkan
                                        </span>
                                        <span className="font-black text-emerald-600">{importSummary.willInsert}</span>
                                    </div>
                                )}
                                {importSummary.willUpdate > 0 && (
                                    <div className="flex items-center justify-between text-[10px] font-bold">
                                        <span className="text-amber-600 flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                            Ditimpa
                                        </span>
                                        <span className="font-black text-amber-600">{importSummary.willUpdate}</span>
                                    </div>
                                )}
                                {importSummary.willSkip > 0 && (
                                    <div className="flex items-center justify-between text-[10px] font-bold">
                                        <span className="text-slate-500 flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                            Dilewati
                                        </span>
                                        <span className="font-black text-slate-500">{importSummary.willSkip}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 justify-between">
                            <button
                                onClick={handleCancelImport}
                                className="h-9 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-surface-alt)] transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleConfirmImport}
                                className="h-9 px-4 rounded-xl bg-[var(--color-primary)] hover:brightness-110 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--color-primary)]/20 transition-all flex items-center gap-1.5"
                            >
                                <Check className="w-3 h-3" />
                                Ya, Import
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}
