import React, { memo } from 'react'
import { WarningCircle, Warning, Archive } from '@phosphor-icons/react'

import { ConfirmDialog } from '@shared/components'

export const ArchiveModal = memo(function ArchiveModal({
    isOpen,
    onClose,
    selectedItem,
    onConfirm,
    submitting
}) {
    if (!selectedItem) return null

    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title="Konfirmasi Arsip"
            description="Tahun akademik ini akan diarsipkan."
            icon={Archive}
            iconBg="bg-amber-500/10"
            iconColor="text-amber-600"
            confirmText="Arsipkan Sekarang"
            confirmIcon={Archive}
            confirmClassName="h-9 px-5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            submitting={submitting}
        >
            <div className="p-4 rounded-2xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[11px] font-bold text-[var(--color-text-muted)] leading-relaxed shadow-sm">
                Tahun Pelajaran <span className="px-2 py-0.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] font-black mx-1 whitespace-nowrap">{selectedItem.academic_year} {selectedItem.semester}</span> akan diarsipkan. Data tetap aman dan dapat dipulihkan kapan saja dari menu arsip.
            </div>
        </ConfirmDialog>
    )
})

export const DeactivateModal = memo(function DeactivateModal({
    isOpen,
    onClose,
    selectedItem,
    onConfirm,
    submitting
}) {
    if (!selectedItem) return null

    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title="Nonaktifkan Periode"
            description="Sistem akan berjalan tanpa periode acuan aktif."
            icon={Warning}
            iconBg="bg-orange-500/10"
            iconColor="text-orange-600"
            confirmText="Nonaktifkan Sekarang"
            confirmIcon={WarningCircle}
            confirmClassName="h-9 px-5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            submitting={submitting}
        >
            <div className="p-4 rounded-2xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[11px] font-bold text-[var(--color-text-muted)] leading-relaxed shadow-sm">
                Nonaktifkan <span className="px-2 py-0.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] font-black mx-1 whitespace-nowrap">{selectedItem.academic_year} {selectedItem.semester}</span>? Seluruh sistem tidak akan memiliki tahun aktif sampai Anda mengaktifkan periode lain.
            </div>
        </ConfirmDialog>
    )
})
