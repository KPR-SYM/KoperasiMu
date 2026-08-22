import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
    CaretLeft, Pencil, Printer, ArrowsClockwise, IdentificationCard,
    Briefcase, ClockCounterClockwise, ChatCircle, Copy,
    GenderMale, GenderFemale,
    Prohibit, CheckCircle, Archive, Eye, EyeSlash, ArrowClockwise,
    Lock, LockOpen,
} from '@phosphor-icons/react'
import { supabase } from '@lib/supabase'
import { useFlag } from '@context/FeatureFlags'
import { useToast } from '@context/Toast'
import { useAuth } from '@context/Auth'
import { logAudit } from '@utils/auditLogger'
import { Skeleton, Tooltip, AuditTimeline, ConfirmDialog } from '@shared/components'
import { PrivacyMask } from '@shared/components'
import { usePrivacyMode } from '@shared/hooks/usePrivacyMode'
import TeacherFormModal from '@features/teachers/components/TeacherFormModal'
import { TYPE_LABELS } from '@features/teachers/constants/teacherConstants'

const STATUS_CONFIG = {
    active: { label: 'Aktif', color: 'bg-emerald-500 text-white border-white/20' },
    inactive: { label: 'Nonaktif', color: 'bg-rose-500 text-white border-white/20' },
    cuti: { label: 'Cuti', color: 'bg-amber-500 text-white border-white/20' },
}

const mapTeacher = (row) => ({
    ...row,
    name: row.full_name || '',
    status: row.is_active ? 'active' : 'inactive',
    type: Array.isArray(row.type) ? row.type : row.type ? [row.type] : [],
})

function formatDate(dateStr) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function DetailSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-10 rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
            </div>
        </div>
    )
}

function InfoRow({ label, value, hint, isPrivacyMode }) {
    return (
        <div className="space-y-1">
            <p className="text-[9px] font-black uppercase text-[var(--color-text-muted)] tracking-widest opacity-80">
                {label}
            </p>
            {value ? (
                <p className="text-[13px] font-bold text-[var(--color-text)] break-words" title={typeof value === 'string' ? value : undefined}>
                    <PrivacyMask active={isPrivacyMode}>{value}</PrivacyMask>
                </p>
            ) : (
                <p className="text-[12px] text-[var(--color-text-muted)] italic">{hint || 'Belum diisi'}</p>
            )}
        </div>
    )
}

