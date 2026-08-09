import React, { useState, useEffect, useRef, useCallback } from 'react'
import { WarningCircle, Warning, ArrowLeft, ArrowsLeftRight, ArrowRight, Check, CheckCircle, CaretDown, Copy, DownloadSimple, FileArrowDown, FileText, SlidersHorizontal, List, Spinner, Pen, Buildings, Trash, UploadSimple, Eye, EyeSlash } from '@phosphor-icons/react'
import { createPortal } from 'react-dom'
import { Breadcrumb, EmptyState, Dropzone, Select } from '@shared/components'

const STEPS = [
    { step: 1, label: 'Upload' },
    { step: 2, label: 'Atur' },
    { step: 3, label: 'Pratinjau' },
]

const PROGRAMS = ['Boarding', 'Reguler']
const LEVELS = ['7', '8', '9', '10', '11', '12']
const GENDER_TYPES = ['Putra', 'Putri']

const TEMPLATE_COLS = [
    { l: 'A', k: 'NAME', n: 'Nama Kelas', w: 'w-[18%]' },
    { l: 'B', k: 'GRADE', n: 'Tingkat', w: 'w-[12%]' },
    { l: 'C', k: 'PROGRAM', n: 'Program', w: 'w-[15%]' },
    { l: 'D', k: 'GENDER', n: 'Gender', w: 'w-[15%]' },
    { l: 'E', k: 'TEACHER', n: 'Wali Kelas', w: 'w-[20%]' },
    { l: 'F', k: 'YEAR', n: 'Tahun Ajaran', w: 'w-[20%]' },
]

const SAMPLE_ROWS = [
    ['10 MIPA 1', '10', 'Boarding', 'Putra', 'Ahmad, S.Pd', '2023/2024 Genap'],
    ['11 IPS 2', '11', 'Reguler', 'Putri', 'Siti, M.Pd', '2023/2024 Genap'],
]

