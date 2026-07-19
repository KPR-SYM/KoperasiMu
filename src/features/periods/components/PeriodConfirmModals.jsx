import React, { memo, useState } from 'react'
import { WarningCircle, Warning, Archive, Lock, LockOpen, Calendar } from '@phosphor-icons/react'

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

export const LockModal = memo(function LockModal({
    isOpen,
    onClose,
    selectedCount,
    onConfirm,
    submitting
}) {
    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title="Konfirmasi Kunci"
            description="Periode yang terkunci tidak dapat diubah."
            icon={Lock}
            iconBg="bg-rose-500/10"
            iconColor="text-rose-600"
            confirmText="Kunci Sekarang"
            confirmIcon={Lock}
            confirmClassName="h-9 px-5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            submitting={submitting}
        >
            <div className="p-4 rounded-2xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[11px] font-bold text-[var(--color-text-muted)] leading-relaxed shadow-sm">
                Sebanyak <span className="font-black text-[var(--color-text)]">{selectedCount}</span> periode akan dikunci. Data tidak dapat diubah sampai dibuka kembali.
            </div>
        </ConfirmDialog>
    )
})

export const UnlockModal = memo(function UnlockModal({
    isOpen,
    onClose,
    selectedCount,
    onConfirm,
    submitting
}) {
    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title="Konfirmasi Buka Kunci"
            description="Periode akan kembali dapat diedit."
            icon={LockOpen}
            iconBg="bg-emerald-500/10"
            iconColor="text-emerald-600"
            confirmText="Buka Kunci"
            confirmIcon={LockOpen}
            confirmClassName="h-9 px-5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            submitting={submitting}
        >
            <div className="p-4 rounded-2xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[11px] font-bold text-[var(--color-text-muted)] leading-relaxed shadow-sm">
                Sebanyak <span className="font-black text-[var(--color-text)]">{selectedCount}</span> periode akan dibuka kembali.
            </div>
        </ConfirmDialog>
    )
})

export const ShiftDatesModal = memo(function ShiftDatesModal({
    isOpen,
    onClose,
    selectedCount,
    onConfirm,
    submitting
}) {
    const [days, setDays] = useState(7);
    if (!isOpen) return null;
    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={() => onConfirm(days)}
            title="Shift Tanggal Massal"
            description={`Geser tanggal ${selectedCount} periode sebanyak:`}
            icon={Calendar}
            iconBg="bg-blue-500/10"
            iconColor="text-blue-600"
            confirmText="Geser Sekarang"
            confirmIcon={Calendar}
            confirmClassName="h-9 px-5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            submitting={submitting}
        >
            <div className="p-4 rounded-2xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[11px] font-bold text-[var(--color-text-muted)] leading-relaxed shadow-sm space-y-3">
                <p>Masukkan jumlah hari untuk menggeser semua tanggal (start, end, pendaftaran):</p>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setDays((d) => d - 1)} className="w-8 h-8 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-sm font-bold hover:bg-[var(--color-surface-alt)] disabled:opacity-30" disabled={days <= -365}>−</button>
                    <input type="number" value={days} onChange={(e) => setDays(parseInt(e.target.value) || 0)} className="w-20 text-center h-8 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-bold text-[var(--color-text)]" />
                    <button type="button" onClick={() => setDays((d) => d + 1)} className="w-8 h-8 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-sm font-bold hover:bg-[var(--color-surface-alt)] disabled:opacity-30" disabled={days >= 365}>+</button>
                    <span className="text-[10px] text-[var(--color-text-muted)]">hari {days >= 0 ? "(maju)" : "(mundur)"}</span>
                </div>
            </div>
        </ConfirmDialog>
    )
})
