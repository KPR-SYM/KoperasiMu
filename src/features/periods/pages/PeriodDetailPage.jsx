import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Calendar, CaretLeft, CheckCircle, Clock, ClockCounterClockwise,
    Buildings, Users, Lock, LockOpen, Pencil, Trash, ArrowClockwise,
    Spinner, Warning, Fingerprint, Eye, EyeSlash, Copy, Archive,
} from '@phosphor-icons/react'
import DashboardLayout from '@core/layouts/DashboardLayout'
import { supabase } from '@lib/supabase'
import { useFlag } from '@context/FeatureFlags'
import { useToast } from '@context/Toast'
import { useAuth } from '@context/Auth'
import { usePrivacyMode } from '@shared/hooks/usePrivacyMode'
import { logAudit } from '@utils/auditLogger'
import {
    Badge, Breadcrumb, Alert, AuditTimeline, ConfirmDialog,
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

export default function PeriodDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { addToast } = useToast()
    const { enabled: canEdit } = useFlag('access.teacher_academic')
    const { profile } = useAuth()
    const { isPrivacyMode, setIsPrivacyMode, togglePrivacyMode, maskValue } = usePrivacyMode()

    const [period, setPeriod] = useState(null)
    const [loading, setLoading] = useState(true)
    const [usageStats, setUsageStats] = useState(null)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [showHistory, setShowHistory] = useState(false)

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isLockOpen, setIsLockOpen] = useState(false)

    const fetchPeriod = useCallback(async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('periods')
                .select('*')
                .eq('id', id)
                .is('deleted_at', null)
                .single()
            if (error || !data) {
                addToast('Periode tidak ditemukan', 'error')
                navigate('/master/periods', { replace: true })
                return
            }
            setPeriod(data)

            const { data: cls } = await supabase
                .from('classes')
                .select('id, students(count)')
                .eq('academic_year_id', id)
            const classCount = cls?.length || 0
            const studentCount = cls?.reduce((sum, c) => sum + (c.students?.[0]?.count || 0), 0) || 0
            setUsageStats({ classCount, studentCount })
        } catch {
            addToast('Gagal memuat data periode', 'error')
            navigate('/master/periods', { replace: true })
        } finally {
            setLoading(false)
        }
    }, [id, addToast, navigate])

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
            navigate('/master/periods', { replace: true })
        } catch (err) {
            addToast(err?.message || 'Gagal mengarsipkan', 'error')
        } finally {
            setDeleting(false)
            setIsDeleteOpen(false)
        }
    }, [period, deleting, addToast, navigate])

    const handleToggleLock = useCallback(async () => {
        if (!period || saving) return
        setSaving(true)
        try {
            const newStatus = !period.is_locked
            const updatePayload = newStatus
                ? { is_locked: true, locked_at: new Date().toISOString(), locked_by: profile?.id ?? null }
                : { is_locked: false, locked_at: null, locked_by: null }
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
            fetchPeriod()
        } catch (err) {
            addToast(err?.message || 'Gagal mengubah kunci', 'error')
        } finally {
            setSaving(false)
        }
    }, [period, saving, addToast, fetchPeriod, profile])

    const handleToggleActive = useCallback(async () => {
        if (!period || saving) return
        if (period.is_locked) {
            addToast('Periode terkunci — tidak dapat diaktifkan.', 'warning')
            return
        }
        setSaving(true)
        try {
            if (!period.is_active) {
                await supabase.from('periods').update({ is_active: false }).neq('id', period.id)
                await supabase.from('periods').update({ is_active: true }).eq('id', period.id)
            } else {
                await supabase.from('periods').update({ is_active: false }).eq('id', period.id)
            }
            addToast(period.is_active ? 'Periode dinonaktifkan' : 'Periode diaktifkan', 'success')
            try {
                await logAudit({
                    action: 'UPDATE', source: 'MASTER', tableName: 'periods',
                    recordId: period.id, oldData: period,
                    newData: { ...period, is_active: !period.is_active },
                })
            } catch { /* skip */ }
            fetchPeriod()
        } catch (err) {
            addToast(err?.message || 'Gagal mengubah status', 'error')
        } finally {
            setSaving(false)
        }
    }, [period, saving, addToast, fetchPeriod])

    if (loading) {
        return (
            <DashboardLayout title="Detail Periode">
                <div className="space-y-4 max-w-3xl mx-auto">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-[var(--color-surface-alt)] animate-pulse" />
                        <div className="w-48 h-3 bg-[var(--color-surface-alt)] rounded animate-pulse" />
                    </div>
                    <div className="h-24 rounded-2xl bg-[var(--color-surface-alt)]/50 animate-pulse" />
                    <div className="grid grid-cols-2 gap-3">
                        {[1, 2].map(i => <div key={i} className="h-24 rounded-2xl bg-[var(--color-surface-alt)]/50 animate-pulse" />)}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {[1, 2].map(i => <div key={i} className="h-20 rounded-2xl bg-[var(--color-surface-alt)]/50 animate-pulse" />)}
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    if (!period) return null

    const timeStatus = getTimeStatus(period.start_date, period.end_date)
    const tsc = TIME_STATUS_CONFIG[timeStatus]

    return (
        <DashboardLayout title={`${period.academic_year} ${period.semester}`}>
            <div className="space-y-3 max-w-3xl mx-auto">
                {/* Back + Breadcrumb */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/master/periods')}
                        className="h-7 w-7 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-all shrink-0"
                        title="Kembali"
                    >
                        <CaretLeft className="w-3.5 h-3.5" />
                    </button>
                    <Breadcrumb
                        items={[
                            { label: 'Master' },
                            { label: 'Tahun Pelajaran', onClick: () => navigate('/master/periods') },
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

                {/* Main Card */}
                <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Tahun Pelajaran</p>
                            <h1 className="text-xl font-black text-[var(--color-text)] leading-tight">
                                {maskValue(period.academic_year, 'text')}
                            </h1>
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
                    <div className="grid grid-cols-2 gap-3">
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

                    {/* Usage Stats */}
                    {usageStats && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                    <Buildings className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Kelas</p>
                                    <p className="text-lg font-black text-[var(--color-text)]">{maskValue(String(usageStats.classCount), 'number')}</p>
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                    <Users className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Siswa</p>
                                    <p className="text-lg font-black text-[var(--color-text)]">{maskValue(String(usageStats.studentCount), 'number')}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="pt-3 border-t border-[var(--color-border)] flex flex-wrap gap-4 text-[10px] font-bold text-[var(--color-text-muted)]">
                        <span>Dibuat: {formatDate(period.created_at)}</span>
                        {period.locked_at && <span>Dikunci: {formatDate(period.locked_at)}</span>}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={handleEdit}
                        disabled={!canEdit || period.is_locked}
                        className="h-9 px-4 rounded-xl bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-[var(--color-primary)]/20 disabled:opacity-40 disabled:cursor-not-allowed"
                        title={!canEdit ? 'Mode read-only' : period.is_locked ? 'Periode terkunci' : undefined}
                    >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                        onClick={handleToggleActive}
                        disabled={!canEdit || period.is_locked || saving}
                        className="h-9 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-[var(--color-surface-alt)] disabled:opacity-40 disabled:cursor-not-allowed"
                        title={!canEdit ? 'Mode read-only' : period.is_locked ? 'Periode terkunci' : undefined}
                    >
                        {period.is_active ? <EyeSlash className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        {period.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button
                        onClick={handleToggleLock}
                        disabled={!canEdit || saving}
                        className="h-9 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-[var(--color-surface-alt)] disabled:opacity-40 disabled:cursor-not-allowed"
                        title={!canEdit ? 'Mode read-only' : undefined}
                    >
                        {period.is_locked ? <LockOpen className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        {period.is_locked ? 'Buka Kunci' : 'Kunci'}
                    </button>
                    <button
                        onClick={() => setIsDeleteOpen(true)}
                        disabled={!canEdit || saving}
                        className="h-9 px-4 rounded-xl border border-red-200 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
                        title={!canEdit ? 'Mode read-only' : undefined}
                    >
                        <Archive className="w-3.5 h-3.5" /> Arsipkan
                    </button>
                </div>

                {/* History Panel */}
                {showHistory && (
                    <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
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
        </DashboardLayout>
    )
}
