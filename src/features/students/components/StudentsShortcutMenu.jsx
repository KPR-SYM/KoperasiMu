import React from 'react'
import { Keyboard } from '@phosphor-icons/react'

const SHORTCUTS = [
    { key: 'Ctrl+K', label: 'Fokus Pencarian' },
    { key: 'Ctrl+N', label: 'Tambah Siswa' },
    { key: 'Ctrl+E', label: 'Export' },
    { key: 'Ctrl+I', label: 'Import' },
    { key: 'Ctrl+A', label: 'Pilih Semua' },
    { key: 'Escape', label: 'Tutup Modal' },
]

const StudentsShortcutMenu = ({
    isOpen,
    rect,
    onClose,
}) => {
    if (!isOpen) return null

    return (
        <div
            className="fixed z-50 w-64 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl"
            style={{ top: rect?.bottom ? rect.bottom + 8 : 0, right: window.innerWidth - (rect?.right || 0) }}
        >
            <div className="px-3 py-2 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2 text-xs font-black text-[var(--color-text)]">
                    <Keyboard className="w-4 h-4 text-[var(--color-primary)]" />
                    Keyboard Shortcuts
                </div>
            </div>
            <div className="py-1">
                {SHORTCUTS.map(s => (
                    <div key={s.key} className="flex items-center justify-between px-3 py-1.5">
                        <span className="text-xs text-[var(--color-text-muted)]">{s.label}</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-alt)] text-[9px] font-mono font-bold text-[var(--color-text)]">{s.key}</kbd>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default StudentsShortcutMenu
