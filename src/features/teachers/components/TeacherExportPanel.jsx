import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
    Warning, ArrowsLeftRight, ArrowsDownUp, Book, Calendar, IdentificationCard,
    CheckCircle, Question, FileXls, FileText, ChatCircle,
    SlidersHorizontal, Tag, User, Users, GenderIntersex,
    CaretLeft, ArrowLeft, ArrowRight, Check, List, Eye, EyeSlash, TextH,
} from '@phosphor-icons/react'



const STEPS = [
    { step: 1, label: 'Jangkauan' },
    { step: 2, label: 'Konfigurasi' },
    { step: 3, label: 'Ekspor' },
]

const COLUMN_DEFS = [
    { key: 'nama', label: 'Nama Lengkap', icon: User, exportKey: 'Nama' },
    { key: 'subject', label: 'Mata Pelajaran', icon: Book, exportKey: 'Mata Pelajaran' },
    { key: 'gender', label: 'Jenis Kelamin', icon: GenderIntersex, exportKey: 'Gender' },
    { key: 'phone', label: 'No. WhatsApp', icon: ChatCircle, exportKey: 'No. HP/WA' },
    { key: 'status', label: 'Status', icon: Question, exportKey: 'Status' },
    { key: 'type', label: 'Jenis Pegawai', icon: IdentificationCard, exportKey: 'Jenis Pegawai' },
    { key: 'join_date', label: 'Tgl Bergabung', icon: Calendar, exportKey: 'Tgl Bergabung' },
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

export default function TeacherExportPanel(props) {
    const {
        isOpen, onClose,
        teachers = [], selectedTeacherIds = [],
        exportScope, setExportScope,
        exportColumns, setExportColumns,
        exporting,
        handleExportCSV, handleExportExcel, handleExportPDF,
        getExportData,
    } = props

    const [step, setStep] = useState(1)
    const [fileName, setFileName] = useState(`Data Guru ${new Date().toISOString().slice(0, 10)}`)
    const [pdfOrientation, setPdfOrientation] = useState('landscape')
    const [includeHeader, setIncludeHeader] = useState(true)
    const [exportFormat, setExportFormat] = useState(null)
    const [exportPhase, setExportPhase] = useState(null)
    const [showSidebar, setShowSidebar] = useState(true)
    const [allColumnsVisible, setAllColumnsVisible] = useState(false)
    const [previewRows, setPreviewRows] = useState([])
    const [previewTotal, setPreviewTotal] = useState(0)
    const exportStartRef = useRef(0)

    const activePresetId = useMemo(() => {
        const sortedCols = [...exportColumns].sort().join(',')
        const active = PRESETS.find(preset => {
            const presetSorted = [...preset.cols].sort().join(',')
            return sortedCols === presetSorted
        })
        return active ? active.id : null
    }, [exportColumns])

    const scopeOptions = useMemo(() => [
        { val: 'filtered', label: 'Filter Aktif', desc: `${teachers.length} guru`, icon: SlidersHorizontal, disabled: false },
        { val: 'selected', label: 'Dipilih', desc: `${selectedTeacherIds.length} guru`, icon: CheckCircle, disabled: selectedTeacherIds.length === 0 },
        { val: 'all', label: 'Semua', desc: 'Tanpa filter', icon: Users, disabled: false },
    ], [teachers.length, selectedTeacherIds.length])

    const exportPreviewData = useMemo(() => ({ rows: previewRows, total: previewTotal }), [previewRows, previewTotal])

    useEffect(() => {
        if (!isOpen) return
        let cancelled = false
        Promise.resolve(getExportData())
            .then(rows => {
                if (cancelled) return
                setPreviewRows(rows.slice(0, 5))
                setPreviewTotal(rows.length)
            })
            .catch(() => {
                if (!cancelled) { setPreviewRows([]); setPreviewTotal(0) }
            })
        return () => { cancelled = true }
    }, [isOpen, getExportData])

    useEffect(() => {
        if (exportPhase === 'loading' && !exporting) {
            const elapsed = Date.now() - exportStartRef.current
            const remaining = Math.max(0, 2000 - elapsed)
            const timer = setTimeout(() => {
                setExportPhase('success')
            }, remaining)
            return () => clearTimeout(timer)
        }
    }, [exporting, exportPhase])

    const [prevOpen, setPrevOpen] = useState(isOpen)
    if (prevOpen !== isOpen) {
        setPrevOpen(isOpen)
        if (!isOpen) {
            setStep(1)
            setExportPhase(null)
            setExportFormat(null)
        }
    }

    useEffect(() => {
        if (!isOpen) return
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])

    const handleToggleColumn = useCallback((key) => {
        setExportColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
    }, [setExportColumns])

    const handlePresetClick = useCallback((cols) => setExportColumns(cols), [setExportColumns])

    const handleGoToStep = useCallback((stepOrFn) => {
        setStep(prev => {
            const next = typeof stepOrFn === 'function' ? stepOrFn(prev) : stepOrFn
            return Math.max(1, Math.min(3, next))
        })
    }, [])

    const handleExport = useCallback((format) => {
        const handlers = { csv: handleExportCSV, excel: handleExportExcel, pdf: handleExportPDF }
        const handler = handlers[format]
        if (!handler) return
        setExportFormat(format)
        setExportPhase('loading')
        exportStartRef.current = Date.now()
        const options = { includeHeader, orientation: pdfOrientation }
        handler(fileName, options)
    }, [handleExportCSV, handleExportExcel, handleExportPDF, includeHeader, pdfOrientation, fileName])

    if (!isOpen) return null

    const hasColumns = exportColumns.length > 0

    const step1Body = (
        <div className="space-y-4">
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-2">Jangkauan Data</p>
                <div className="grid grid-cols-3 gap-2">
                    {scopeOptions.map(({ val, label, desc, icon, disabled }) => {
                        const Icon = icon
                        return (
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
                        )
                    })}
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Kolom & Preset</p>
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
                    {COLUMN_DEFS.map(({ key, label, icon }) => {
                        const Icon = icon
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
        </div>
    )

    const step2Body = (
        <div className="space-y-4">
            <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Nama File</p>
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

            <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Preview Data</p>
                <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
                    <button
                        onClick={() => setAllColumnsVisible(v => !v)}
                        className="w-full px-4 py-2 flex items-center justify-between bg-[var(--color-surface-alt)] border-b border-[var(--color-border)] hover:bg-[var(--color-border)]/30 transition-colors"
                    >
                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] flex items-center gap-2">
                            {allColumnsVisible ? <EyeSlash className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            {allColumnsVisible ? 'Sembunyikan' : 'Lihat Preview'} ({exportPreviewData.total} baris)
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
                                                <th key={k} className="px-2 py-1.5 border-r border-b border-[var(--color-border)] text-[9px] font-black text-[var(--color-text-muted)] text-left truncate max-w-[100px]">{def?.label || k}</th>
                                            )
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {exportPreviewData.rows.length === 0 ? (
                                        <tr><td colSpan={exportColumns.length + 1} className="px-4 py-6 text-center text-[10px] font-bold text-[var(--color-text-muted)] opacity-50">Tidak ada data</td></tr>
                                    ) : exportPreviewData.rows.map((row, ri) => (
                                        <tr key={ri} className="hover:bg-[var(--color-surface-alt)]/30 transition-colors">
                                            <td className="px-2 py-1 border-r border-b border-[var(--color-border)] text-[8px] font-bold text-[var(--color-text-muted)] text-center">{ri + 1}</td>
                                            {exportColumns.map(k => {
                                                const def = COLUMN_DEFS.find(c => c.key === k)
                                                const val = row[def?.exportKey || k]
                                                return (
                                                    <td key={k} className="px-2 py-1 border-r border-b border-[var(--color-border)] text-[9px] font-medium text-[var(--color-text)] truncate max-w-[120px]" title={String(val ?? '')}>{String(val ?? '') || <span className="opacity-30 italic">—</span>}</td>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

    const step3Body = (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2.5">
                {EXPORT_FORMAT_CONFIG.map(({ label, icon, desc, color, iconColor, format }) => {
                    const Icon = icon
                    const isLoading = exporting && exportFormat === format
                    const isDone = exportPhase === 'success' && exportFormat === format
                    return (
                        <button
                            key={label}
                            onClick={() => handleExport(format)}
                            disabled={exporting || !hasColumns}
                            className={`relative group h-24 rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 ${isDone ? 'border-emerald-400 bg-emerald-50' : color}`}
                        >
                            {isLoading ? (
                                <Spinner className="w-6 h-6 text-[var(--color-primary)] animate-spin" />
                            ) : isDone ? (
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

            {!hasColumns && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-600 text-[10px] font-black uppercase tracking-tight animate-pulse">
                    <Warning className="w-4 h-4 shrink-0" />
                    Pilih minimal satu kolom di langkah sebelumnya
                </div>
            )}

            <div className="p-3 rounded-xl bg-[var(--color-surface-alt)]/50 border border-[var(--color-border)]">
                <div className="text-[10px] font-bold text-[var(--color-text-muted)]">
                    Ringkasan: <span className="font-black text-[var(--color-text)]">{exportPreviewData.total}</span> guru akan diekspor sebagai <span className="font-black text-[var(--color-text)]">{exportColumns.length}</span> kolom
                </div>
            </div>
        </div>
    )

    const stepBodies = { 1: step1Body, 2: step2Body, 3: step3Body }

    return (
        <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
            <div className="px-5 pt-5 pb-3 shrink-0">
                <div className="flex items-center gap-2 mb-3">
                    <button
                        onClick={onClose}
                        className="h-7 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-1 text-[10px] font-black text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-all shrink-0"
                        title="Kembali ke Data Guru"
                    >
                        <CaretLeft className="w-3.5 h-3.5" />
                        <span>Data Guru</span>
                    </button>
                </div>
                <div>
                    <h1 className="text-xl font-black font-heading tracking-tight text-[var(--color-text)] leading-tight">Export Data Guru</h1>
                    <p className="text-[var(--color-text-muted)] text-[10px] mt-0.5 font-medium">Cadangkan atau pindahkan data guru ke format CSV, Excel, atau PDF.</p>
                </div>
            </div>

            <div className="flex-1 min-h-0 px-5 pb-5">
                <div className="grid gap-5 h-full w-full min-h-0" style={{ gridTemplateColumns: showSidebar ? '230px 1fr' : '1fr' }}>
                    {showSidebar && (
                    <div className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] h-full overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-4 pb-5 custom-scrollbar">
                            <div className="flex flex-col gap-0">
                                {STEPS.map((s, idx) => {
                                    const isActive = step === s.step
                                    const isDone = s.step < step
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
                                                    {s.step === 1 && 'Pilih data & kolom'}
                                                    {s.step === 2 && 'Nama file & opsi'}
                                                    {s.step === 3 && 'Pilih format & unduh'}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                                <div className="text-[10.5px] font-extrabold uppercase tracking-wide text-[var(--color-text-muted)] mb-2.5">Format Tersedia</div>
                                <div className="flex flex-col gap-2.5">
                                    {[
                                        { fmt: 'CSV', desc: 'Universal, ringan' },
                                        { fmt: 'Excel', desc: '.xlsx, multi-sheet' },
                                        { fmt: 'PDF', desc: 'Siap cetak' },
                                    ].map(f => (
                                        <div key={f.fmt} className="flex items-start gap-2">
                                            <div className="w-[15px] h-[15px] rounded-[5px] bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-px">
                                                <Check className="w-2.5 h-2.5" weight="bold" />
                                            </div>
                                            <div className="text-[11.5px] text-[var(--color-text-muted)] leading-snug">
                                                <strong className="font-bold text-[var(--color-text)]">{f.fmt}</strong> — {f.desc}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3.5">
                            <button
                                onClick={() => setShowSidebar(false)}
                                className="h-[38px] w-full flex items-center justify-center gap-1.5 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] text-[10px] font-bold hover:bg-[var(--color-surface-alt)] transition-all"
                            >
                                <List className="w-3 h-3" /> Sembunyikan
                            </button>
                        </div>
                    </div>
                    )}

                    <div className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden min-h-0">
                        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                            {stepBodies[step]}
                        </div>

                        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[var(--color-border)] bg-[var(--color-surface-alt)]/30">
                            <div className="flex items-center gap-3">
                                {step > 1 && !exporting && (
                                    <button
                                        onClick={() => handleGoToStep(v => v - 1)}
                                        className="h-[38px] px-4 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] text-[12.5px] font-bold hover:bg-[var(--color-surface-alt)] transition-all flex items-center gap-2"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" /> Kembali
                                    </button>
                                )}
                                {!showSidebar && (
                                    <button
                                        onClick={() => setShowSidebar(true)}
                                        className="h-[38px] px-3 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] text-[10px] font-bold hover:bg-[var(--color-surface-alt)] transition-all flex items-center gap-1.5"
                                    >
                                        <List className="w-3 h-3" /> Panduan
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                {step < 3 && (
                                    <button
                                        onClick={() => handleGoToStep(v => v + 1)}
                                        className="h-[38px] px-5 rounded-[10px] bg-[var(--color-primary)] text-white text-[12.5px] font-bold hover:brightness-110 transition-all flex items-center gap-2 shadow-md shadow-[var(--color-primary)]/20"
                                    >
                                        Selanjutnya <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
