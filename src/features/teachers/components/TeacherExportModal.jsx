import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Warning, ArrowsLeftRight, ArrowsDownUp, Book, Calendar, IdentificationCard, CheckCircle, FileXls, FileText, SlidersHorizontal, Tag, User, Users, GenderIntersex, FileArrowUp, TextH } from '@phosphor-icons/react'

import { Modal } from '@shared/components'

const COLUMN_DEFS = [
    { key: 'nama', label: 'Nama Lengkap', icon: User },
    { key: 'subject', label: 'Mata Pelajaran', icon: Book },
    { key: 'gender', label: 'Jenis Kelamin', icon: GenderIntersex },
    { key: 'phone', label: 'No. WhatsApp', icon: IdentificationCard },
    { key: 'status', label: 'Status', icon: CheckCircle },
    { key: 'type', label: 'Jenis Pegawai', icon: IdentificationCard },
    { key: 'join_date', label: 'Tgl Bergabung', icon: Calendar },
]

const PRESETS = [
    { id: 'all', label: 'Data Lengkap', cols: COLUMN_DEFS.map(c => c.key) },
    { id: 'contact', label: 'Kontak', cols: ['nama', 'phone'] },
    { id: 'employment', label: 'Kepegawaian', cols: ['nama', 'status', 'type', 'join_date'] },
]

const ALL_COLUMN_KEYS = COLUMN_DEFS.map(c => c.key)
const DEFAULT_COLUMNS = ['nama', 'subject', 'gender', 'phone', 'status', 'join_date']

const HEADER_OPTIONS = [
    { v: true, l: 'Ya' },
    { v: false, l: 'Tidak' },
]

const ORIENTATION_OPTIONS = [
    { v: 'landscape', l: 'Landscape', icon: ArrowsLeftRight },
    { v: 'portrait', l: 'Portrait', icon: ArrowsDownUp },
]

const EXPORT_FORMAT_CONFIG = [
    { label: 'CSV', icon: FileXls, desc: 'Universal', color: 'hover:border-slate-400 hover:bg-slate-50', iconColor: 'text-slate-500', format: 'csv' },
    { label: 'Excel', icon: FileXls, desc: '.xlsx', color: 'hover:border-emerald-400 hover:bg-emerald-50', iconColor: 'text-emerald-500', format: 'excel' },
    { label: 'PDF', icon: FileText, desc: 'Cetak', color: 'hover:border-rose-400 hover:bg-rose-50', iconColor: 'text-rose-500', format: 'pdf' },
]

