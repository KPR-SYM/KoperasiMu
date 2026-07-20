import { FileText, ArrowsLeftRight } from '@phosphor-icons/react'

/**
 * ImportFileInfo — file name badge + row count + "Ganti File" button.
 * Used in import modal headers.
 *
 * @param {string} fileName - uploaded file name
 * @param {number} rowCount - number of data rows
 * @param {function} onChangeFile - handler for "Ganti File" button
 */
export default function ImportFileInfo({ fileName, rowCount, onChangeFile, className = '' }) {
    return (
        <div className={`flex items-center gap-2 flex-wrap ${className}`}>
            {fileName && (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 shrink-0 shadow-sm">
                    <FileText className="w-3 h-3" />
                    <span className="text-[10.5px] font-black truncate max-w-[240px]">
                        {fileName}
                    </span>
                </div>
            )}
            {rowCount != null && (
                <div className="px-3.5 py-1.5 rounded-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-muted)] text-[10px] font-black shadow-sm shrink-0">
                    {rowCount} baris
                </div>
            )}
            {onChangeFile && (
                <button
                    type="button"
                    onClick={onChangeFile}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-red-500 hover:border-red-500/30 text-[10px] font-black uppercase tracking-wider transition-all shadow-sm group"
                >
                    <ArrowsLeftRight className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                    Ganti File
                </button>
            )}
        </div>
    )
}