function SectionCard({ icon, iconBg, accent, title, children }) {
    const Icon = icon
    return (
        <div className="p-3 sm:p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2.5 pt-1">
                <div className={`w-1 h-4 ${accent} rounded-full`} />
                <Icon className={`${iconBg} w-3 h-3 opacity-70`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">{title}</span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--color-border)] to-transparent opacity-40" />
            </div>
            {children}
        </div>
    )
}

export default function TeacherDetailPanel({ teacherId, onBack, subjectsList = [], canEdit }) {
    const { addToast } = useToast()
    const { profile } = useAuth()
    const { enabled: canEditFlag } = useFlag('access.teacher_teachers')
    const editable = canEdit ?? canEditFlag

    const addToastRef = useRef(addToast)
    const onBackRef = useRef(onBack)
    useEffect(() => { addToastRef.current = addToast }, [addToast])
    useEffect(() => { onBackRef.current = onBack }, [onBack])

    const [teacher, setTeacher] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [profileTab, setProfileTab] = useState('info')
    const [copiedPhone, setCopiedPhone] = useState(false)
    const [lastRefresh, setLastRefresh] = useState(null)

    const isAdmin = ['developer', 'admin'].includes(profile?.role)
    const { isPrivacyMode, togglePrivacyMode } = usePrivacyMode()

    /* ── Fetch ── */
    const fetchTeacher = useCallback(async () => {
        setLoading(true)
        try {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teacherId)
            let query = supabase.from('teachers').select('*').is('deleted_at', null)
            if (isUUID) {
                query = query.eq('uuid', teacherId)
            } else {
                query = query.eq('id', teacherId)
            }
            const { data, error } = await query.single()
            if (error || !data) {
                addToastRef.current('Guru tidak ditemukan', 'error')
                onBackRef.current()
                return
            }
            setTeacher(mapTeacher(data))
            setLastRefresh(new Date())
        } catch {
            addToastRef.current('Gagal memuat data guru', 'error')
            onBackRef.current()
        } finally {
            setLoading(false)
        }
    }, [teacherId])

    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; loading is set synchronously by design
    useEffect(() => { fetchTeacher() }, [fetchTeacher])

    /* ── Handlers ── */
    const handleCopyPhone = useCallback(() => {
        if (!teacher?.phone) return
        navigator.clipboard.writeText(teacher.phone)
            .then(() => { setCopiedPhone(true); setTimeout(() => setCopiedPhone(false), 2000) })
            .catch(() => addToast('Gagal menyalin nomor', 'error'))
    }, [teacher, addToast])

    const handleRefresh = useCallback(() => {
        fetchTeacher()
        addToast('Data diperbarui', 'info')
    }, [fetchTeacher, addToast])

    const handleToggleActive = useCallback(async () => {
        if (!teacher || saving) return
        const newActive = !teacher.is_active
        setTeacher(prev => prev ? { ...prev, is_active: newActive, status: newActive ? 'active' : 'inactive' } : prev)
        setSaving(true)
        try {
            const { error } = await supabase.from('teachers').update({ is_active: newActive }).eq('id', teacher.id)
            if (error) throw error
            addToast(newActive ? 'Guru diaktifkan' : 'Guru dinonaktifkan', 'success')
            logAudit({ action: 'UPDATE', source: 'MASTER', tableName: 'teachers', recordId: teacher.id, oldData: teacher, newData: { ...teacher, is_active: newActive } }).catch(() => {})
        } catch (err) {
            setTeacher(prev => prev ? { ...prev, is_active: teacher.is_active, status: teacher.status } : prev)
            addToast(err?.message || 'Gagal mengubah status', 'error')
        } finally {
            setSaving(false)
        }
    }, [teacher, saving, addToast])

    const handleToggleLock = useCallback(async () => {
        if (!teacher || saving) return
        const newStatus = !teacher.is_locked
        const updatePayload = newStatus
            ? { is_locked: true, locked_at: new Date().toISOString(), locked_by: profile?.id ?? null }
            : { is_locked: false, locked_at: null, locked_by: null }
        setTeacher(prev => prev ? { ...prev, ...updatePayload } : prev)
        setSaving(true)
        try {
            const { error } = await supabase.from('teachers').update(updatePayload).eq('id', teacher.id)
            if (error) throw error
            addToast(newStatus ? 'Guru dikunci' : 'Kunci guru dibuka', 'success')
            logAudit({ action: 'UPDATE', source: 'MASTER', tableName: 'teachers', recordId: teacher.id, oldData: teacher, newData: { ...teacher, ...updatePayload } }).catch(() => {})
        } catch (err) {
            setTeacher(prev => prev ? { ...prev, is_locked: teacher.is_locked, locked_at: teacher.locked_at, locked_by: teacher.locked_by } : prev)
            addToast(err?.message || 'Gagal mengubah kunci', 'error')
        } finally {
            setSaving(false)
        }
    }, [teacher, saving, addToast, profile])

    const handleDeleteConfirm = useCallback(async () => {
        if (!teacher || deleting) return
        setDeleting(true)
        try {
            const { error } = await supabase.from('teachers').update({ deleted_at: new Date().toISOString() }).eq('id', teacher.id)
            if (error) throw error
            addToast('Guru berhasil diarsipkan', 'success')
            logAudit({ action: 'UPDATE', source: 'MASTER', tableName: 'teachers', recordId: teacher.id, oldData: teacher, newData: { ...teacher, deleted_at: new Date().toISOString() } }).catch(() => {})
            onBack()
        } catch (err) {
            addToast(err?.message || 'Gagal mengarsipkan', 'error')
        } finally {
            setDeleting(false)
            setIsDeleteOpen(false)
        }
    }, [teacher, deleting, addToast, onBack])

    const handleEdit = useCallback(() => setIsFormOpen(true), [])

    const handleSubmitEdit = useCallback(async (payload) => {
        if (!teacher || saving) return
        setSaving(true)
        try {
            const dbPayload = {
                full_name: payload.name || payload.full_name,
                subject: payload.subject || null,
                gender: payload.gender || null,
                phone: payload.phone || null,
                type: Array.isArray(payload.type) && payload.type.length ? payload.type : ['guru'],
                is_active: payload.status === 'active',
            }
            const { error } = await supabase.from('teachers').update(dbPayload).eq('id', teacher.id)
            if (error) throw error
            addToast('Data guru berhasil diupdate', 'success')
            try { await logAudit({ action: 'UPDATE', source: 'MASTER', tableName: 'teachers', recordId: teacher.id, oldData: teacher, newData: { ...teacher, ...dbPayload } }) } catch { /* audit logging is best-effort */ }
            setIsFormOpen(false)
            fetchTeacher()
            return null
        } catch (err) {
            return { error: true, code: err.code, message: 'Gagal menyimpan data.' }
        } finally {
            setSaving(false)
        }
    }, [teacher, saving, addToast, fetchTeacher])

    const goBack = useCallback(() => onBack(), [onBack])
    const handlePrint = useCallback(() => window.print(), [])
    const handlePrintRef = useRef(handlePrint)
    useEffect(() => { handlePrintRef.current = handlePrint }, [handlePrint])

    const handleEditRef = useRef(handleEdit)
    const handleToggleLockRef = useRef(handleToggleLock)
    const goBackRef = useRef(goBack)
    useEffect(() => { handleEditRef.current = handleEdit }, [handleEdit])
    useEffect(() => { handleToggleLockRef.current = handleToggleLock }, [handleToggleLock])
    useEffect(() => { goBackRef.current = goBack }, [goBack])

    /* ── Keyboard shortcuts ── */
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
            if (e.key === 'Escape') { e.preventDefault(); goBackRef.current() }
            else if ((e.key === 'e' || e.key === 'E') && !e.ctrlKey && !e.metaKey) { e.preventDefault(); handleEditRef.current() }
            else if ((e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.metaKey) { e.preventDefault(); handleToggleLockRef.current() }
            else if ((e.key === 'p' || e.key === 'P') && !e.ctrlKey && !e.metaKey) { e.preventDefault(); handlePrintRef.current() }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    /* ── Loading ── */
    if (loading) {
        return (
            <div className="-mx-4 sm:-mx-5 lg:-mx-6 -mt-4 lg:-mt-6">
                <div className="px-5 pt-5 pb-3">
                    <div className="flex items-center gap-2 mb-3">
                        <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
                        <Skeleton className="h-3 w-64 rounded" />
                    </div>
                    <Skeleton className="h-7 w-56 rounded-lg" />
                </div>
                <div className="px-5 pb-5"><DetailSkeleton /></div>
            </div>
        )
    }

    if (!teacher) return null

    /* ── Derived ── */
    const genderInfo = teacher.gender === 'L' ? { label: 'Laki-laki', icon: GenderMale, color: 'text-sky-500' } : teacher.gender === 'P' ? { label: 'Perempuan', icon: GenderFemale, color: 'text-pink-500' } : null
    const types = Array.isArray(teacher.type) ? teacher.type : teacher.type ? [teacher.type] : []

    /* ── Render ── */
    return (
        <div className="-mx-4 sm:-mx-5 lg:-mx-6 -mt-4 lg:-mt-6">
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none !important; }
                }
            `}</style>

            {/* ── Page Header ── */}
            <div className="px-5 pt-5 pb-3 no-print">
                <div className="flex items-center gap-2 mb-3">
                    <button onClick={goBack}
                        className="h-7 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-1 text-[10px] font-black text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-all shrink-0"
                        title="Kembali ke Data Guru (Esc)">
                        <CaretLeft className="w-3.5 h-3.5" />
                        <span>Data Guru</span>
                    </button>
                    {lastRefresh && (
                        <span className="text-[8px] font-bold text-[var(--color-text-muted)] ml-1">
                            Diperbarui <PrivacyMask active={isPrivacyMode}>{(() => {
                                // eslint-disable-next-line react-hooks/purity -- relative "time ago" label intentionally reads the clock during render
                                const ms = Date.now() - lastRefresh.getTime()
                                const mins = Math.floor(ms / 60000)
                                if (mins < 1) return 'baru saja'
                                if (mins < 60) return `${mins}m lalu`
                                return `${Math.floor(mins / 60)}j lalu`
                            })()}</PrivacyMask>
                        </span>
                    )}
                </div>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-black font-heading tracking-tight text-[var(--color-text)] leading-tight">
                            Detail Guru
                        </h1>
                        <p className="text-[var(--color-text-muted)] text-[10px] mt-0.5 font-medium">
                            <PrivacyMask active={isPrivacyMode}>{teacher.name}</PrivacyMask> — informasi lengkap kepegawaian & kontak.
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 min-w-0 overflow-x-auto scrollbar-hide lg:shrink-0 -mx-5 px-5 lg:mx-0 lg:px-0 py-0.5">
                        <Tooltip content={!editable ? 'Akses terbatas' : teacher.is_locked ? 'Buka kunci terlebih dahulu' : 'Edit (E)'} position="bottom">
                            <button onClick={handleEdit} disabled={!editable || teacher.is_locked}
                                className="h-8 px-3 rounded-lg bg-[var(--color-primary)] text-white flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-[var(--color-primary)]/20 disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                        </Tooltip>
                        <Tooltip content={!editable ? 'Akses terbatas' : teacher.is_active ? 'Nonaktifkan' : 'Aktifkan'} position="bottom">
                            <button onClick={handleToggleActive} disabled={!editable || teacher.is_locked || saving}
                                className="h-8 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-1.5 transition-all hover:bg-[var(--color-surface-alt)] disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                                {teacher.is_active ? <Prohibit className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            </button>
                        </Tooltip>
                        <Tooltip content={!editable ? 'Akses terbatas' : teacher.is_locked ? 'Buka Kunci (L)' : 'Kunci (L)'} position="bottom">
                            <button onClick={handleToggleLock} disabled={!editable || saving}
                                className={`h-8 px-3 rounded-lg border flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 ${
                                    teacher.is_locked
                                        ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                        : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)]'
                                }`}>
                                {teacher.is_locked ? <LockOpen className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            </button>
                        </Tooltip>
                        <Tooltip content={!editable ? 'Akses terbatas' : 'Arsipkan'} position="bottom">
                            <button onClick={() => setIsDeleteOpen(true)} disabled={!editable || teacher.is_locked || saving}
                                className="h-8 px-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 flex items-center gap-1.5 transition-all hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                                <Archive className="w-3.5 h-3.5" />
                            </button>
                        </Tooltip>
                        <div className="w-px h-5 bg-[var(--color-border)] mx-0.5 shrink-0" />
                        <Tooltip content="Muat ulang data" position="bottom">
                            <button onClick={handleRefresh}
                                className="h-8 w-8 rounded-lg border bg-[var(--color-surface-alt)] border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all shrink-0">
                                <ArrowClockwise className="w-3.5 h-3.5" />
                            </button>
                        </Tooltip>
                        <Tooltip content={isPrivacyMode ? 'Matikan Mode Privasi' : 'Aktifkan Mode Privasi'} position="bottom">
                            <button onClick={togglePrivacyMode}
                                className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all shrink-0 ${isPrivacyMode ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : 'bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}>
                                {isPrivacyMode ? <EyeSlash className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                        </Tooltip>
                        <div className="w-px h-5 bg-[var(--color-border)] mx-0.5 shrink-0 hidden sm:block" />
                        <Tooltip content="Cetak (P)" position="bottom">
                            <button onClick={handlePrint}
                                className="h-8 w-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center transition-all hover:bg-[var(--color-surface-alt)] shrink-0">
                                <Printer className="w-3.5 h-3.5" />
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </div>

            <div className="px-5 pb-5 print-area">
                <div className="space-y-4">
                    {/* ── Profile Card ── */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-primary)]/90 to-[var(--color-accent)]/80 p-5 text-white shadow-xl">
                        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
                        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-white/5" />

                        <div className="relative flex items-center gap-4 sm:gap-5">
                            <div className="relative shrink-0">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 p-0.5 flex items-center justify-center text-xl sm:text-2xl font-black overflow-hidden shadow-lg">
                                    <span className="drop-shadow-lg">{teacher.name?.charAt(0) || '?'}</span>
                                </div>
                                <div className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg text-[8px] font-black shadow-lg border border-white/20 backdrop-blur-sm ${STATUS_CONFIG[teacher.status]?.color || 'bg-white/20 text-white'}`}>
                                    {STATUS_CONFIG[teacher.status]?.label || teacher.status}
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg sm:text-xl font-black tracking-tight leading-tight drop-shadow-lg">
                                    <PrivacyMask active={isPrivacyMode}>{teacher.name}</PrivacyMask>
                                </h2>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {types.map(t => (
                                        <span key={t} className="px-2 py-0.5 rounded-md bg-white/15 backdrop-blur-sm text-[9px] font-bold uppercase tracking-wider border border-white/10">
                                            <PrivacyMask active={isPrivacyMode}>{TYPE_LABELS[t] || t}</PrivacyMask>
                                        </span>
                                    ))}
                                    {teacher.subject && (
                                        <span className="px-2 py-0.5 rounded-md bg-emerald-400/20 backdrop-blur-sm text-[9px] font-bold uppercase tracking-wider border border-emerald-400/20 text-emerald-100">
                                            <PrivacyMask active={isPrivacyMode}>{teacher.subject}</PrivacyMask>
                                        </span>
                                    )}
                                </div>
                                {teacher.created_at && (
                                    <p className="text-[10px] text-white/50 mt-2.5 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-white/40" />
                                        Bergabung sejak <PrivacyMask active={isPrivacyMode}>{formatDate(teacher.created_at)}</PrivacyMask>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Lock Info Alert */}
                    {teacher.is_locked && (
                        <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-200 bg-amber-50">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                                <Lock className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-black text-amber-800 mb-0.5">Guru Terkunci</p>
                                <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                                    Dikunci pada {formatDate(teacher.locked_at)}
                                </p>
                                <p className="text-[10px] text-amber-600 font-medium mt-1">
                                    Data tidak dapat diedit atau diubah statusnya selama terkunci.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── Tabs ── */}
                    <div className="flex gap-6 border-b border-[var(--color-border)] no-print">
                        {[
                            { key: 'info', label: 'Info', icon: IdentificationCard },
                            ...(isAdmin ? [                            { key: 'audit', label: 'Riwayat', icon: ClockCounterClockwise }] : []),
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setProfileTab(tab.key)}
                                className={`flex items-center gap-1.5 pb-3 text-[11px] font-bold border-b-2 transition-all ${
                                    profileTab === tab.key
                                        ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                                        : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                                }`}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {profileTab === 'info' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Identitas */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                <SectionCard icon={IdentificationCard} iconBg="text-indigo-500" accent="bg-indigo-500" title="Identitas">
                                    <div className="space-y-4">
                                        <InfoRow label="Nama Lengkap" value={teacher.name} hint="Klik Edit" isPrivacyMode={isPrivacyMode} />
                                        <InfoRow label="Jenis Kelamin" value={genderInfo?.label} hint="Pilih di form Edit" isPrivacyMode={isPrivacyMode} />
                                        <InfoRow label="Jabatan" value={types.map(t => TYPE_LABELS[t] || t).join(', ') || 'Guru'} hint="Klik Edit" isPrivacyMode={isPrivacyMode} />
                                    </div>
                                </SectionCard>

                                <SectionCard icon={Briefcase} iconBg="text-emerald-500" accent="bg-emerald-500" title="Kepegawaian">
                                    <div className="space-y-4">
                                        <InfoRow label="Mata Pelajaran" value={teacher.subject} hint="Pilih di form Edit" isPrivacyMode={isPrivacyMode} />
                                        <InfoRow label="Status" value={STATUS_CONFIG[teacher.status]?.label || teacher.status} isPrivacyMode={isPrivacyMode} />
                                        <InfoRow label="Bergabung" value={teacher.created_at ? formatDate(teacher.created_at) : null} isPrivacyMode={isPrivacyMode} />
                                    </div>
                                </SectionCard>

                                <SectionCard icon={ChatCircle} iconBg="text-emerald-500" accent="bg-emerald-500" title="WhatsApp">
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase text-[var(--color-text-muted)] tracking-widest mb-1 opacity-80">
                                                No. HP / WhatsApp
                                            </p>
                                            <p className="text-[15px] font-bold text-[var(--color-text)] tracking-wider">
                                                {teacher.phone ? (
                                                    <PrivacyMask active={isPrivacyMode}>{teacher.phone}</PrivacyMask>
                                                ) : '---'}
                                            </p>
                                        </div>
                                        {teacher.phone && (() => {
                                            const digits = teacher.phone.replace(/\D/g, '')
                                            const isValid = digits.length >= 10
                                            const waNumber = digits.startsWith('62') ? digits : digits.replace(/^0/, '62')
                                            return (
                                                <div className="flex gap-2">
                                                    <button onClick={handleCopyPhone} className="h-9 px-3 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] flex items-center gap-1.5 text-[10px] font-bold hover:bg-[var(--color-border)] transition-colors">
                                                        {copiedPhone ? <span className="text-emerald-500 font-black">Tersalin</span> : <><Copy className="w-3.5 h-3.5 opacity-40" /> Salin</>}
                                                    </button>
                                                    {isValid && (
                                                        <a
                                                            href={`https://wa.me/${waNumber}`}
                                                            target="_blank" rel="noopener noreferrer"
                                                            className="h-9 px-4 rounded-xl bg-emerald-500 text-white flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-sm"
                                                        >
                                                            <ChatCircle className="w-3.5 h-3.5" /> WhatsApp
                                                        </a>
                                                    )}
                                                </div>
                                            )
                                        })()}
                                        {teacher.updated_at && (
                                            <p className="text-[9px] text-[var(--color-text-muted)] opacity-50">
                                                Terakhir diperbarui <PrivacyMask active={isPrivacyMode}>{formatDate(teacher.updated_at)}</PrivacyMask>
                                            </p>
                                        )}
                                    </div>
                                </SectionCard>
                            </div>
                        </div>
                    )}

                    {profileTab === 'audit' && isAdmin && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
                            <div className="flex items-center gap-2">
                                <ClockCounterClockwise className="w-4 h-4 text-purple-500" />
                                <h3 className="text-xs font-black text-[var(--color-text)]">Riwayat Perubahan</h3>
                            </div>
                            <div className="h-[300px] overflow-auto rounded-xl border border-[var(--color-border)]">
                                <AuditTimeline
                                    tableName="teachers"
                                    recordId={teacher.id}
                                    onRestored={fetchTeacher}
                                    showSearch
                                    stickyHeader
                                    limit={30}
                                    containerClassName="p-3"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Edit Modal ── */}
            <TeacherFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                selectedItem={teacher}
                subjectsList={subjectsList}
                onSubmit={handleSubmitEdit}
                submitting={saving}
            />

            {/* ── Archive Confirm ── */}
            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Arsipkan Guru"
                description="Yakin ingin mengarsipkan guru ini?"
                icon={Archive}
                iconBg="bg-amber-500/10"
                iconColor="text-amber-500"
                confirmText="Arsipkan"
                confirmIcon={Archive}
                confirmColor="amber"
                submitting={deleting}
            >
                <p className="text-[11px] font-bold text-[var(--color-text-muted)] leading-relaxed">
                    Guru <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 font-black mx-0.5">{teacher.name}</span> akan dipindahkan ke arsip. Anda dapat memulihkannya nanti.
                </p>
            </ConfirmDialog>
        </div>
    )
}