export default function TeacherExportModal(props) {
    const {
        isOpen, onClose,
        teachers = [],
        selectedTeacherIds = [],
        exportScope, setExportScope,
        exportColumns, setExportColumns,
        exporting,
        handleExportCSV, handleExportExcel, handleExportPDF,
        getExportData,
    } = props

    const [fileName, setFileName] = useState(`Data Guru ${new Date().toISOString().slice(0, 10)}`)
    const [pdfOrientation, setPdfOrientation] = useState('landscape')
    const [includeHeader, setIncludeHeader] = useState(true)
    const [exportFormat, setExportFormat] = useState(null)
    const [exportPhase, setExportPhase] = useState(null)
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
            const elapsed = Date.now() - exportStartRef.current
            const remaining = Math.max(0, 2000 - elapsed)
            const timer = setTimeout(() => setExportPhase('success'), remaining)
            return () => clearTimeout(timer)
        }
    }, [exporting, exportPhase])

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
    }, [setExportColumns])

    const handlePresetClick = useCallback((cols) => setExportColumns(cols), [setExportColumns])

    const scopeOptions = useMemo(() => [
        { val: 'filtered', label: 'Filter Aktif', desc: `${teachers.length} guru`, icon: SlidersHorizontal, disabled: false },
        { val: 'selected', label: 'Dipilih', desc: `${selectedTeacherIds.length} guru`, icon: CheckCircle, disabled: selectedTeacherIds.length === 0 },
        { val: 'all', label: 'Semua', desc: 'Tanpa filter', icon: Users, disabled: false },
    ], [teachers.length, selectedTeacherIds.length])

    const exportPreviewData = useMemo(() => {
        try {
            const allRows = getExportData()
            return { rows: allRows.slice(0, 5), total: allRows.length }
        } catch { return { rows: [], total: 0 } }
    }, [getExportData])

    const exportOptions = useMemo(() => ({
        includeHeader,
        orientation: pdfOrientation,
    }), [includeHeader, pdfOrientation])

    const handleExport = useCallback((format) => {
        const handlers = { csv: handleExportCSV, excel: handleExportExcel, pdf: handleExportPDF }
        const handler = handlers[format]
        if (!handler) return
        setExportFormat(format)
        setExportPhase('loading')
        exportStartRef.current = Date.now()
        handler(fileName, exportOptions)
    }, [handleExportCSV, handleExportExcel, handleExportPDF, fileName, exportOptions])

    if (!isOpen) return null

    const hasColumns = exportColumns.length > 0

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Export Data Guru"
            description="Cadangkan atau pindahkan data guru ke format CSV, Excel, atau PDF."
            icon={FileArrowUp}
            iconBg="bg-amber-500/10"
            iconColor="text-amber-600"
            size="lg"
            mobileVariant="bottom-sheet"
            contentClassName={exporting ? "relative !overflow-hidden" : "relative"}
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
                {exporting && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-surface)]/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-surface-alt)]/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] border border-[var(--color-border)]/60 rounded-3xl p-8 flex flex-col items-center gap-5 scale-110 animate-in zoom-in-95 duration-300">
                            <div className="relative w-16 h-16">
                                <div className="absolute inset-0 rounded-full bg-[var(--color-primary)]/10 animate-ping opacity-75"></div>
                                <div className="absolute inset-0 rounded-full border-2 border-[var(--color-primary)]/10"></div>
                                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--color-primary)] border-r-[var(--color-primary)] animate-spin" style={{ filter: 'drop-shadow(0 0 4px var(--color-primary))' }}></div>
                                <div className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)]/60 flex items-center justify-center shadow-sm z-10">
                                    <FileArrowUp className="text-[var(--color-primary)] w-4 h-4 animate-pulse" />
                                </div>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--color-primary)]">Mengolah Data</span>
                                <span className="text-[8px] font-extrabold text-[var(--color-text-muted)] uppercase tracking-widest mt-1.5 flex items-center gap-1">
                                    Proses ekspor berjalan
                                    <span className="inline-flex gap-0.5 items-center">
                                        <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <div className={`space-y-6 pb-2 transition-all duration-500 ${exporting ? 'blur-sm grayscale-[0.5] opacity-50 pointer-events-none' : ''}`}>
                    {/* 1 — Jangkauan Data */}
                    <div className="space-y-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-70">1 — Jangkauan Data</p>
                        <div className="grid grid-cols-3 gap-2.5">
                            {scopeOptions.map(({ val, label, desc, icon: Icon, disabled }) => (
                                <button
                                    key={val}
                                    onClick={() => !disabled && setExportScope(val)}
                                    disabled={disabled}
                                    className={`group p-3 rounded-2xl border-2 text-left transition-all
                                        ${exportScope === val ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-surface-alt)]'}
                                        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
                                    `}
                                >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 transition-all ${exportScope === val ? 'bg-[var(--color-primary)] text-white shadow-lg' : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] group-hover:bg-[var(--color-primary)]/10'}`}>
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
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-70">2 — Kolom & Presets</p>
                            <div className="flex gap-2">
                                <button onClick={() => handlePresetClick(ALL_COLUMN_KEYS)} className="text-[9px] font-black text-[var(--color-primary)] hover:underline uppercase tracking-widest bg-[var(--color-primary)]/5 px-2 py-1 rounded-lg transition-colors">Semua</button>
                                <button onClick={() => handlePresetClick(DEFAULT_COLUMNS)} className="text-[9px] font-black text-rose-500 hover:underline uppercase tracking-widest bg-rose-500/5 px-2 py-1 rounded-lg transition-colors">Reset</button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 p-3 bg-[var(--color-surface-alt)]/40 rounded-2xl border border-[var(--color-border)]/50">
                            <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-wider text-[var(--color-text-muted)] opacity-60">
                                <Tag className="w-3 h-3" />
                                <span>Pilih Paket Kolom</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {PRESETS.map(preset => (
                                    <button
                                        key={preset.id}
                                        onClick={() => handlePresetClick(preset.cols)}
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

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {COLUMN_DEFS.map(({ key, label, icon: Icon }) => {
                                const isSelected = exportColumns.includes(key)
                                return (
                                    <button
                                        key={key}
                                        onClick={() => handleToggleColumn(key)}
                                        className={`group relative flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left transition-all
                                            ${isSelected ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-surface-alt)]'}
                                        `}
                                    >
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)]'}`}>
                                            <Icon className="w-3 h-3" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-tight truncate flex-1">{label}</span>
                                        {isSelected && (
                                            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[var(--color-primary)] text-white text-[8px] font-black flex items-center justify-center shadow-md border border-white">
                                                {exportColumns.indexOf(key) + 1}
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* 3 — Konfigurasi File */}
                    <div className="space-y-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-70">3 — Konfigurasi File</p>
                        <div className="relative">
                            <input
                                type="text"
                                value={fileName}
                                onChange={(e) => setFileName(e.target.value)}
                                placeholder="Nama file export..."
                                className="w-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-xs font-bold focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/20 transition-all placeholder:opacity-50 pr-20"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-[var(--color-border)] text-[8px] font-black uppercase text-[var(--color-text-muted)]">Multi Format</div>
                        </div>

                        <div className="p-4 rounded-2xl bg-[var(--color-surface-alt)]/60 border border-[var(--color-border)]">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                                        <TextH /> Header
                                    </label>
                                    <div className="flex gap-1 bg-[var(--color-surface)] p-1 rounded-lg border border-[var(--color-border)]">
                                        {HEADER_OPTIONS.map(opt => (
                                            <button
                                                key={String(opt.v)}
                                                onClick={() => setIncludeHeader(opt.v)}
                                                className={`flex-1 py-1 rounded-md text-[9px] font-black uppercase transition-all ${includeHeader === opt.v ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]'}`}
                                            >
                                                {opt.l}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                                        <ArrowsLeftRight /> Orientasi PDF
                                    </label>
                                    <div className="flex gap-1 bg-[var(--color-surface)] p-1 rounded-lg border border-[var(--color-border)]">
                                        {ORIENTATION_OPTIONS.map(opt => (
                                            <button
                                                key={opt.v}
                                                onClick={() => setPdfOrientation(opt.v)}
                                                className={`flex-1 py-1 rounded-md text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${pdfOrientation === opt.v ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]'}`}
                                            >
                                                <opt.icon className="text-[8px]" />
                                                {opt.l}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4 — Mulai Ekspor */}
                    <div className="space-y-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-70">4 — Mulai Ekspor</p>
                        <div className="grid grid-cols-3 gap-2.5">
                            {EXPORT_FORMAT_CONFIG.map(({ label, icon: Icon, desc, color, iconColor, format }) => {
                                const isLoading = exporting && exportFormat === format
                                const isDone = exportPhase === 'success' && exportFormat === format
                                return (
                                    <button
                                        key={label}
                                        onClick={() => handleExport(format)}
                                        disabled={exporting || !hasColumns}
                                        className={`relative group h-24 rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 ${isDone ? 'border-emerald-400 bg-emerald-50' : color}`}
                                    >
                                        {isDone ? (
                                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center mb-1">
                                                <CheckCircle className="text-white text-xl" weight="fill" />
                                            </div>
                                        ) : (
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-transform group-hover:scale-110 ${iconColor} bg-[var(--color-surface-alt)]`}>
                                                <Icon className="text-xl" />
                                            </div>
                                        )}
                                        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
                                        <span className="text-[8px] font-bold opacity-60 uppercase">{desc}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {!hasColumns && (
                        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-600 text-[10px] font-black uppercase tracking-tight animate-pulse">
                            <Warning className="w-4 h-4 shrink-0" />
                            Pilih minimal satu kolom di langkah sebelumnya
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    )
}
