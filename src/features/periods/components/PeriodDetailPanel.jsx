import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Calendar, CaretLeft, CheckCircle, Clock, ClockCounterClockwise,
    Buildings, Users, Lock, LockOpen, Pencil, Trash, ArrowClockwise,
    Spinner, Warning, Fingerprint, Eye, EyeSlash, Copy, Archive,
} from '@phosphor-icons/react'
import { supabase } from '@lib/supabase'
import { useFlag } from '@context/FeatureFlags'
import { useToast } from '@context/Toast'
import { useAuth } from '@context/Auth'
import { usePrivacyMode } from '@shared/hooks/usePrivacyMode'
import { logAudit } from '@utils/auditLogger'
import {
    Badge, Breadcrumb, Alert, AuditTimeline, ConfirmDialog, Skeleton,
} from '@shared/components'
import PeriodFormModal from '@features/periods/components/PeriodFormModal'
import { ArchiveModal } from '@features/periods/components/PeriodConfirmModals'

function formatDate(dateStr) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getDuration(start, end) {
    if (!start || !end) return '-'
    const s = new Date(start)
    const e = new Date(end)
    if (e < s) return '-'
    const months = (e.getFullYear() - s.getFullYear()) * 12 + e.getMonth() - s.getMonth()
    const days = Math.round((e - s) / (1000 * 60 * 60 * 24))
    return `${months} bulan (${days} hari)`
}

function getTimeStatus(start, end) {
    if (!start || !end) return 'unknown'
    const now = new Date()
    const s = new Date(start)
    const e = new Date(end)
    if (now < s) return 'upcoming'
    if (now > e) return 'ended'
    return 'running'
}

