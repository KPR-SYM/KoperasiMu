import { memo } from 'react'
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import Select from '@shared/components/Select'

function StepMapping({
    systemCols,
    importColumnMapping,
    setImportColumnMapping,
    importFileHeaders,
    importRawData,
    setImportStep,
    buildImportPreview,
}) {
    const requiredKeys = systemCols.filter(c => c.required).map(c => c.key)
    const allMapped = requiredKeys.every(k => importColumnMapping[k])
    const mappedCount = Object.keys(importColumnMapping).filter(k => importColumnMapping[k]).length

    const headerOptions = [
        { id: '', name: '-- Pilih Kolom --' },
        ...importFileHeaders.map(h => ({ id: h, name: h }))
    ]

    const handleMappingChange = (sysKey, headerValue) => {
        setImportColumnMapping(prev => ({ ...prev, [sysKey]: headerValue }))
    }

    const handleProceed = () => {
        buildImportPreview(importColumnMapping)
        setImportStep(3)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {mappedCount} dari {systemCols.length} kolom terpetakan
                    {requiredKeys.length > 0 && (
                        <span className="ml-1 text-amber-600 dark:text-amber-400">
                            ({requiredKeys.filter(k => !importColumnMapping[k]).length} wajib belum terpetak)
                        </span>
                    )}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {systemCols.map(col => {
                    const isRequired = col.required
                    const isMapped = !!importColumnMapping[col.key]
                    return (
                        <div key={col.key} className={`flex flex-col gap-1 p-2 rounded-lg border transition-colors ${
                            isRequired && !isMapped
                                ? 'border-amber-300 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-900/10'
                                : isMapped
                                    ? 'border-emerald-200 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-900/10'
                                    : 'border-gray-200 dark:border-gray-700'
                        }`}>
                            <label className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                                {col.label}
                                {isRequired && <span className="text-red-500 ml-0.5">*</span>}
                            </label>
                            <Select
                                value={importColumnMapping[col.key] || ''}
                                onChange={(val) => handleMappingChange(col.key, val)}
                                options={headerOptions}
                                size="sm"
                                placeholder="Pilih kolom..."
                            />
                        </div>
                    )
                })}
            </div>

            {importRawData.length > 0 && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 uppercase tracking-wider">
                        Preview Data (3 baris pertama)
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-[11px]">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/50">
                                    {importFileHeaders.slice(0, 8).map((h, i) => (
                                        <th key={i} className="px-2 py-1.5 text-left font-medium text-gray-500 dark:text-gray-400 max-w-[120px] truncate">
                                            {h}
                                        </th>
                                    ))}
                                    {importFileHeaders.length > 8 && (
                                        <th className="px-2 py-1.5 text-gray-400">+{importFileHeaders.length - 8}</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {importRawData.slice(0, 3).map((row, ri) => (
                                    <tr key={ri} className="border-t border-gray-100 dark:border-gray-700/50">
                                        {importFileHeaders.slice(0, 8).map((h, ci) => (
                                            <td key={ci} className="px-2 py-1 text-gray-600 dark:text-gray-300 max-w-[120px] truncate">
                                                {String(row[h] ?? '').slice(0, 30) || '-'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="flex justify-between pt-2">
                <button
                    onClick={() => setImportStep(1)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Kembali
                </button>
                <button
                    onClick={handleProceed}
                    disabled={!allMapped}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Review Data
                    <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    )
}

export default memo(StepMapping)