const EditableCell = React.memo(({ rowIdx, colKey, value, importPreview, teachersList, periodsList, importEditCell, setImportEditCell, handleImportCellEdit }) => {
    const isEditing = importEditCell?.row === rowIdx && importEditCell?.col === colKey
    const [searchTerm, setSearchTerm] = useState('')
    const cellRef = useRef(null)
    const [coords, setCoords] = useState(null)

    React.useLayoutEffect(() => {
        if (isEditing && cellRef.current) {
            const rect = cellRef.current.getBoundingClientRect()
            setCoords({ anchorTop: rect.top, left: rect.left, width: rect.width })
        } else { setCoords(null) }
    }, [isEditing])

    const renderDropdown = (content) => {
        if (!coords) return null
        return createPortal(
            <div className="fixed z-[9999]" style={{ bottom: (window.innerHeight - coords.anchorTop) + 8, left: coords.left, minWidth: Math.max(coords.width, colKey === 'homeroom_teacher_id' ? 220 : 140) }}>
                <div className="flex flex-col bg-[var(--color-surface)] border border-[var(--color-primary)] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl border-t-[var(--color-primary)]">
                    {content}
                </div>
                <div className="fixed inset-0 -z-10 bg-black/0" onClick={() => setImportEditCell(null)} />
            </div>,
            document.body
        )
    }

    if (isEditing) {
        if (colKey === 'grade' || colKey === 'program' || colKey === 'gender_type') {
            const options = colKey === 'grade' ? LEVELS : colKey === 'program' ? PROGRAMS : GENDER_TYPES
            return (
                <div ref={cellRef} className="relative">
                    <div className="bg-[var(--color-primary)]/10 rounded-lg px-2 py-1 text-[var(--color-primary)] font-black text-center border border-[var(--color-primary)] shadow-sm">
                        {value || '-'}
                    </div>
                    {renderDropdown(
                        <div className="py-1">
                            {options.map(opt => (
                                <button key={opt} className="w-full px-4 py-2 text-left text-[10px] font-bold hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] transition-colors flex items-center justify-between" onClick={() => { handleImportCellEdit(rowIdx, colKey, opt); setImportEditCell(null) }}>
                                    <span>{opt}</span>
                                    {value === opt && <Check className="w-2 h-2" />}
                                </button>
                            ))}
                            <button className="w-full px-4 py-2 text-left text-[10px] font-bold text-red-500 hover:bg-red-500/10 transition-colors border-t border-[var(--color-border)] mt-1" onClick={() => { handleImportCellEdit(rowIdx, colKey, ''); setImportEditCell(null) }}>Kosongkan</button>
                        </div>
                    )}
                </div>
            )
        }
        if (colKey === 'homeroom_teacher_id' || colKey === 'year') {
            const list = colKey === 'homeroom_teacher_id' ? teachersList : periodsList
            const displayKey = colKey === 'homeroom_teacher_id' ? 'name' : 'label'
            const filtered = list.filter(item => item[displayKey].toLowerCase().includes(searchTerm.toLowerCase()))
            const currentDisplay = importPreview[rowIdx][colKey === 'homeroom_teacher_id' ? '_teacherRaw' : '_yearRaw']
            return (
                <div ref={cellRef} className="relative">
                    <div className="bg-[var(--color-primary)]/10 rounded-lg px-2 py-1 text-[var(--color-primary)] font-black border border-[var(--color-primary)] shadow-sm truncate max-w-[120px]">
                        {currentDisplay || 'Pilih...'}
                    </div>
                    {renderDropdown(
                        <>
                            <div className="p-2 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]/50">
                                <input autoFocus className="w-full bg-transparent text-[10px] font-bold outline-none placeholder:opacity-30" placeholder="Cari..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setImportEditCell(null); if (e.key === 'Enter' && filtered.length) { handleImportCellEdit(rowIdx, colKey, filtered[0].id); handleImportCellEdit(rowIdx, colKey === 'homeroom_teacher_id' ? '_teacherRaw' : '_yearRaw', filtered[0][displayKey]); setImportEditCell(null) } }} />
                            </div>
                            <div className="max-h-[160px] overflow-auto py-1 scrollbar-none">
                                {filtered.map(item => (
                                    <button key={item.id} className="w-full px-4 py-2 text-left text-[10px] font-bold hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] flex items-center justify-between" onClick={() => { handleImportCellEdit(rowIdx, colKey, item.id); handleImportCellEdit(rowIdx, colKey === 'homeroom_teacher_id' ? '_teacherRaw' : '_yearRaw', item[displayKey]); setImportEditCell(null) }}>
                                        <span className="truncate">{item[displayKey]}</span>
                                        {value === item.id && <Check className="w-2 h-2" />}
                                    </button>
                                ))}
                            </div>
                            <button className="w-full px-4 py-2 text-left text-[10px] font-bold text-red-500 hover:bg-red-500/10 transition-colors border-t border-[var(--color-border)]" onClick={() => { handleImportCellEdit(rowIdx, colKey, null); handleImportCellEdit(rowIdx, colKey === 'homeroom_teacher_id' ? '_teacherRaw' : '_yearRaw', ''); setImportEditCell(null) }}>Kosongkan</button>
                        </>
                    )}
                </div>
            )
        }
        return (
            <input autoFocus className="w-full bg-[var(--color-surface)] border-2 border-[var(--color-primary)] rounded-lg px-2 py-1 text-[10px] font-black outline-none shadow-lg transition-all" value={value || ''} onChange={(e) => handleImportCellEdit(rowIdx, colKey, e.target.value)} onBlur={() => setImportEditCell(null)} onKeyDown={(e) => e.key === 'Enter' && setImportEditCell(null)} />
        )
    }

    let displayValue = value || '-'
    if (colKey === 'homeroom_teacher_id') displayValue = importPreview[rowIdx]._teacherRaw || '-'
    if (colKey === 'year') displayValue = importPreview[rowIdx]._yearRaw || '-'

    const isCentered = ['grade', 'program', 'gender_type'].includes(colKey)
    const isEmpty = !displayValue || displayValue === '-'
    const req = colKey === 'name' || colKey === 'grade'

    return (
        <div className={`group cursor-pointer hover:bg-[var(--color-primary)]/5 px-1.5 py-0.5 -mx-1.5 rounded-md transition-all flex items-center ${isCentered ? 'justify-center' : 'justify-between'} gap-2 min-h-[20px] ${isEmpty && req ? 'text-red-500/40 italic font-normal bg-red-500/5' : isEmpty ? 'text-[var(--color-text-muted)] opacity-50' : ''}`} onClick={() => setImportEditCell({ row: rowIdx, col: colKey })}>
            <span className={isCentered ? '' : 'truncate'}>{displayValue}</span>
            <Pen className="w-2 h-2 opacity-0 group-hover:opacity-30 transition-opacity shrink-0" />
        </div>
    )
})