const TIME_STATUS_CONFIG = {
    running: { label: 'Sedang Berjalan', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    upcoming: { label: 'Akan Datang', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    ended: { label: 'Sudah Berakhir', color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20' },
    unknown: { label: 'Tidak Diketahui', color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20' },
}

function DetailSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                    <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-3 w-28 rounded" />
                                <Skeleton className="h-7 w-48 rounded-lg" />
                                <div className="flex gap-2 mt-2">
                                    <Skeleton className="h-5 w-20 rounded-full" />
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                    <Skeleton className="h-5 w-24 rounded-full" />
                                </div>
                            </div>
                            <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
                        <Skeleton className="h-4 w-32 rounded" />
                        <div className="grid grid-cols-2 gap-3">
                            {[1,2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
                        </div>
                    </div>
                    <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
                        <Skeleton className="h-4 w-32 rounded" />
                        <Skeleton className="h-64 rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function PeriodDetailPanel({ periodId, onBack }) {
    const navigate = useNavigate()
    const { addToast } = useToast()
    const { enabled: canEdit } = useFlag('access.teacher_academic')
    const { profile } = useAuth()
    const { isPrivacyMode, togglePrivacyMode, maskValue } = usePrivacyMode()

    const [period, setPeriod] = useState(null)
    const [loading, setLoading] = useState(true)
    const [usageStats, setUsageStats] = useState(null)
    const [classList, setClassList] = useState([])
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [showHistory, setShowHistory] = useState(false)

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)

    const fetchPeriod = useCallback(async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('periods')
                .select('*')
                .eq('id', periodId)
                .is('deleted_at', null)
                .single()
            if (error || !data) {
                addToast('Periode tidak ditemukan', 'error')
                onBack()
                return
            }
            setPeriod(data)

            const { data: cls } = await supabase
                .from('classes')
                .select('id, name, grade, major')
                .eq('academic_year_id', periodId)
                .order('name')
            const classCount = cls?.length || 0
            setClassList(cls || [])
            let studentCount = 0
            if (classCount > 0) {
                const classIds = cls.map(c => c.id)
                const { count } = await supabase
                    .from('students')
                    .select('id', { count: 'exact', head: true })
                    .in('class_id', classIds)
                    .is('deleted_at', null)
                studentCount = count || 0
            }
            setUsageStats({ classCount, studentCount })
        } catch {
            addToast('Gagal memuat data periode', 'error')
            onBack()
        } finally {
            setLoading(false)
        }
    }, [periodId, addToast, onBack])

    useEffect(() => { fetchPeriod() }, [fetchPeriod])

    const handleEdit = useCallback(() => {
        if (period?.is_locked) {
            addToast('Periode terkunci — buka kunci terlebih dahulu untuk mengedit.', 'warning')
            return
        }
        setIsFormOpen(true)
    }, [period, addToast])

    const handleSubmitEdit = useCallback(async (formData, setFormErrors) => {
        if (!period || saving) return
        setSaving(true)
        const errors = {}
        if (!formData.name.trim()) errors.name = 'Nama tahun pelajaran wajib diisi'
        if (!formData.startDate) errors.startDate = 'Tanggal mulai wajib diisi'
        if (!formData.endDate) errors.endDate = 'Tanggal selesai wajib diisi'
        if (formData.startDate && formData.endDate && formData.endDate <= formData.startDate)
            errors.endDate = 'Tanggal selesai harus setelah tanggal mulai'
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors)
            setSaving(false)
            return
        }
        try {
            const payload = {
                academic_year: formData.name.trim(),
                semester: String(formData.semester || '').trim(),
                start_date: formData.startDate,
                end_date: formData.endDate,
            }
            const { error } = await supabase.from('periods').update(payload).eq('id', period.id)
            if (error) throw error

            if (formData.makeActive && !period.is_active) {
                await supabase.from('periods').update({ is_active: false }).neq('id', period.id)
                await supabase.from('periods').update({ is_active: true }).eq('id', period.id)
            } else if (!formData.makeActive && period.is_active) {
                await supabase.from('periods').update({ is_active: false }).eq('id', period.id)
            }

            addToast('Periode berhasil diupdate', 'success')
            try {
                await logAudit({
                    action: 'UPDATE', source: 'MASTER', tableName: 'periods',
                    recordId: period.id, oldData: period,
                    newData: { ...period, ...payload },
                })
            } catch { /* skip audit */ }
            setIsFormOpen(false)
            fetchPeriod()
        } catch (err) {
            addToast(err?.message || 'Gagal menyimpan', 'error')
        } finally {
            setSaving(false)
        }
    }, [period, saving, addToast, fetchPeriod])

    const handleDeleteConfirm = useCallback(async () => {
        if (!period || deleting) return
        setDeleting(true)
        try {
            const { error } = await supabase
                .from('periods')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', period.id)
            if (error) throw error
            addToast('Periode berhasil diarsipkan', 'success')
            try {
                await logAudit({
                    action: 'UPDATE', source: 'MASTER', tableName: 'periods',
                    recordId: period.id, oldData: period,
                    newData: { ...period, deleted_at: new Date().toISOString() },
                })
            } catch { /* skip */ }
            onBack()
        } catch (err) {
            addToast(err?.message || 'Gagal mengarsipkan', 'error')
        } finally {
            setDeleting(false)
            setIsDeleteOpen(false)
        }
    }, [period, deleting, addToast, onBack])

    const handleToggleLock = useCallback(async () => {
        if (!period || saving) return
        const newStatus = !period.is_locked
        const updatePayload = newStatus
            ? { is_locked: true, locked_at: new Date().toISOString(), locked_by: profile?.id ?? null }
            : { is_locked: false, locked_at: null, locked_by: null }
        setPeriod(prev => prev ? { ...prev, ...updatePayload } : prev)
        setSaving(true)
        try {
            const { error } = await supabase.from('periods').update(updatePayload).eq('id', period.id)
            if (error) throw error
            addToast(newStatus ? 'Periode dikunci' : 'Kunci periode dibuka', 'success')
            try {
                await logAudit({
                    action: 'UPDATE', source: 'MASTER', tableName: 'periods',
                    recordId: period.id, oldData: period,
                    newData: { ...period, ...updatePayload },
                })
            } catch { /* skip */ }
        } catch (err) {
            setPeriod(prev => prev ? { ...prev, ...period } : prev)
            addToast(err?.message || 'Gagal mengubah kunci', 'error')
        } finally {
            setSaving(false)
        }
    }, [period, saving, addToast, profile])

    const handleToggleActive = useCallback(async () => {
        if (!period || saving) return
        if (period.is_locked) {
            addToast('Periode terkunci — tidak dapat diaktifkan.', 'warning')
            return
        }
        const newActive = !period.is_active
        setPeriod(prev => prev ? { ...prev, is_active: newActive } : prev)
        setSaving(true)
        try {
            if (newActive) {
                await supabase.from('periods').update({ is_active: false }).neq('id', period.id)
                await supabase.from('periods').update({ is_active: true }).eq('id', period.id)
            } else {
                await supabase.from('periods').update({ is_active: false }).eq('id', period.id)
            }
            addToast(newActive ? 'Periode diaktifkan' : 'Periode dinonaktifkan', 'success')
            try {
                await logAudit({
                    action: 'UPDATE', source: 'MASTER', tableName: 'periods',
                    recordId: period.id, oldData: period,
                    newData: { ...period, is_active: newActive },
                })
            } catch { /* skip */ }
        } catch (err) {
            setPeriod(prev => prev ? { ...prev, is_active: period.is_active } : prev)
            addToast(err?.message || 'Gagal mengubah status', 'error')
        } finally {
            setSaving(false)
        }
    }, [period, saving, addToast])

    const goBack = useCallback(() => onBack(), [onBack])

    if (loading) {
        return (
            <div className="flex flex-col min-h-[calc(100vh-3.5rem)] -mx-4 sm:-mx-5 lg:-mx-6 -mt-4 lg:-mt-6">
                <div className="px-5 pt-5 pb-3 shrink-0">
                    <div className="flex items-center gap-2 mb-3">
                        <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
                        <Skeleton className="h-3 w-64 rounded" />
                    </div>
                    <Skeleton className="h-7 w-56 rounded-lg" />
                </div>
                <div className="flex-1 min-h-0 px-5 pb-5">
                    <DetailSkeleton />
                </div>
            </div>
        )
    }

    if (!period) return null

    const timeStatus = getTimeStatus(period.start_date, period.end_date)
    const tsc = TIME_STATUS_CONFIG[timeStatus]

    return (
        <div className="flex flex-col min-h-[calc(100vh-3.5rem)] -mx-4 sm:-mx-5 lg:-mx-6 -mt-4 lg:-mt-6">
            {/* Header */}
            <div className="px-5 pt-5 pb-3 shrink-0">
                <div className="flex items-center gap-2 mb-3">
                    <button
                        onClick={goBack}
                        className="h-7 w-7 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-all shrink-0"
                        title="Kembali"
                    >
                        <CaretLeft className="w-3.5 h-3.5" />
                    </button>
                    <Breadcrumb
                        items={[
                            { label: 'Master' },
                            { label: 'Tahun Pelajaran', onClick: goBack },
                            { label: `${period.academic_year} ${period.semester}` },
                        ]}
                    />
                    <div className="ml-auto flex items-center gap-1.5">
                        <button
                            onClick={togglePrivacyMode}
                            className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all ${isPrivacyMode ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : 'bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
                            title={isPrivacyMode ? 'Matikan Mode Privasi' : 'Aktifkan Mode Privasi'}
                        >
                            {isPrivacyMode ? <EyeSlash className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        {canEdit && (
                            <button
                                onClick={() => setShowHistory(v => !v)}
                                className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all ${showHistory ? 'bg-purple-500/10 border-purple-500/30 text-purple-600' : 'bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
                                title="Riwayat Perubahan"
                            >
                                <ClockCounterClockwise className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Title */}
                <div>
                    <h1 className="text-xl font-black font-heading tracking-tight text-[var(--color-text)] leading-tight">
                        Detail Tahun Pelajaran
                    </h1>
                    <p className="text-[var(--color-text-muted)] text-[10px] mt-0.5 font-medium">
                        {period.academic_year} {period.semester} — informasi lengkap periode akademik.
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 px-5 pb-5 overflow-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Left: Main Info */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Header Card */}
                        <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Tahun Pelajaran</p>
                                    <h2 className="text-xl font-black text-[var(--color-text)] leading-tight">
                                        {maskValue(period.academic_year, 'text')}
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${period.semester === 'Ganjil' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 'bg-purple-500/10 text-purple-600 border-purple-500/20'}`}>
                                            Semester {period.semester}
                                        </span>
                                        {period.is_active && (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                                <CheckCircle className="w-3 h-3" /> Aktif
                                            </span>
                                        )}
                                        {period.is_locked && (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                                <Lock className="w-3 h-3" /> Terkunci
                                            </span>
                                        )}
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${tsc.color}`}>
                                            {tsc.label}
                                        </span>
                                    </div>
                                </div>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${period.is_active ? 'bg-[var(--color-primary)] text-white shadow-md' : 'bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-muted)]'}`}>
                                    <Calendar className="w-6 h-6" />
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Tanggal Mulai</p>
                                    <p className="text-sm font-bold text-[var(--color-text)]">{formatDate(maskValue(period.start_date, 'date'))}</p>
                                </div>
                                <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Tanggal Selesai</p>
                                    <p className="text-sm font-bold text-[var(--color-text)]">{formatDate(maskValue(period.end_date, 'date'))}</p>
                                </div>
                                <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Durasi</p>
                                    <p className="text-sm font-black text-[var(--color-text)]">{getDuration(period.start_date, period.end_date)}</p>
                                </div>
                                <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Status Waktu</p>
                                    <p className="text-sm font-black text-[var(--color-text)]">{tsc.label}</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            {period.start_date && period.end_date && (
                                <div className="pt-3 border-t border-[var(--color-border)]">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Progress Periode</span>
                                        {(() => {
                                            const now = Date.now()
                                            const s = new Date(period.start_date).getTime()
                                            const e = new Date(period.end_date).getTime()
                                            const pct = Math.min(100, Math.max(0, ((now - s) / (e - s)) * 100))
                                            return <span className="text-[10px] font-black text-[var(--color-text)]">{Math.round(pct)}%</span>
                                        })()}
                                    </div>
                                    {(() => {
                                        const now = Date.now()
                                        const s = new Date(period.start_date).getTime()
                                        const e = new Date(period.end_date).getTime()
                                        const pct = Math.min(100, Math.max(0, ((now - s) / (e - s)) * 100))
                                        const color = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                        return (
                                            <div className="h-2 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
                                                <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                                            </div>
                                        )
                                    })()}
                                    <div className="flex justify-between mt-1.5">
                                        <span className="text-[9px] font-bold text-[var(--color-text-muted)]">{formatDate(period.start_date)}</span>
                                        <span className="text-[9px] font-bold text-[var(--color-text-muted)]">{formatDate(period.end_date)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={handleEdit}
                                disabled={!canEdit || period.is_locked}
                                className="h-9 px-4 rounded-xl bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-[var(--color-primary)]/20 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Pencil className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                                onClick={handleToggleActive}
                                disabled={!canEdit || period.is_locked || saving}
                                className="h-9 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-[var(--color-surface-alt)] disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {period.is_active ? <EyeSlash className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                {period.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                            <button
                                onClick={handleToggleLock}
                                disabled={!canEdit || saving}
                                className="h-9 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-[var(--color-surface-alt)] disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {period.is_locked ? <LockOpen className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                {period.is_locked ? 'Buka Kunci' : 'Kunci'}
                            </button>
                            <button
                                onClick={() => setIsDeleteOpen(true)}
                                disabled={!canEdit || saving}
                                className="h-9 px-4 rounded-xl border border-red-200 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Archive className="w-3.5 h-3.5" /> Arsipkan
                            </button>
                        </div>

                        {/* Daftar Kelas */}
                        <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-black text-[var(--color-text)]">Daftar Kelas</h3>
                                {classList.length > 0 && (
                                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">{classList.length} kelas</span>
                                )}
                            </div>
                            {classList.length === 0 ? (
                                <div className="py-8 text-center">
                                    <Buildings className="w-8 h-8 mx-auto text-[var(--color-text-muted)] opacity-30 mb-2" />
                                    <p className="text-[11px] font-bold text-[var(--color-text-muted)]">Belum ada kelas</p>
                                    <p className="text-[10px] text-[var(--color-text-muted)] opacity-60">Kelas akan muncul setelah ditambahkan</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {classList.slice(0, 8).map((cls) => (
                                        <div key={cls.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 hover:bg-[var(--color-surface-alt)]/60 transition-colors">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center text-[10px] font-black shrink-0">
                                                <Buildings className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-bold text-[var(--color-text)] truncate">{cls.name}</p>
                                                <p className="text-[9px] text-[var(--color-text-muted)]">
                                                    {cls.grade && <span>{cls.grade}</span>}
                                                    {cls.grade && cls.major && <span> · </span>}
                                                    {cls.major && <span>{cls.major}</span>}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {classList.length > 8 && (
                                        <p className="text-center text-[10px] font-bold text-[var(--color-text-muted)] pt-1">
                                            +{classList.length - 8} kelas lainnya
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Sidebar */}
                    <div className="space-y-4">
                        {/* Usage Stats */}
                        {usageStats && (
                            <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                                <h3 className="text-xs font-black text-[var(--color-text)] mb-3">Statistik Penggunaan</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                            <Buildings className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Kelas</p>
                                            <p className="text-lg font-black text-[var(--color-text)]">{maskValue(String(usageStats.classCount), 'number')}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Siswa</p>
                                            <p className="text-lg font-black text-[var(--color-text)]">{maskValue(String(usageStats.studentCount), 'number')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Metadata */}
                        <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                            <h3 className="text-xs font-black text-[var(--color-text)] mb-3">Informasi</h3>
                            <div className="space-y-2 text-[11px] font-bold text-[var(--color-text-muted)]">
                                <div className="flex justify-between">
                                    <span>Dibuat</span>
                                    <span className="text-[var(--color-text)]">{formatDate(period.created_at)}</span>
                                </div>
                                {period.locked_at && (
                                    <div className="flex justify-between">
                                        <span>Dikunci</span>
                                        <span className="text-[var(--color-text)]">{formatDate(period.locked_at)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* History Panel */}
                        {showHistory && (
                            <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
                                <div className="flex items-center gap-2">
                                    <Fingerprint className="w-4 h-4 text-purple-500" />
                                    <h3 className="text-xs font-black text-[var(--color-text)]">Riwayat Perubahan</h3>
                                </div>
                                <div className="h-[300px] overflow-auto rounded-xl border border-[var(--color-border)]">
                                    <AuditTimeline
                                        tableName="periods"
                                        recordId={period.id}
                                        limit={30}
                                        theme="purple"
                                        containerClassName="p-3"
                                        showSearch
                                        stickyHeader
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <PeriodFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                selectedItem={period}
                years={[period]}
                onSubmit={handleSubmitEdit}
                submitting={saving}
            />

            <ArchiveModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                selectedItem={period}
                onConfirm={handleDeleteConfirm}
                submitting={deleting}
            />
        </div>
    )
}
