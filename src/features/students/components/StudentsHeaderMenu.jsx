import React from 'react'
import { Archive, DownloadSimple, UploadSimple } from '@phosphor-icons/react'

const StudentsHeaderMenu = ({
    isOpen,
    rect,
    mounted,
    canEdit,
    onClose,
    onImportClick,
    onExportClick,
    onArchivedClick,
}) => {
    if (!isOpen || !mounted) return null

    return (
        <div
            className="fixed z-50 w-56 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl"
            style={{ top: rect?.bottom ? rect.bottom + 8 : 0, right: window.innerWidth - (rect?.right || 0) }}
        >
            {canEdit && (
                <button onClick={() => { onImportClick?.(); onClose() }} className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2.5 hover:bg-[var(--color-surface-alt)] transition-colors">
                    <UploadSimple className="w-4 h-4" /> Import
                </button>
            )}
            <button onClick={() => { onExportClick?.(); onClose() }} className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2.5 hover:bg-[var(--color-surface-alt)] transition-colors">
                <DownloadSimple className="w-4 h-4" /> Export
            </button>
            <div className="my-1.5 border-t border-[var(--color-border)]" />
            <button onClick={() => { onArchivedClick?.(); onClose() }} className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2.5 hover:bg-[var(--color-surface-alt)] transition-colors">
                <Archive className="w-4 h-4" /> Arsip
            </button>
        </div>
    )
}

export default StudentsHeaderMenu