export default function ClassImportPanel(props) {
    const {
        isOpen, onClose, importing, importStep, setImportStep, importPreview,
        importFileName, importDragOver, setImportDragOver,
        processImportFile, teachersList, periodsList, handleDownloadTemplate,
        importFileHeaders, SYSTEM_COLS, importColumnMapping, setImportColumnMapping,
        importRawData, importLoading, setImportLoading, buildImportPreview,
        importIssues, importValidationOpen, setImportValidationOpen, importProgress,
        handleCommitImport, handleImportClick, hasImportBlockingErrors,
        importReadyRows, handleImportCellEdit, importEditCell, setImportEditCell,
        handleRemoveImportRow, importSkipDupes, setImportSkipDupes,
        importFileInputRef,
    } = props

    const [filterIssuesOnly, setFilterIssuesOnly] = useState(false)
    const [showTeachersDropdown, setShowTeachersDropdown] = useState(false)
    const teachersDropdownRef = useRef(null)
    const [showSidebar, setShowSidebar] = useState(true)

    const handleImportClickInternal = () => importFileInputRef?.current?.click()

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (teachersDropdownRef.current && !teachersDropdownRef.current.contains(e.target)) {
                setShowTeachersDropdown(false)
            }
        }
        if (showTeachersDropdown) document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showTeachersDropdown])

    useEffect(() => {
        if (!isOpen) return
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
            <div className="px-5 pt-5 pb-3 shrink-0">
                <div className="flex items-center gap-2 mb-3">
                    <button
                        onClick={onClose}
                        className="h-7 w-7 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-all shrink-0"
                        title="Kembali ke Data Kelas"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <Breadcrumb
                        items={[
                            { label: 'Master' },
                            { label: 'Data Kelas', onClick: onClose },
                            { label: 'Import' },
                        ]}
                    />
                </div>
                <div>
                    <h1 className="text-xl font-black font-heading tracking-tight text-[var(--color-text)] leading-tight">Import Data Kelas</h1>
                    <p className="text-[var(--color-text-muted)] text-[10px] mt-0.5 font-medium">Unggah file Excel/CSV, petakan kolom, lalu tinjau sebelum diimport.</p>
                </div>
            </div>

            <div className="flex-1 min-h-0 px-5 pb-5">
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
                                                    {s.step === 1 && 'Upload file Excel/CSV'}
                                                    {s.step === 2 && 'Petakan kolom file'}
                                                    {s.step === 3 && 'Tinjau & import'}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                                <div className="text-[10.5px] font-extrabold uppercase tracking-wide text-[var(--color-text-muted)] mb-2.5">Struktur Template</div>
                                <div className="flex flex-col gap-2.5">
                                    {TEMPLATE_COLS.map(c => (
                                        <div key={c.k} className="flex items-start gap-2">
                                            <div className="w-[15px] h-[15px] rounded-[5px] bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-px">
                                                <Check className="w-2.5 h-2.5" weight="bold" />
                                            </div>
                                            <div className="text-[11.5px] text-[var(--color-text-muted)] leading-snug">
                                                <strong className="font-bold text-[var(--color-text)]">{c.l}</strong> — {c.n}
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
                            {importFileName && (
                                <div className="flex items-center justify-between gap-4 mb-6 px-1 animate-in fade-in">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 shrink-0 shadow-sm"><FileText className="w-3 h-3" /><span className="text-[10.5px] font-black truncate max-w-[240px]">{importFileName}</span></div>
                                        {importPreview.length > 0 && <div className="px-3.5 py-1.5 rounded-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-muted)] text-[10px] font-black shadow-sm shrink-0">{importPreview.length} baris</div>}
                                    </div>
                                    <button onClick={handleImportClickInternal} className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-red-500 hover:border-red-500/30 text-[10px] font-black uppercase tracking-wider transition-all shadow-sm group"><ArrowsLeftRight className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" /> Ganti File</button>
                                </div>
                            )}

                            {importStep === 1 && (
                                <div className="space-y-2.5">
                                    <Dropzone
                                        onFileSelect={processImportFile}
                                        dragOver={importDragOver}
                                        setDragOver={setImportDragOver}
                                    />

                                    <div className="space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-[var(--color-surface-alt)]/50 rounded-2xl border border-[var(--color-border)] shadow-sm">
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600"><Buildings className="text-xs" /></div>
                                                    <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text)]">Data Referensi</span><span className="text-[8px] font-bold text-emerald-600">Wali Kelas</span></div>
                                                </div>
                                                <div className="relative" ref={teachersDropdownRef}>
                                                    <button onClick={() => setShowTeachersDropdown(!showTeachersDropdown)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 ${showTeachersDropdown ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:border-emerald-500/50 hover:bg-emerald-500/5'}`}>
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Daftar Guru Valid</span>
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg ${showTeachersDropdown ? 'bg-white/20' : 'bg-emerald-500/10 text-emerald-600'}`}>{teachersList.length}</span>
                                                        <CaretDown className={`w-2 h-2 transition-transform duration-300 ${showTeachersDropdown ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    {showTeachersDropdown && (
                                                        <div className="absolute top-full left-0 mt-2 w-[320px] bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-2xl z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                                                            <div className="p-3 border-b border-[var(--color-border)]/50"><span className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Daftar Nama Wali Kelas (Copy & Paste):</span></div>
                                                            <div className="p-2 max-h-[140px] overflow-y-auto custom-scrollbar">
                                                                <div className="flex flex-col gap-1.5">
                                                                    {teachersList.map(t => (
                                                                        <span key={t.id} className="px-2 py-1.5 rounded-lg bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[9px] font-bold text-[var(--color-text)] hover:border-emerald-500/30 transition-colors truncate">{t.name}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="p-3 bg-[var(--color-surface-alt)]/30 rounded-b-2xl border-t border-[var(--color-border)]/50"><p className="text-[8px] text-[var(--color-text-muted)] italic leading-tight">* Pastikan penulisan di Excel persis seperti di atas untuk pencocokan otomatis.</p></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <button onClick={handleDownloadTemplate} className="shrink-0 h-9 px-4 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"><DownloadSimple /> Download Template</button>
                                        </div>
                                        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-sm flex flex-col">
                                            <div className="px-4 py-2 bg-[var(--color-surface-alt)] border-b border-[var(--color-border)] flex items-center justify-between">
                                                <div className="flex items-center gap-2"><List className="text-emerald-600 w-3 h-3" /><span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">Visualisasi Struktur Kolom Excel</span></div>
                                                <div className="flex items-center gap-1.5"><span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span></span><span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Auto-Match Active</span></div>
                                            </div>
                                            <div className="overflow-auto bg-[var(--color-surface-alt)]/10">
                                                <table className="w-full border-collapse table-fixed">
                                                    <thead>
                                                        <tr className="bg-[var(--color-surface)]">
                                                            <th className="w-8 border-r border-b border-[var(--color-border)]"></th>
                                                            {TEMPLATE_COLS.map((col, i) => (
                                                                <th key={i} className={`px-2 py-1.5 border-r border-b border-[var(--color-border)] text-left ${col.w}`}>
                                                                    <div className="flex flex-col">
                                                                        <div className="flex items-center justify-between gap-1"><span className="text-[9px] font-black text-[var(--color-text)]">{col.l}</span><span className="text-[7.5px] font-bold text-emerald-600 opacity-80" title={col.n}>({col.k})</span></div>
                                                                        <div className="h-0.5 w-full bg-emerald-500/20 rounded-full mt-1"></div>
                                                                    </div>
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {SAMPLE_ROWS.map((row, rIdx) => (
                                                            <tr key={rIdx}>
                                                                <td className="bg-[var(--color-surface-alt)] border-r border-b border-[var(--color-border)] text-[8px] font-bold text-[var(--color-text-muted)] text-center py-1">{rIdx + 1}</td>
                                                                {row.map((cell, cIdx) => (
                                                                    <td key={cIdx} className="px-2 py-1 border-r border-b border-[var(--color-border)] bg-[var(--color-surface)]/40 overflow-hidden"><span className="text-[9px] font-medium text-[var(--color-text)] opacity-70 truncate block">{cell}</span></td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="px-4 py-1.5 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center justify-between"><p className="text-[8px] text-[var(--color-text-muted)] font-medium italic opacity-60">* Gunakan judul kolom yang mendekati nama di atas untuk pencocokan otomatis.</p></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {importStep === 2 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Cocokkan Kolom File</span>
                                        <span className="text-[9px] font-bold py-1 px-2 rounded-lg bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-muted)]">{importFileHeaders.length} kolom ditemukan</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
                                        {SYSTEM_COLS.map(sys => {
                                            const mapped = importColumnMapping[sys.key]
                                            return (
                                                <div key={sys.key} className={`p-2.5 rounded-xl border transition-all ${mapped ? 'bg-[var(--color-primary)]/5 border-[var(--color-primary)]/20' : 'bg-[var(--color-surface-alt)]/50 border-[var(--color-border)]'}`}>
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex flex-col w-[130px] shrink-0">
                                                            <span className="text-[10px] font-black text-[var(--color-text)] flex items-center gap-1">{sys.label}{['name', 'grade'].includes(sys.key) && <span className="text-red-500 text-[9px]">*</span>}</span>
                                                            <span className="text-[8px] font-bold text-[var(--color-text-muted)] opacity-50 uppercase tracking-tight">Sistem</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 opacity-30"><ArrowRight className={`w-2 h-2 ${mapped ? 'text-[var(--color-primary)] opacity-100' : ''}`} /></div>
                                                        <div className="flex-1 min-w-0 relative">
                                                            <Select small value={mapped || ''} onChange={(val) => setImportColumnMapping(v => ({ ...v, [sys.key]: val }))} options={importFileHeaders.map(h => ({ id: h, name: h }))} placeholder="-- Lewati --" extraOption={{ id: '', name: '-- Lewati --' }} status={mapped ? 'success' : 'normal'} searchable={importFileHeaders.length > 5} />
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
                                        <div className="flex items-center justify-center py-14 text-[var(--color-text-muted)] gap-2"><Spinner className="animate-spin" /><span className="text-[11px] font-bold">Memproses preview...</span></div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-[var(--color-surface-alt)]/50 border border-[var(--color-border)] shadow-sm">
                                                <div className="flex items-center gap-2 p-1 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]/50">
                                                    {[
                                                        { label: 'Total Baris', value: importPreview.length, color: 'text-[var(--color-text-muted)]', bg: 'bg-[var(--color-border)]/20', icon: FileText },
                                                        { label: 'Siap Import', value: importReadyRows.length, color: 'text-emerald-600', bg: 'bg-emerald-500/10', icon: CheckCircle },
                                                        { label: 'Duplikat', value: importPreview.filter(r => r._isDupe).length, color: 'text-blue-600', bg: 'bg-blue-500/10', icon: Copy },
                                                        { label: 'Ada Isu/Error', value: importPreview.filter(r => r._hasError).length, color: 'text-red-600', bg: 'bg-red-500/10', icon: WarningCircle },
                                                    ].map((stat, i) => (
                                                        <div key={i} className={`flex items-center gap-2 px-2 py-1 rounded-lg ${stat.bg} ${stat.color} transition-all`} title={stat.label}><stat.icon className="text-[10px] opacity-70" /><span className="text-[11px] font-black">{stat.value}</span></div>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setImportSkipDupes(!importSkipDupes)} className={`flex items-center gap-2 h-8 px-3 rounded-xl border text-[10px] font-black uppercase tracking-tight transition-all ${importSkipDupes ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-blue-500/40 hover:text-blue-600'}`}><Copy className="w-3 h-3" /><span className="hidden sm:inline">{importSkipDupes ? 'Lewati Duplikat' : 'Ikutkan Duplikat'}</span><span className="sm:hidden">{importSkipDupes ? 'Lewati' : 'Ikut'}</span></button>
                                                    <button onClick={() => setFilterIssuesOnly(!filterIssuesOnly)} className={`flex items-center gap-2 h-8 px-3 rounded-xl border text-[10px] font-black uppercase tracking-tight transition-all ${filterIssuesOnly ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/20' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-red-500/40 hover:text-red-500'}`}>{filterIssuesOnly ? <Check className="w-3 h-3" /> : <SlidersHorizontal className="w-3 h-3" />}<span>{filterIssuesOnly ? 'Hanya Isu' : 'Semua'}</span></button>
                                                </div>
                                            </div>
                                            <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)] shadow-sm">
                                                <div className="max-h-[40vh] overflow-auto scrollbar-none">
                                                    <table className="w-full border-collapse table-fixed min-w-[700px]">
                                                        <thead>
                                                            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]/30">
                                                                <th className="px-2 py-2 text-left text-[8px] font-black uppercase tracking-tighter text-[var(--color-text-muted)] w-[20%]">Nama Kelas</th>
                                                                <th className="px-2 py-2 text-center text-[8px] font-black uppercase tracking-tighter text-[var(--color-text-muted)] w-[8%]">Tingkat</th>
                                                                <th className="px-2 py-2 text-left text-[8px] font-black uppercase tracking-tighter text-[var(--color-text-muted)] w-[12%]">Program</th>
                                                                <th className="px-2 py-2 text-left text-[8px] font-black uppercase tracking-tighter text-[var(--color-text-muted)] w-[12%]">Gender</th>
                                                                <th className="px-2 py-2 text-left text-[8px] font-black uppercase tracking-tighter text-[var(--color-text-muted)] w-[22%]">Wali Kelas</th>
                                                                <th className="px-2 py-2 text-left text-[8px] font-black uppercase tracking-tighter text-[var(--color-text-muted)] w-[18%]">Tahun Ajaran</th>
                                                                <th className="px-2 py-2 text-center text-[8px] font-black uppercase tracking-tighter text-[var(--color-text-muted)] w-[8%]">Aksi</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {importPreview.map((r, originalIdx) => ({ ...r, originalIdx })).filter(r => !filterIssuesOnly || (r._hasError || r._isDupe || r._hasWarn)).slice(0, 300).map((r) => {
                                                                const i = r.originalIdx
                                                                const isError = r._hasError
                                                                const isDupe = r._isDupe
                                                                const isWarn = r._hasWarn
                                                                return (
                                                                    <tr key={i} className={`hover:bg-[var(--color-surface-alt)]/40 transition-colors border-b border-[var(--color-border)]/30 last:border-0 ${isError ? 'bg-red-500/5' : isDupe ? 'bg-blue-500/5' : ''}`}>
                                                                        <td className="px-2 py-0.5 font-bold text-[var(--color-text)] text-[10px] truncate"><EditableCell rowIdx={i} colKey="name" value={r.name} importPreview={importPreview} importEditCell={importEditCell} setImportEditCell={setImportEditCell} handleImportCellEdit={handleImportCellEdit} /></td>
                                                                        <td className="px-2 py-0.5 text-center text-[var(--color-text-muted)] font-bold text-[10px]"><EditableCell rowIdx={i} colKey="grade" value={r.grade} importPreview={importPreview} importEditCell={importEditCell} setImportEditCell={setImportEditCell} handleImportCellEdit={handleImportCellEdit} /></td>
                                                                        <td className="px-2 py-0.5 text-[var(--color-text-muted)] font-bold text-[10px]"><EditableCell rowIdx={i} colKey="program" value={r.program} importPreview={importPreview} importEditCell={importEditCell} setImportEditCell={setImportEditCell} handleImportCellEdit={handleImportCellEdit} /></td>
                                                                        <td className="px-2 py-0.5 text-[var(--color-text-muted)] font-bold text-[10px]"><EditableCell rowIdx={i} colKey="gender_type" value={r.gender_type} importPreview={importPreview} importEditCell={importEditCell} setImportEditCell={setImportEditCell} handleImportCellEdit={handleImportCellEdit} /></td>
                                                                        <td className="px-2 py-0.5 text-[var(--color-text-muted)] font-bold text-[10px] truncate"><EditableCell rowIdx={i} colKey="homeroom_teacher_id" value={r.homeroom_teacher_id} importPreview={importPreview} teachersList={teachersList} importEditCell={importEditCell} setImportEditCell={setImportEditCell} handleImportCellEdit={handleImportCellEdit} /></td>
                                                                        <td className="px-2 py-0.5 text-[var(--color-text-muted)] font-bold text-[10px] truncate"><EditableCell rowIdx={i} colKey="year" value={r.year} importPreview={importPreview} periodsList={periodsList} importEditCell={importEditCell} setImportEditCell={setImportEditCell} handleImportCellEdit={handleImportCellEdit} /></td>
                                                                        <td className="px-2 py-1">
                                                                            <div className="flex items-center justify-center gap-2">
                                                                                {isError ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 animate-pulse"><WarningCircle className="w-3 h-3" /></span> : isDupe ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/15 text-blue-600"><Copy className="w-3 h-3" /></span> : isWarn ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/15 text-amber-600"><Warning className="w-3 h-3" /></span> : <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600"><CheckCircle className="w-3 h-3" /></span>}
                                                                                <button onClick={() => handleRemoveImportRow(i)} className="w-5 h-5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center group/del" title="Hapus Baris"><Trash className="w-3 h-3 group-hover/del:scale-110 transition-transform" /></button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <div className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] bg-[var(--color-surface-alt)] border-t border-[var(--color-border)] flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <span>Menampilkan {Math.min(importPreview.filter(r => !filterIssuesOnly || (r._hasError || r._isDupe || r._hasWarn)).length, 300)} dari {importPreview.length} baris</span>
                                                        <div className="w-px h-3 bg-[var(--color-border)]" />
                                                        <span className="text-emerald-600 flex items-center gap-1.5"><CheckCircle className="w-2 h-2" /> {importReadyRows.length} baris siap diimport</span>
                                                    </div>
                                                    {filterIssuesOnly && <span className="text-red-500 animate-pulse">Filter "Hanya Isu" Aktif</span>}
                                                </div>
                                            </div>

                                            {importIssues.length > 0 && (
                                                <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface-alt)]/20">
                                                    <button type="button" onClick={() => setImportValidationOpen(v => !v)} className="w-full px-3 py-2 bg-[var(--color-surface-alt)] border-b border-[var(--color-border)] flex items-center justify-between hover:bg-[var(--color-border)]/30 transition-colors cursor-pointer">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] flex items-center gap-1.5"><CaretDown className={`w-2 h-2 transition-transform ${importValidationOpen ? '' : '-rotate-90'}`} /> Catatan Validasi</span>
                                                        <span className="text-[8px] font-bold text-[var(--color-text-muted)] opacity-50">{importIssues.length} isu</span>
                                                    </button>
                                                    {importValidationOpen && <div className="max-h-[140px] overflow-auto divide-y divide-[var(--color-border)]">
                                                        {importIssues.map((issue, idx) => {
                                                            const levelStyle = issue.level === 'error' ? { pill: 'bg-red-500/15 text-red-600', row: 'border-l-2 border-l-red-500 bg-red-500/5' } : issue.level === 'dupe' ? { pill: 'bg-blue-500/15 text-blue-600', row: 'border-l-2 border-l-blue-500 bg-blue-500/5' } : { pill: 'bg-amber-500/15 text-amber-600', row: 'border-l-2 border-l-amber-400 bg-amber-500/5' }
                                                            return (
                                                                <div key={idx} className={`flex items-start gap-3 px-3 py-2 ${levelStyle.row}`}>
                                                                    <span className={`mt-0.5 shrink-0 px-1.5 py-0.5 rounded text-[8px] font-black ${levelStyle.pill}`}>{issue.level === 'dupe' ? 'DUPLIKAT' : issue.level.toUpperCase()}</span>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[9px] font-black text-[var(--color-text-muted)] mb-0.5">Baris {issue.row}</p>
                                                                        {issue.messages.map((msg, mi) => <p key={mi} className="text-[10px] font-bold text-[var(--color-text)] leading-snug">{msg}</p>)}
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
                        </div>

                        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[var(--color-border)] bg-[var(--color-surface-alt)]/30">
                            <div className="flex items-center gap-3">
                                {importStep > 1 && !importing && (
                                    <button
                                        onClick={() => setImportStep(v => v - 1)}
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
                                {importStep === 1 && (
                                    <button onClick={() => (importRawData.length > 0 && importFileName) ? setImportStep(2) : handleImportClickInternal()} className="h-[38px] px-5 rounded-[10px] bg-[var(--color-primary)] text-white text-[12.5px] font-bold hover:brightness-110 transition-all flex items-center gap-2 shadow-md shadow-[var(--color-primary)]/20">
                                        {(importRawData.length > 0 && importFileName) ? <>Lanjutkan <ArrowRight className="w-3.5 h-3.5" /></> : <>Pilih File <UploadSimple /></>}
                                    </button>
                                )}
                                {importStep === 2 && (
                                    <button onClick={async () => { setImportStep(3); setImportLoading(true); await buildImportPreview(importRawData, importColumnMapping); setImportLoading(false) }} disabled={!importColumnMapping.name || !importColumnMapping.grade} className="h-[38px] px-5 rounded-[10px] bg-[var(--color-primary)] text-white text-[12.5px] font-bold hover:brightness-110 disabled:opacity-40 transition-all flex items-center gap-2 shadow-md shadow-[var(--color-primary)]/20">
                                        Review Data <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                {importStep === 3 && (
                                    <button onClick={handleCommitImport} disabled={importing || hasImportBlockingErrors || importReadyRows.length === 0} className="h-[38px] px-5 rounded-[10px] bg-[var(--color-primary)] text-white text-[12.5px] font-bold hover:brightness-110 disabled:opacity-40 transition-all flex items-center gap-2 shadow-md shadow-[var(--color-primary)]/20">
                                        {importing ? <><Spinner className="animate-spin" /> Mengimport...</> : <><Check /> Selesaikan Import</>}
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
