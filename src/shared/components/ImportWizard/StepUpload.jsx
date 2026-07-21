import React, { memo, useState, useEffect, useRef } from 'react'
import { DownloadSimple, FileText, CaretDown, Spinner } from '@phosphor-icons/react'
import { Dropzone } from '@shared/components'
import Select from '@shared/components/Select'

const StepUpload = memo(function StepUpload({
    file,
    loading,
    dragOver,
    setDragOver,
    onFileSelect,
    onDownloadTemplate,
    referenceData,
    referenceLabel = 'Data Referensi',
    templateColumns,
    templateSampleRows,
}) {
    const [showRefDropdown, setShowRefDropdown] = useState(false)
    const dropdownRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowRefDropdown(false)
            }
        }
        if (showRefDropdown) document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showRefDropdown])

    return (
        <div className="space-y-4">
            <Dropzone
                variant="card"
                dragOver={dragOver}
                setDragOver={setDragOver}
                onFileSelect={onFileSelect}
                loading={loading}
                loadingText="Membaca file..."
                disabled={loading}
            />

            <div className="flex items-center gap-2 flex-wrap">
                <button
                    onClick={onDownloadTemplate}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                >
                    <DownloadSimple className="w-3.5 h-3.5" />
                    Download Template
                </button>
                {referenceData?.length > 0 && (
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowRefDropdown(!showRefDropdown)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            <FileText className="w-3.5 h-3.5" />
                            {referenceLabel}
                            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-gray-200 dark:bg-gray-600 rounded-full">
                                {referenceData.length}
                            </span>
                            <CaretDown className={`w-3.5 h-3.5 transition-transform ${showRefDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showRefDropdown && (
                            <div className="absolute top-full left-0 mt-1 w-64 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-2">
                                {referenceData.map((item, i) => (
                                    <div key={item.id || i} className="px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                        {item.name || item.label || String(item)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {templateColumns && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 uppercase tracking-wider">
                        Struktur File
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-[11px]">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/50">
                                    {templateColumns.map((col, i) => (
                                        <th key={i} className={`px-2 py-1.5 text-left font-medium text-gray-500 dark:text-gray-400 ${col.w || ''}`}>
                                            {col.l && <span className="text-gray-400 dark:text-gray-500 mr-1">{col.l}.</span>}
                                            {col.k || col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            {templateSampleRows && (
                                <tbody>
                                    {templateSampleRows.map((row, ri) => (
                                        <tr key={ri} className="border-t border-gray-100 dark:border-gray-700/50">
                                            {templateColumns.map((col, ci) => (
                                                <td key={ci} className={`px-2 py-1 text-gray-600 dark:text-gray-300 ${col.w || ''}`}>
                                                    {row[col.k || col.key] || row[col.label] || '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            )}
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
})

StepUpload.displayName = 'StepUpload'

export default StepUpload