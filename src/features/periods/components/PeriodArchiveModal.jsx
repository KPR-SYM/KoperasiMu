import React, { useState, useMemo } from 'react'
import { Warning, Archive, CaretDown, Spinner, Trash, ArrowCounterClockwise, Plus } from '@phosphor-icons/react'

import { Modal, EmptyState, Tooltip } from '@shared/components'
import { supabase } from '@lib/supabase'
import { useErrorHandler } from '@hooks'

export default function PeriodArchiveModal({
    isOpen,
    onClose,
    archivedYears,
    loadingArchived,
    setArchivedYears,
    fetchArchivedYears,
    fetchData,
    addToast,
    addUndoToast
}) {
    const { handleError } = useErrorHandler('PeriodArchiveModal')
    const [showCount, setShowCount] = useState(10)

    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [restoring, setRestoring] = useState(false)

    const [selectedIds, setSelectedIds] = useState([])
    const [bulkDeleting, setBulkDeleting] = useState(false)
    const [bulkRestoring, setBulkRestoring] = useState(false)

    if (!isOpen) return null

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    const toggleSelectAll = () => {
        const visible = archivedYears.slice(0, showCount).map(y => y.id)
        setSelectedIds(prev => prev.length === visible.length ? [] : [...visible])
    }

    const allSelected = archivedYears.length > 0 && archivedYears.slice(0, showCount).every(y => selectedIds.includes(y.id))

    const handleRestoreYear = async (year) => {
        setRestoring(true)
        try {
            const { error } = await supabase.from('periods').update({ deleted_at: null }).eq('id', year.id)
            if (error) throw error
            setArchivedYears(prev => prev.filter(y => y.id !== year.id))
            setSelectedIds(prev => prev.filter(id => id !== year.id))
            fetchData?.()
            addUndoToast(`${year.academic_year} ${year.semester} berhasil dipulihkan`, async () => {
                try {
                    const { error: undoErr } = await supabase.from('periods').update({ deleted_at: new Date().toISOString() }).eq('id', year.id)
                    if (undoErr) throw undoErr
                    fetchData?.()
                    fetchArchivedYears?.()
                } catch (e) { handleError(e, { context: 'Gagal membatalkan pemulihan' }) }
            })
        } catch (err) { handleError(err, { context: 'Gagal memulihkan tahun pelajaran' }) } finally {
            setRestoring(false)
        }
    }

    const handleBulkRestore = async () => {
        if (selectedIds.length === 0) return
        setBulkRestoring(true)
        try {
            const toRestore = archivedYears.filter(y => selectedIds.includes(y.id))
            const { error } = await supabase.from('periods').update({ deleted_at: null }).in('id', selectedIds)
            if (error) throw error
            setArchivedYears(prev => prev.filter(y => !selectedIds.includes(y.id)))
            setSelectedIds([])
            fetchData?.()
            addUndoToast(`${toRestore.length} periode berhasil dipulihkan`, async () => {
                try {
                    const ids = toRestore.map(y => y.id)
                    const { error: undoErr } = await supabase.from('periods').update({ deleted_at: new Date().toISOString() }).in('id', ids)
                    if (undoErr) throw undoErr
                    fetchData?.()
                    fetchArchivedYears?.()
                } catch (e) { handleError(e, { context: 'Gagal membatalkan pemulihan massal' }) }
            })
        } catch (err) { handleError(err, { context: 'Gagal memulihkan massal' }) } finally {
            setBulkRestoring(false)
        }
    }

    const confirmPermanentDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            const { error } = await supabase.from('periods').delete().eq('id', deleteTarget.id)
            if (error) throw error
            addToast(`${deleteTarget.academic_year} ${deleteTarget.semester} dihapus permanen`, 'success')
            setArchivedYears(prev => prev.filter(y => y.id !== deleteTarget.id))
            setSelectedIds(prev => prev.filter(id => id !== deleteTarget.id))
            setDeleteTarget(null)
            fetchData?.()
        } catch (err) {
            handleError(err, { context: 'Gagal hapus permanen data' })
        } finally {
            setDeleting(false)
        }
    }

    const handleBulkPermanentDelete = async () => {
        if (selectedIds.length === 0) return
        setBulkDeleting(true)
        try {
            const { error } = await supabase.from('periods').delete().in('id', selectedIds)
            if (error) throw error
            addToast(`${selectedIds.length} periode dihapus permanen`, 'success')
            setArchivedYears(prev => prev.filter(y => !selectedIds.includes(y.id)))
            setSelectedIds([])
            fetchData?.()
        } catch (err) {
            handleError(err, { context: 'Gagal hapus permanen massal' })
        } finally {
            setBulkDeleting(false)
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return '-'
        return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    const formatRelativeDate = (dateString) => {
        if (!dateString) return '-'
        const date = new Date(dateString)
        const diff = new Date() - date
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        if (days === 0) return 'Hari ini'
        if (days === 1) return 'Kemarin'
        if (days < 7) return `${days} hari lalu`
        if (days < 30) return `${Math.floor(days / 7)} minggu lalu`
        return `${Math.floor(days / 30)} bulan lalu`
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Arsip Tahun Pelajaran"
            description="Kelola dan pulihkan periode yang telah dihapus sementara."
            icon={Archive}
            iconBg="bg-amber-500/10"
            iconColor="text-amber-600"
            size="lg"
            mobileVariant="bottom-sheet"
            footer={
                <div className="flex items-center w-full gap-3">
                    <button
                        onClick={onClose}
                        className="h-10 px-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-surface-alt)] transition-all flex items-center justify-center"
                    >
                        Tutup
                    </button>
                    <div className="flex-1" />
                    {selectedIds.length > 0 && (
                        <>
                            <button
                                onClick={handleBulkRestore}
                                disabled={bulkRestoring}
                                className="h-10 px-4 rounded-xl bg-emerald-500 hover:brightness-110 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
                            >
                                {bulkRestoring ? <><Spinner className="fa-spin" /> Memulihkan...</> : <><ArrowCounterClockwise /> Pulihkan ({selectedIds.length})</>}
                            </button>
                            <button
                                onClick={handleBulkPermanentDelete}
                                disabled={bulkDeleting}
                                className="h-10 px-4 rounded-xl bg-red-500 hover:brightness-110 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center gap-2"
                            >
                                {bulkDeleting ? <><Spinner className="fa-spin" /> Menghapus...</> : <><Trash /> Hapus ({selectedIds.length})</>}
                            </button>
                        </>
                    )}
                </div>
            }
        >
            <div className="space-y-3 relative">

                {/* ====== DELETE CONFIRMATION OVERLAY ====== */}
                <div
                    className={`absolute inset-0 z-20 bg-[var(--color-surface)] flex flex-col items-center justify-center gap-4 p-6 rounded-xl transition-all duration-300 ease-out ${deleteTarget ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95 pointer-events-none'}`}
                >
                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <Warning className="text-red-500 text-2xl" />
                    </div>
                    <div className="text-center max-w-xs">
                        <p className="font-black text-[var(--color-text)] mb-1">Hapus Permanen?</p>
                        <p className="text-[11px] font-medium text-[var(--color-text-muted)] leading-relaxed">
                            Tahun pelajaran <b className="text-red-500">{deleteTarget?.academic_year} ({deleteTarget?.semester})</b> akan dihapus secara permanen. Tindakan ini <b>tidak dapat dibatalkan</b>.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                        <button
                            onClick={() => setDeleteTarget(null)}
                            disabled={deleting}
                            className="h-9 px-5 rounded-xl bg-[var(--color-surface-alt)] font-bold text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] hover:bg-[var(--color-border)] transition-colors border border-[var(--color-border)] disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            onClick={confirmPermanentDelete}
                            disabled={deleting}
                            className="h-9 px-5 rounded-xl bg-red-500 hover:brightness-110 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center gap-2"
                        >
                            {deleting ? <><Spinner className="fa-spin" /> Menghapus...</> : <><Trash /> Hapus Permanen</>}
                        </button>
                    </div>
                </div>

                {/* ====== MAIN CONTENT ====== */}
                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 flex items-center gap-3">
                    <Archive className="text-amber-600 w-5 h-5 shrink-0" />
                    <div>
                        <p className="text-[11px] font-black text-amber-700 dark:text-amber-400">{archivedYears.length} periode di arsip</p>
                        <p className="text-[10px] text-[var(--color-text-muted)] font-medium">Pulihkan untuk mengembalikan ke daftar aktif, atau hapus permanen.</p>
                    </div>
                </div>

                {loadingArchived ? (
                    <div className="text-center py-12 text-[var(--color-text-muted)]">
                        <Spinner className="fa-spin mb-3 text-xl" />
                        <p className="font-bold">Memuat arsip...</p>
                    </div>
                ) : archivedYears.length === 0 ? (
                    <div className="text-center py-8">
                        <EmptyState
                            icon={Archive}
                            title="Arsip Kosong"
                            description="Semua tahun pelajaran sudah aktif. Tidak ada data yang diarsipkan saat ini."
                            variant="dashed"
                            color="amber"
                        />
                        <p className="mt-3 text-[10px] text-[var(--color-text-muted)]">
                            Gunakan tombol <b>Generate Tahun Baru</b> untuk menambah periode baru.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="border border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-surface)] shadow-sm">
                            <table className="w-full text-xs">
                                <thead className="bg-[var(--color-surface-alt)] sticky top-0">
                                    <tr className="text-left text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                                        <th className="px-3 py-2.5 w-8">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                onChange={toggleSelectAll}
                                                className="w-3.5 h-3.5 rounded border-[var(--color-border)] accent-blue-500 cursor-pointer"
                                            />
                                        </th>
                                        <th className="px-3 py-2.5">Tahun Pelajaran</th>
                                        <th className="px-3 py-2.5">Rentang Tanggal</th>
                                        <th className="px-3 py-2.5 text-center whitespace-nowrap">Diarsipkan</th>
                                        <th className="px-3 py-2.5 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {archivedYears.slice(0, showCount).map(y => (
                                        <tr key={y.id} className={`border-b last:border-0 border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]/40 transition-colors ${selectedIds.includes(y.id) ? 'bg-blue-500/5' : ''}`}>
                                            <td className="px-3 py-2.5">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(y.id)}
                                                    onChange={() => toggleSelect(y.id)}
                                                    className="w-3.5 h-3.5 rounded border-[var(--color-border)] accent-blue-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <p className="font-bold text-[var(--color-text)] leading-snug whitespace-nowrap">{y.academic_year}</p>
                                                <p className="text-[9px] font-mono text-[var(--color-text-muted)]">Semester {y.semester}</p>
                                            </td>
                                            <td className="px-3 py-2.5 text-[10px] text-[var(--color-text-muted)] font-mono whitespace-nowrap">
                                                {y.start_date || '-'} → {y.end_date || '-'}
                                            </td>
                                            <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                                <Tooltip content={y.deleted_at ? new Date(y.deleted_at).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''} position="top">
                                                    <span className="text-[10px] font-medium text-[var(--color-text-muted)] cursor-default">
                                                        {formatRelativeDate(y.deleted_at)}
                                                    </span>
                                                </Tooltip>
                                            </td>
                                            <td className="px-3 py-2.5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => handleRestoreYear(y)}
                                                        disabled={restoring}
                                                        className="h-7 px-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 disabled:opacity-50"
                                                    >
                                                        <ArrowCounterClockwise className="w-2 h-2" />
                                                        Pulihkan
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(y)}
                                                        className="h-7 px-2.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1"
                                                    >
                                                        <Trash className="w-2 h-2" />
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {archivedYears.length > showCount && (
                            <div className="flex justify-center">
                                <button
                                    onClick={() => setShowCount(prev => prev + 10)}
                                    className="h-8 px-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] transition-all flex items-center gap-1.5"
                                >
                                    <CaretDown className="w-3 h-3" />
                                    Tampilkan lebih banyak ({archivedYears.length - showCount} lagi)
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    )
}
