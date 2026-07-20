import React, { memo, useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, AlertTriangle, Trash2, Loader2, SlidersHorizontal, ChevronDown, ChevronUp, Minus, Maximize2, Search, X } from 'lucide-react'
import { Badge } from '@shared/components'
import { Select } from '@shared/components'
import EditableCell from './EditableCell'

const StepReview = memo(function StepReview({
    importPreview,
    importIssues,
    importDuplicates,
    importReadyRows,
    hasImportBlockingErrors,
    importSkipDupes,
    setImportSkipDupes,
    importValidationOpen,
    setImportValidationOpen,
    importProgress,
    importing,
    importEditCell,
    setImportEditCell,
    handleImportCellEdit,
    handleRemoveImportRow,
    handleBulkFix,
    handleCommitImport,
    config,
    wizard,
    displayedPreview,
    editableColumnTypes,
    columns,
    getDisplayValue,
    onClose,
    onBack,
}) {
    const [filterIssuesOnly, setFilterIssuesOnly] = useState(false)
    const [showColMenu, setShowColMenu] = useState(false)
    const colMenuRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (colMenuRef.current && !colMenuRef.current.contains(e.target)) setShowColMenu(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const totalRows = importPreview.length
    const errorRows = importIssues.filter(i => i.level === 'error').length
    const warnRows = importIssues.filter(i => i.level === 'warn').length
    const dupeRows = importDuplicates.length

    const toggleCol = (key) => {
        // Column visibility handled by parent
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-wrap gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <Badge variant="soft" color="slate">Total: {totalRows}</Badge>
                    <Badge variant="soft" color="emerald">Siap: {importReadyRows.length}</Badge>
                    {dupeRows > 0 && <Badge variant="soft" color="violet">Duplikat: {dupeRows}</Badge>}
                    {errorRows > 0 && <Badge variant="solid" color="rose">Error: {errorRows}</Badge>}
                    {warnRows > 0 && <Badge variant="soft" color="amber">Peringatan: {warnRows}</Badge>}
                </div>
                <div className="flex-1" />
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setImportSkipDupes(!importSkipDupes)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${importSkipDupes ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        <CheckCircle className="w-3.5 h-3.5" /> Lewati Duplikat
                    </button>
                    <button
                        onClick={() => setFilterIssuesOnly(!filterIssuesOnly)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filterIssuesOnly ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        <AlertTriangle className="w-3.5 h-3.5" /> Filter Error
                    </button>
                    <div className="relative" ref={colMenuRef}>
                        <button onClick={() => setShowColMenu(!showColMenu)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            <SlidersHorizontal className="w-3.5 h-3.5" /> Kolom
                        </button>
                        {showColMenu && (
                            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                                {columns?.map(c => (
                                    <label key={c.key} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">
                                        <input type="checkbox" checked={true} onChange={() => toggleCol(c.key)} className="rounded border-gray-300 text-blue-600" />
                                        <span>{c.label}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {config?.bulkFixConfig && dupeRows > 0 && (
                <div className="flex items-center gap-3 px-4 py-2 bg-violet-50 border-b border-violet-100">
                    <AlertCircle className="w-4 h-4 text-violet-600 flex-shrink-0" />
                    <span className="text-sm text-violet-700 flex-1">{config.bulkFixConfig.message || `${dupeRows} baris dengan kolom tidak valid`}</span>
                    <Select
                        value={''}
                        onChange={(v) => handleBulkFix?.(config.bulkFixConfig.field, v)}
                        options={config.bulkFixConfig.options || []}
                        labelKey={config.bulkFixConfig.labelKey || 'name'}
                        placeholder="Pilih nilai untuk semua..."
                        className="w-48"
                    />
                </div>
            )}

            <div className="flex-1 overflow-auto p-4">
                {importPreview.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-gray-400">Belum ada data preview</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="w-8 px-2 py-2 text-center text-gray-400">#</th>
                                    {columns?.map(c => !c.hidden && (
                                        <th key={c.key} className="px-3 py-2 text-left font-medium text-gray-500 border-b border-gray-100 dark:border-gray-700 whitespace-nowrap">
                                            {c.label}
                                        </th>
                                    ))}
                                    <th className="w-24 px-2 py-2 text-center font-medium text-gray-500 border-b border-gray-100 dark:border-gray-700">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedPreview.map((row, idx) => {
                                    const originalIdx = importPreview.indexOf(row)
                                    const issues = importIssues.filter(i => i.row === originalIdx + 2)
                                    const hasError = issues.some(i => i.level === 'error')
                                    const hasWarn = issues.some(i => i.level === 'warn')
                                    const isDupe = importDuplicates.includes(originalIdx)
                                    const isEditing = importEditCell?.row === originalIdx

                                    return (
                                        <tr key={originalIdx} className={`${hasError ? 'bg-red-50' : isDupe ? 'bg-violet-50' : hasWarn ? 'bg-amber-50' : ''} border-b border-gray-100 dark:border-gray-700/50 ${isEditing ? 'bg-blue-50' : ''}`}>
                                            <td className="px-2 py-2 text-center text-gray-400 text-xs">{originalIdx + 1}</td>
                                            {columns?.map(c => !c.hidden && (
                                                <EditableCell
                                                    key={c.key}
                                                    rowIdx={originalIdx}
                                                    colKey={c.key}
                                                    value={row[c.key]}
                                                    importPreview={importPreview}
                                                    config={{ editableColumnTypes, ...wizard }}
                                                    onEdit={(val) => handleImportCellEdit(originalIdx, c.key, val)}
                                                    onClose={() => setImportEditCell(null)}
                                                    isEditing={importEditCell?.row === originalIdx && importEditCell?.col === c.key}
                                                    getDisplayValue={getDisplayValue}
                                                />
                                            ))}
                                            <td className="px-2 py-1 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {hasError && <AlertCircle className="w-4 h-4 text-red-500" title={issues.find(i => i.level === 'error')?.messages?.join(', ')} />}
                                                    {hasWarn && !hasError && <AlertTriangle className="w-4 h-4 text-amber-500" title={issues.find(i => i.level === 'warn')?.messages?.join(', ')} />}
                                                    {isDupe && !hasError && <AlertCircle className="w-4 h-4 text-violet-500" title="Duplikat" />}
                                                    <button
                                                        onClick={() => handleRemoveImportRow(originalIdx)}
                                                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {importIssues.length > 0 && importValidationOpen && (
                <div className="border-t border-gray-100 p-4 bg-gray-50 dark:bg-gray-800/50 max-h-64 overflow-auto">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Isu Validasi</span>
                        <button onClick={() => setImportValidationOpen(false)} className="text-gray-400 hover:text-gray-600"><ChevronUp className="w-4 h-4" /></button>
                    </div>
                    <ul className="space-y-1 text-sm">
                        {importIssues.slice(0, 50).map((issue, idx) => (
                            <li key={idx} className="flex items-start gap-2 p-2 bg-white dark:bg-gray-800 rounded border">
                                <span className={`flex-shrink-0 w-4 h-4 mt-0.5 ${issue.level === 'error' ? 'text-red-500' : issue.level === 'dupe' ? 'text-violet-500' : 'text-amber-500'}`}>
                                    {issue.level === 'error' && <AlertCircle className="w-4 h-4" />}
                                    {issue.level === 'dupe' && <AlertTriangle className="w-4 h-4" />}
                                    {issue.level === 'warn' && <AlertTriangle className="w-4 h-4" />}
                                </span>
                                <span className="text-gray-600 dark:text-gray-400">Baris {issue.row}: {issue.messages?.join('; ')}</span>
                            </li>
                        ))}
                        {importIssues.length > 50 && <li className="text-gray-500 text-center py-2">... dan {importIssues.length - 50} isu lainnya</li>}
                    </ul>
                </div>
            )}

            <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 sticky bottom-0">
                <div className="flex items-center gap-3">
                    {importing && (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                            <span className="text-sm text-gray-600">Mengimport {importProgress.done} / {importProgress.total}</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onBack} disabled={importing} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                        <ChevronLeft className="w-4 h-4" /> Kembali
                    </button>
                    <button
                        onClick={handleCommitImport}
                        disabled={importing || hasImportBlockingErrors || importReadyRows.length === 0}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                    >
                        {importing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Mengimport...
                            </>
                        ) : (
                            <>
                                Import
                                <ChevronRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
})

StepReview.displayName = 'StepReview'

export default StepReview