import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Calendar, CaretLeft, CaretRight, CheckCircle, ClockCounterClockwise,
    Buildings, Users, Lock, LockOpen, Pencil, Archive,
    Fingerprint, Eye, EyeSlash, Copy,
    Timer, CalendarCheck, Hourglass, UserCircle, Info, TrendUp,
    ArrowLeft, ArrowRight, ArrowClockwise, Notepad, ListChecks,
    Warning, CheckFat,
} from '@phosphor-icons/react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { supabase } from '@lib/supabase'
import { useFlag } from '@context/FeatureFlags'
import { useToast } from '@context/Toast'
import { useAuth } from '@context/Auth'
import { usePrivacyMode } from '@shared/hooks/usePrivacyMode'
import { logAudit } from '@utils/auditLogger'
import {
    Badge, Breadcrumb, Alert, AuditTimeline, ConfirmDialog, Skeleton, Tooltip,
} from '@shared/components'
import PeriodFormModal from '@features/periods/components/PeriodFormModal'
import { ArchiveModal } from '@features/periods/components/PeriodConfirmModals'

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function formatDate(dateStr) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return (
        d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) +
        ', ' +
        d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    )
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

function getDaysElapsed(start) {
    if (!start) return 0
    const s = new Date(start)
    const now = new Date()
    if (now < s) return 0
    return Math.floor((now - s) / (1000 * 60 * 60 * 24))
}

function getDaysRemaining(end) {
    if (!end) return 0
    const e = new Date(end)
    const now = new Date()
    if (now > e) return 0
    return Math.ceil((e - now) / (1000 * 60 * 60 * 24))
}

function getTotalDays(start, end) {
    if (!start || !end) return 0
    return Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24))
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

function getProgressColor(pct) {
    if (pct >= 100) return '#ef4444'
    if (pct >= 80) return '#f59e0b'
    return '#10b981'
}

function getProgressBadgeClass(pct) {
    if (pct >= 100) return 'bg-red-500/10 text-red-600'
    if (pct >= 80) return 'bg-amber-500/10 text-amber-600'
    return 'bg-emerald-500/10 text-emerald-600'
}

function getGradeStyle(grade) {
    if (!grade) return { bg: 'bg-zinc-500/10', text: 'text-zinc-500' }
    const g = grade.toString().toUpperCase().trim()
    if (g === 'XII' || g === '12') return { bg: 'bg-emerald-500/10', text: 'text-emerald-600' }
    if (g === 'XI'  || g === '11') return { bg: 'bg-purple-500/10',  text: 'text-purple-600'  }
    if (g === 'X'   || g === '10') return { bg: 'bg-blue-500/10',    text: 'text-blue-600'    }
    return { bg: 'bg-zinc-500/10', text: 'text-zinc-500' }
}

function getGradeBarColor(grade) {
    const g = (grade || '').toString().toUpperCase().trim()
    if (g === 'XII' || g === '12') return '#10b981'
    if (g === 'XI'  || g === '11') return '#a855f7'
    if (g === 'X'   || g === '10') return '#3b82f6'
    return '#71717a'
}

const TIME_STATUS_CONFIG = {
    running:  { label: 'Sedang Berjalan', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', accent: 'from-emerald-500 to-teal-400',    dot: true  },
    upcoming: { label: 'Akan Datang',     color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',         accent: 'from-blue-500 to-indigo-400',       dot: false },
    ended:    { label: 'Sudah Berakhir',  color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',          accent: 'from-zinc-400 to-zinc-300',          dot: false },
    unknown:  { label: 'Tidak Diketahui', color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',          accent: 'from-zinc-400 to-zinc-300',          dot: false },
}

/* ─── Sub-components ───────────────────────────────────────────────────────── */

function ProgressRing({ value, size = 80, strokeWidth = 7, color }) {
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (value / 100) * circumference
    const fillColor = color || getProgressColor(value)

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="var(--color-surface-alt)"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={fillColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-700"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-black text-[var(--color-text)]">{Math.round(value)}%</span>
            </div>
        </div>
    )
}

function LifecycleTimeline({ period }) {
    const steps = [
        { label: 'Dibuat', done: true, icon: Notepad },
        { label: 'Aktif',  done: period.is_active, icon: CheckFat },
        { label: 'Terkunci', done: period.is_locked, icon: Lock },
        { label: 'Berakhir', done: getTimeStatus(period.start_date, period.end_date) === 'ended', icon: CalendarCheck },
    ]

    return (
        <div className="flex items-center gap-0 w-full">
            {steps.map((step, i) => {
                const Icon = step.icon
                return (
                    <React.Fragment key={step.label}>
                        <div className="flex flex-col items-center gap-1.5 min-w-0">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                step.done
                                    ? 'bg-emerald-500/15 text-emerald-600'
                                    : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]'
                            }`}>
                                <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-widest whitespace-nowrap ${
                                step.done ? 'text-emerald-600' : 'text-[var(--color-text-muted)]'
                            }`}>
                                {step.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`flex-1 h-[2px] mx-1 mt-[-14px] rounded-full ${
                                step.done && steps[i + 1].done ? 'bg-emerald-500' :
                                step.done ? 'bg-gradient-to-r from-emerald-500 to-[var(--color-surface-alt)]' :
                                'bg-[var(--color-surface-alt)]'
                            }`} />
                        )}
                    </React.Fragment>
                )
            })}
        </div>
    )
}

function GradeDistributionBar({ classList }) {
    const dist = useMemo(() => {
        const map = {}
        classList.forEach(c => {
            const g = (c.grade || 'Lainnya').toString().toUpperCase().trim()
            map[g] = (map[g] || 0) + 1
        })
        return Object.entries(map).sort(([a], [b]) => {
            const order = { 'XII': 0, '12': 0, 'XI': 1, '11': 1, 'X': 2, '10': 2 }
            return (order[a] ?? 99) - (order[b] ?? 99)
        })
    }, [classList])

    if (dist.length === 0) return null

    return (
        <div className="flex flex-wrap gap-2 mt-2">
            {dist.map(([grade, count]) => (
                <span
                    key={grade}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border"
                    style={{
                        backgroundColor: `${getGradeBarColor(grade)}10`,
                        color: getGradeBarColor(grade),
                        borderColor: `${getGradeBarColor(grade)}20`,
                    }}
                >
                    {grade}: {count} kelas
                </span>
            ))}
        </div>
    )
}

function MiniStudentChart({ classList }) {
    if (!classList || classList.length === 0) return null
    const data = classList.slice(0, 10).map(c => ({
        name: c.name?.length > 10 ? c.name.slice(0, 10) + '…' : c.name,
        siswa: c.studentCount || 0,
        fill: getGradeBarColor(c.grade),
    }))
    const maxVal = Math.max(...data.map(d => d.siswa), 1)

    return (
        <div className="space-y-1.5">
            {data.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-[var(--color-text-muted)] w-16 truncate shrink-0">{d.name}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${(d.siswa / maxVal) * 100}%`, backgroundColor: d.fill }}
                        />
                    </div>
                    <span className="text-[9px] font-black text-[var(--color-text)] w-6 text-right shrink-0">{d.siswa}</span>
                </div>
            ))}
        </div>
    )
}

/* ─── Skeleton ─────────────────────────────────────────────────────────────── */

function DetailSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
                        <div className="h-1 bg-[var(--color-surface-alt)] w-full" />
                        <div className="p-5 space-y-4">
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
                                {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
                            </div>
                            <Skeleton className="h-10 rounded-xl" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
                    </div>
                    <div className="flex gap-2">
                        {[1,2,3,4].map(i => <Skeleton key={i} className="h-9 w-24 rounded-xl" />)}
                    </div>
                    <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
                        <Skeleton className="h-4 w-32 rounded" />
                        <div className="space-y-2">
                            {[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
                        <Skeleton className="h-4 w-32 rounded" />
                        <Skeleton className="h-24 rounded-xl" />
                        <Skeleton className="h-20 rounded-xl" />
                    </div>
                    <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
                        <Skeleton className="h-4 w-32 rounded" />
                        <Skeleton className="h-24 rounded-xl" />
                        <div className="space-y-2">
                            {[1,2,3,4].map(i => <Skeleton key={i} className="h-6 rounded" />)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ─── Main Component ───────────────────────────────────────────────────────── */

export default function PeriodDetailPanel({ periodId, onBack }) {
    const navigate = useNavigate()
    const { addToast } = useToast()
    const { enabled: canEdit } = useFlag('access.teacher_academic')
    const { profile } = useAuth()
    const { isPrivacyMode, togglePrivacyMode, maskValue } = usePrivacyMode()

    const addToastRef = useRef(addToast)
    const onBackRef = useRef(onBack)
    useEffect(() => { addToastRef.current = addToast }, [addToast])
    useEffect(() => { onBackRef.current = onBack }, [onBack])

    const [period, setPeriod] = useState(null)
    const [loading, setLoading] = useState(true)
    const [usageStats, setUsageStats] = useState(null)
    const [classList, setClassList] = useState([])
    const [lockedByUser, setLockedByUser] = useState(null)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [copiedId, setCopiedId] = useState(false)
    const [lastRefresh, setLastRefresh] = useState(null)
    const [copiedSummary, setCopiedSummary] = useState(false)
    const [notes, setNotes] = useState('')
    const [isNotesEditing, setIsNotesEditing] = useState(false)
    const [neighborPeriods, setNeighborPeriods] = useState({ prev: null, next: null })
    const [overlapWarning, setOverlapWarning] = useState(null)

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)

    /* ── Fetch ── */
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
                addToastRef.current('Periode tidak ditemukan', 'error')
                onBackRef.current()
                return
            }
            setPeriod(data)
            setNotes(data.notes || '')
            setLastRefresh(new Date())

            // Fetch locked-by user name
            if (data.locked_by) {
                try {
                    const { data: lockUser } = await supabase
                        .from('profiles')
                        .select('full_name, email')
                        .eq('id', data.locked_by)
                        .single()
                    setLockedByUser(lockUser ?? null)
                } catch {
                    setLockedByUser(null)
                }
            } else {
                setLockedByUser(null)
            }

            // Fetch classes
            const { data: cls } = await supabase
                .from('classes')
                .select('id, name, grade, major')
                .eq('academic_year_id', periodId)
                .order('grade')
                .order('name')
            const classCount = cls?.length || 0

            let studentCount = 0
            let classListWithCounts = cls || []

            if (classCount > 0) {
                const classIds = cls.map(c => c.id)
                const { data: studentData } = await supabase
                    .from('students')
                    .select('class_id')
                    .in('class_id', classIds)
                    .is('deleted_at', null)

                const countMap = {}
                studentData?.forEach(s => {
                    countMap[s.class_id] = (countMap[s.class_id] || 0) + 1
                })
                studentCount = studentData?.length || 0
                classListWithCounts = cls.map(c => ({ ...c, studentCount: countMap[c.id] || 0 }))
            }

            setClassList(classListWithCounts)
            setUsageStats({ classCount, studentCount })

            // Fetch neighboring periods
            try {
                const { data: allPeriods } = await supabase
                    .from('periods')
                    .select('id, academic_year, semester, start_date, end_date, is_active, is_locked')
                    .is('deleted_at', null)
                    .order('start_date', { ascending: true })

                if (allPeriods && allPeriods.length > 1) {
                    const idx = allPeriods.findIndex(p => p.id === periodId)
                    setNeighborPeriods({
                        prev: idx > 0 ? allPeriods[idx - 1] : null,
                        next: idx < allPeriods.length - 1 ? allPeriods[idx + 1] : null,
                    })
                } else {
                    setNeighborPeriods({ prev: null, next: null })
                }
            } catch {
                setNeighborPeriods({ prev: null, next: null })
            }

            // Check overlapping active periods
            try {
                const { data: activePeriods } = await supabase
                    .from('periods')
                    .select('id, academic_year, semester, start_date, end_date')
                    .eq('is_active', true)
                    .is('deleted_at', null)

                if (activePeriods && activePeriods.length > 1) {
                    const overlaps = activePeriods.filter(p => p.id !== periodId)
                    if (overlaps.length > 0) {
                        setOverlapWarning(overlaps)
                    } else {
                        setOverlapWarning(null)
                    }
                } else {
                    setOverlapWarning(null)
                }
            } catch {
                setOverlapWarning(null)
            }
        } catch {
            addToastRef.current('Gagal memuat data periode', 'error')
            onBackRef.current()
        } finally {
            setLoading(false)
        }
    }, [periodId])

    useEffect(() => { fetchPeriod() }, [fetchPeriod])

    /* ── Handlers ── */
    const handleCopyId = useCallback(() => {
        if (!period) return
        navigator.clipboard.writeText(period.id)
            .then(() => { setCopiedId(true); setTimeout(() => setCopiedId(false), 2000) })
            .catch(() => addToast('Gagal menyalin ID', 'error'))
    }, [period, addToast])

    const handleCopySummary = useCallback(() => {
        if (!period) return
        const timeSt = getTimeStatus(period.start_date, period.end_date)
        const statusLabel = TIME_STATUS_CONFIG[timeSt]?.label || '-'
        const summary = [
            `Periode: ${period.academic_year} ${period.semester}`,
            `Status: ${period.is_active ? 'Aktif' : 'Tidak Aktif'} · ${statusLabel}`,
            `Periode terkunci: ${period.is_locked ? 'Ya' : 'Tidak'}`,
            `Tanggal: ${formatDate(period.start_date)} – ${formatDate(period.end_date)}`,
            `Durasi: ${getDuration(period.start_date, period.end_date)}`,
            `Kelas: ${usageStats?.classCount || 0} · Siswa: ${usageStats?.studentCount || 0}`,
            `Rata-rata siswa/kelas: ${usageStats?.classCount > 0 ? Math.round(usageStats.studentCount / usageStats.classCount) : 0}`,
            `Dibuat: ${formatDateTime(period.created_at)}`,
            period.updated_at ? `Diperbarui: ${formatDateTime(period.updated_at)}` : '',
        ].filter(Boolean).join('\n')
        navigator.clipboard.writeText(summary)
            .then(() => { setCopiedSummary(true); setTimeout(() => setCopiedSummary(false), 2000) })
            .catch(() => addToast('Gagal menyalin ringkasan', 'error'))
    }, [period, usageStats, addToast])

    const handleSaveNotes = useCallback(async () => {
        if (!period) return
        try {
            const { error } = await supabase.from('periods').update({ notes }).eq('id', period.id)
            if (error) throw error
            setPeriod(prev => prev ? { ...prev, notes } : prev)
            setIsNotesEditing(false)
            addToast('Catatan disimpan', 'success')
        } catch {
            addToast('Gagal menyimpan catatan', 'error')
        }
    }, [period, notes, addToast])

    const handleRefresh = useCallback(() => {
        fetchPeriod()
        addToast('Data diperbarui', 'info')
    }, [fetchPeriod, addToast])

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
        if (!formData.name.trim())  errors.name      = 'Nama tahun pelajaran wajib diisi'
        if (!formData.startDate)    errors.startDate = 'Tanggal mulai wajib diisi'
        if (!formData.endDate)      errors.endDate   = 'Tanggal selesai wajib diisi'
        if (formData.startDate && formData.endDate && formData.endDate <= formData.startDate)
            errors.endDate = 'Tanggal selesai harus setelah tanggal mulai'
        if (Object.keys(errors).length > 0) { setFormErrors(errors); setSaving(false); return }
        try {
            const payload = {
                academic_year: formData.name.trim(),
                semester:      String(formData.semester || '').trim(),
                start_date:    formData.startDate,
                end_date:      formData.endDate,
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
            try { await logAudit({ action: 'UPDATE', source: 'MASTER', tableName: 'periods', recordId: period.id, oldData: period, newData: { ...period, ...payload } }) } catch { /* skip */ }
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
            try { await logAudit({ action: 'UPDATE', source: 'MASTER', tableName: 'periods', recordId: period.id, oldData: period, newData: { ...period, deleted_at: new Date().toISOString() } }) } catch { /* skip */ }
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
            ? { is_locked: true,  locked_at: new Date().toISOString(), locked_by: profile?.id ?? null }
            : { is_locked: false, locked_at: null,                     locked_by: null }
        setPeriod(prev => prev ? { ...prev, ...updatePayload } : prev)
        setSaving(true)
        try {
            const { error } = await supabase.from('periods').update(updatePayload).eq('id', period.id)
            if (error) throw error
            addToast(newStatus ? 'Periode dikunci' : 'Kunci periode dibuka', 'success')
            try { await logAudit({ action: 'UPDATE', source: 'MASTER', tableName: 'periods', recordId: period.id, oldData: period, newData: { ...period, ...updatePayload } }) } catch { /* skip */ }
            fetchPeriod()
        } catch (err) {
            setPeriod(prev => prev ? { ...prev, ...period } : prev)
            addToast(err?.message || 'Gagal mengubah kunci', 'error')
        } finally {
            setSaving(false)
        }
    }, [period, saving, addToast, profile, fetchPeriod])

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
            try { await logAudit({ action: 'UPDATE', source: 'MASTER', tableName: 'periods', recordId: period.id, oldData: period, newData: { ...period, is_active: newActive } }) } catch { /* skip */ }
        } catch (err) {
            setPeriod(prev => prev ? { ...prev, is_active: period.is_active } : prev)
            addToast(err?.message || 'Gagal mengubah status', 'error')
        } finally {
            setSaving(false)
        }
    }, [period, saving, addToast])

    const goBack = useCallback(() => onBack(), [onBack])

    const handleEditRef = useRef(handleEdit)
    const handleToggleLockRef = useRef(handleToggleLock)
    const goBackRef = useRef(goBack)
    useEffect(() => { handleEditRef.current = handleEdit }, [handleEdit])
    useEffect(() => { handleToggleLockRef.current = handleToggleLock }, [handleToggleLock])
    useEffect(() => { goBackRef.current = goBack }, [goBack])

    /* ── Keyboard shortcuts (runs once) ── */
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
            if (e.key === 'Escape') {
                e.preventDefault()
                goBackRef.current()
            } else if (e.key === 'e' || e.key === 'E') {
                if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault()
                    handleEditRef.current()
                }
            } else if (e.key === 'l' || e.key === 'L') {
                if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault()
                    handleToggleLockRef.current()
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    /* ── Loading ── */
    if (loading) {
        return (
        <div className="flex flex-col h-[calc(100vh-3.5rem)] -mx-4 sm:-mx-5 lg:-mx-6 -mt-4 lg:-mt-6 overflow-hidden">
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

    /* ── Derived values ── */
    const timeStatus = getTimeStatus(period.start_date, period.end_date)
    const tsc        = TIME_STATUS_CONFIG[timeStatus]

    const nowMs    = Date.now()
    const startMs  = period.start_date ? new Date(period.start_date).getTime() : 0
    const endMs    = period.end_date   ? new Date(period.end_date).getTime()   : 0
    const progressPct = (startMs && endMs)
        ? Math.min(100, Math.max(0, ((nowMs - startMs) / (endMs - startMs)) * 100))
        : 0

    const daysElapsed   = getDaysElapsed(period.start_date)
    const daysRemaining = getDaysRemaining(period.end_date)
    const totalDays     = getTotalDays(period.start_date, period.end_date)
    const avgStudents   = (usageStats?.classCount > 0)
        ? Math.round(usageStats.studentCount / usageStats.classCount)
        : 0

    const ringColor = getProgressColor(progressPct)

    /* ── Render ── */
    return (
            <div className="flex flex-col h-[calc(100vh-3.5rem)] -mx-4 sm:-mx-5 lg:-mx-6 -mt-4 lg:-mt-6 overflow-hidden">

            {/* ── Page Header ── */}
            <div className="px-5 pt-5 pb-3 shrink-0">
                <div className="flex items-center gap-2 mb-3">
                    <button
                        onClick={goBack}
                        className="h-7 w-7 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-all shrink-0"
                        title="Kembali (Esc)"
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
                        {/* Refresh */}
                        <Tooltip content="Muat ulang data" position="bottom">
                            <button
                                onClick={handleRefresh}
                                className="h-8 w-8 rounded-lg border bg-[var(--color-surface-alt)] border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all"
                            >
                                <ArrowClockwise className="w-3.5 h-3.5" />
                            </button>
                        </Tooltip>
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
                            {lastRefresh && (
                                <span className="text-[8px] font-bold text-[var(--color-text-muted)] hidden sm:inline">
                                    {Math.round((nowMs - lastRefresh.getTime()) / 60000) || '< 1'}m lalu
                                </span>
                            )}
                    </div>
                </div>
                <div>
                    <h1 className="text-xl font-black font-heading tracking-tight text-[var(--color-text)] leading-tight">
                        Detail Tahun Pelajaran
                    </h1>
                    <p className="text-[var(--color-text-muted)] text-[10px] mt-0.5 font-medium">
                        {period.academic_year} {period.semester} — informasi lengkap periode akademik.
                    </p>
                    <p className="text-[var(--color-text-muted)] text-[8px] mt-0.5 font-medium opacity-60">
                        Shortcut: E = Edit · L = Kunci · Esc = Kembali
                    </p>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 min-h-0 px-5 pb-2 overflow-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* ── Left Column ── */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Main Header Card */}
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
                            {/* Status accent bar */}
                            <div className={`h-1 w-full bg-gradient-to-r ${tsc.accent}`} />

                            <div className="p-5 space-y-4">
                                {/* Title row */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
                                            Tahun Pelajaran
                                        </p>
                                        <h2 className="text-2xl font-black text-[var(--color-text)] leading-tight">
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
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${tsc.color}`}>
                                                {tsc.dot && (
                                                    <span className="relative flex h-2 w-2 shrink-0">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                                    </span>
                                                )}
                                                {tsc.label}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                                        period.is_active
                                            ? 'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary)]/70 text-white shadow-lg shadow-[var(--color-primary)]/30'
                                            : 'bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-muted)]'
                                    }`}>
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                </div>

                                {/* Lifecycle Timeline */}
                                <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2.5">Timeline Periode</p>
                                    <LifecycleTimeline period={period} />
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 space-y-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded-md bg-blue-500/10 flex items-center justify-center">
                                                <CalendarCheck className="w-3 h-3 text-blue-500" />
                                            </div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Mulai</p>
                                        </div>
                                        <p className="text-xs font-bold text-[var(--color-text)]">
                                            {formatDate(maskValue(period.start_date, 'date'))}
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 space-y-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded-md bg-red-500/10 flex items-center justify-center">
                                                <CalendarCheck className="w-3 h-3 text-red-500" />
                                            </div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Selesai</p>
                                        </div>
                                        <p className="text-xs font-bold text-[var(--color-text)]">
                                            {formatDate(maskValue(period.end_date, 'date'))}
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 space-y-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded-md bg-purple-500/10 flex items-center justify-center">
                                                <Hourglass className="w-3 h-3 text-purple-500" />
                                            </div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Durasi</p>
                                        </div>
                                        <p className="text-xs font-black text-[var(--color-text)]">
                                            {getDuration(period.start_date, period.end_date)}
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 space-y-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                                                timeStatus === 'running'  ? 'bg-emerald-500/10' :
                                                timeStatus === 'upcoming' ? 'bg-blue-500/10'    : 'bg-zinc-500/10'
                                            }`}>
                                                <Timer className={`w-3 h-3 ${
                                                    timeStatus === 'running'  ? 'text-emerald-500' :
                                                    timeStatus === 'upcoming' ? 'text-blue-500'    : 'text-zinc-500'
                                                }`} />
                                            </div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Status</p>
                                        </div>
                                        <p className="text-xs font-black text-[var(--color-text)]">{tsc.label}</p>
                                    </div>
                                </div>

                                {/* Progress Ring + Bar */}
                                {period.start_date && period.end_date && (
                                    <div className="pt-3 border-t border-[var(--color-border)]">
                                        <div className="flex items-center gap-4">
                                            <ProgressRing value={progressPct} size={72} strokeWidth={6} color={ringColor} />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                                                        Progress Periode
                                                    </span>
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${getProgressBadgeClass(progressPct)}`}>
                                                        {Math.round(progressPct)}%
                                                    </span>
                                                </div>
                                                <div className="h-2.5 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-700"
                                                        style={{ width: `${progressPct}%`, backgroundColor: ringColor }}
                                                    />
                                                </div>
                                                <div className="flex justify-between mt-1.5">
                                                    <span className="text-[9px] font-bold text-[var(--color-text-muted)]">
                                                        {formatDate(period.start_date)}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-[var(--color-text-muted)]">
                                                        {formatDate(period.end_date)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Metrics Row */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <TrendUp className="w-3.5 h-3.5 text-blue-500" />
                                    </div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Hari Berlalu</p>
                                </div>
                                <p className="text-2xl font-black text-[var(--color-text)] leading-none">
                                    {timeStatus === 'upcoming' ? 0 : maskValue(String(daysElapsed), 'number')}
                                </p>
                                <p className="text-[9px] text-[var(--color-text-muted)] font-bold">dari {totalDays} hari total</p>
                            </div>

                            <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                        <Timer className="w-3.5 h-3.5 text-amber-500" />
                                    </div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Hari Tersisa</p>
                                </div>
                                <p className="text-2xl font-black text-[var(--color-text)] leading-none">
                                    {maskValue(String(daysRemaining), 'number')}
                                </p>
                                <p className="text-[9px] text-[var(--color-text-muted)] font-bold">
                                    {timeStatus === 'ended'    ? 'periode telah berakhir' :
                                     timeStatus === 'upcoming' ? 'belum dimulai'           : 'hingga berakhir'}
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <Users className="w-3.5 h-3.5 text-emerald-500" />
                                    </div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Rata-rata Siswa</p>
                                </div>
                                <p className="text-2xl font-black text-[var(--color-text)] leading-none">
                                    {maskValue(String(avgStudents), 'number')}
                                </p>
                                <p className="text-[9px] text-[var(--color-text-muted)] font-bold">per kelas</p>
                            </div>
                        </div>

                        {/* Lock Info Alert */}
                        {period.is_locked && (
                            <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-200 bg-amber-50">
                                <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                                    <Lock className="w-4 h-4 text-amber-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-black text-amber-800 mb-0.5">Periode Terkunci</p>
                                    <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                                        Dikunci pada {formatDateTime(period.locked_at)}
                                        {lockedByUser && (
                                            <> oleh <span className="font-black">{lockedByUser.full_name || lockedByUser.email || 'pengguna sistem'}</span></>
                                        )}
                                    </p>
                                    <p className="text-[10px] text-amber-600 font-medium mt-1">
                                        Data tidak dapat diedit atau diubah statusnya selama terkunci.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Class List */}
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
                            <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <Buildings className="w-3.5 h-3.5 text-blue-500" />
                                    </div>
                                    <h3 className="text-xs font-black text-[var(--color-text)]">Daftar Kelas</h3>
                                </div>
                                {classList.length > 0 && (
                                    <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                        {classList.length} kelas
                                    </span>
                                )}
                            </div>
                            <div className="p-4">
                                {classList.length === 0 ? (
                                    <div className="py-10 text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-alt)] flex items-center justify-center mx-auto mb-3">
                                            <Buildings className="w-6 h-6 text-[var(--color-text-muted)] opacity-30" />
                                        </div>
                                        <p className="text-[11px] font-bold text-[var(--color-text-muted)]">Belum ada kelas</p>
                                        <p className="text-[10px] text-[var(--color-text-muted)] opacity-60 mt-1">
                                            Kelas akan muncul setelah ditambahkan
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Grade distribution summary */}
                                        <GradeDistributionBar classList={classList} />

                                        <div className="space-y-2 mt-3">
                                            {classList.slice(0, 10).map((cls) => {
                                                const gs = getGradeStyle(cls.grade)
                                                return (
                                                    <div
                                                        key={cls.id}
                                                        className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 hover:bg-[var(--color-surface-alt)]/60 transition-colors"
                                                    >
                                                        <div className={`w-9 h-9 rounded-xl ${gs.bg} ${gs.text} flex items-center justify-center text-[10px] font-black shrink-0`}>
                                                            {cls.grade || <Buildings className="w-4 h-4" />}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-[11px] font-bold text-[var(--color-text)] truncate">{cls.name}</p>
                                                            {(cls.grade || cls.major) && (
                                                                <p className="text-[9px] text-[var(--color-text-muted)] font-medium mt-0.5">
                                                                    {[cls.grade, cls.major].filter(Boolean).join(' · ')}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <div className="flex items-center gap-1 justify-end">
                                                                <Users className="w-3 h-3 text-[var(--color-text-muted)]" />
                                                                <span className="text-xs font-black text-[var(--color-text)]">
                                                                    {maskValue(String(cls.studentCount ?? 0), 'number')}
                                                                </span>
                                                            </div>
                                                            <p className="text-[9px] text-[var(--color-text-muted)]">siswa</p>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                            {classList.length > 10 && (
                                                <div className="pt-1 text-center">
                                                    <span className="text-[10px] font-bold text-[var(--color-text-muted)]">
                                                        +{classList.length - 10} kelas lainnya
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Mini student bar chart */}
                                        {classList.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <ListChecks className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Distribusi Siswa per Kelas</p>
                                                </div>
                                                <MiniStudentChart classList={classList} />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Notes / Catatan Internal */}
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
                            <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-xl bg-zinc-500/10 flex items-center justify-center">
                                        <Notepad className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                                    </div>
                                    <h3 className="text-xs font-black text-[var(--color-text)]">Catatan Internal</h3>
                                </div>
                                {canEdit && !isNotesEditing && (
                                    <button
                                        onClick={() => setIsNotesEditing(true)}
                                        className="h-7 px-3 rounded-lg bg-[var(--color-surface-alt)] text-[9px] font-black text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                            <div className="p-4">
                                {isNotesEditing ? (
                                    <div className="space-y-2">
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Tambahkan catatan tentang periode ini..."
                                            className="w-full h-24 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 text-[11px] font-medium text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 resize-none"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSaveNotes}
                                                className="h-7 px-3 rounded-lg bg-[var(--color-primary)] text-white text-[9px] font-black"
                                            >
                                                Simpan
                                            </button>
                                            <button
                                                onClick={() => { setNotes(period.notes || ''); setIsNotesEditing(false) }}
                                                className="h-7 px-3 rounded-lg border border-[var(--color-border)] text-[9px] font-black text-[var(--color-text-muted)]"
                                            >
                                                Batal
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className={`text-[11px] leading-relaxed ${notes ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)] italic'}`}>
                                        {notes || 'Belum ada catatan.'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Right Sidebar ── */}
                    <div className="space-y-4">

                        {/* Overlap Warning */}
                        {overlapWarning && overlapWarning.length > 0 && (
                            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                                        <Warning className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-black text-amber-800 mb-0.5">Peringatan Overlap</p>
                                        <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                                            Ada {overlapWarning.length} periode aktif lain yang tanggalnya bertumpang tindih:
                                        </p>
                                        <div className="mt-1.5 space-y-1">
                                            {overlapWarning.map(p => (
                                                <p key={p.id} className="text-[9px] font-bold text-amber-700">
                                                    {p.academic_year} {p.semester} ({formatDate(p.start_date)} – {formatDate(p.end_date)})
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Neighboring Periods */}
                        {(neighborPeriods.prev || neighborPeriods.next) && (
                            <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                                <div className="flex items-center gap-2.5 mb-3">
                                    <div className="w-7 h-7 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                        <ArrowLeft className="w-3.5 h-3.5 text-indigo-500" />
                                    </div>
                                    <h3 className="text-xs font-black text-[var(--color-text)]">Periode Tetangga</h3>
                                </div>
                                <div className="space-y-2">
                                    {neighborPeriods.prev && (
                                        <button
                                            onClick={() => navigate(`/master/periods/${neighborPeriods.prev.id}`)}
                                            className="w-full p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 hover:bg-[var(--color-surface-alt)]/60 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <ArrowLeft className="w-3 h-3 text-[var(--color-text-muted)]" />
                                                <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Sebelumnya</span>
                                            </div>
                                            <p className="text-[11px] font-bold text-[var(--color-text)]">
                                                {neighborPeriods.prev.academic_year} {neighborPeriods.prev.semester}
                                            </p>
                                            <p className="text-[9px] text-[var(--color-text-muted)] mt-0.5">
                                                {formatDate(neighborPeriods.prev.start_date)} – {formatDate(neighborPeriods.prev.end_date)}
                                            </p>
                                        </button>
                                    )}
                                    {neighborPeriods.next && (
                                        <button
                                            onClick={() => navigate(`/master/periods/${neighborPeriods.next.id}`)}
                                            className="w-full p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 hover:bg-[var(--color-surface-alt)]/60 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <ArrowRight className="w-3 h-3 text-[var(--color-text-muted)]" />
                                                <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Selanjutnya</span>
                                            </div>
                                            <p className="text-[11px] font-bold text-[var(--color-text)]">
                                                {neighborPeriods.next.academic_year} {neighborPeriods.next.semester}
                                            </p>
                                            <p className="text-[9px] text-[var(--color-text-muted)] mt-0.5">
                                                {formatDate(neighborPeriods.next.start_date)} – {formatDate(neighborPeriods.next.end_date)}
                                            </p>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Usage Stats */}
                        {usageStats && (
                            <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                                <div className="flex items-center gap-2.5 mb-4">
                                    <div className="w-7 h-7 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                                        <TrendUp className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                                    </div>
                                    <h3 className="text-xs font-black text-[var(--color-text)]">Statistik Penggunaan</h3>
                                </div>
                                <div className="space-y-2.5">
                                    <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                                            <Buildings className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Total Kelas</p>
                                            <p className="text-xl font-black text-[var(--color-text)]">
                                                {maskValue(String(usageStats.classCount), 'number')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Total Siswa</p>
                                            <p className="text-xl font-black text-[var(--color-text)]">
                                                {maskValue(String(usageStats.studentCount), 'number')}
                                            </p>
                                        </div>
                                    </div>
                                    {usageStats.classCount > 0 && (
                                        <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                                                <UserCircle className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Rata-rata / Kelas</p>
                                                <p className="text-xl font-black text-[var(--color-text)]">
                                                    {maskValue(String(avgStudents), 'number')}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Metadata / Info */}
                        <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="w-7 h-7 rounded-xl bg-zinc-500/10 flex items-center justify-center">
                                    <Info className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                                </div>
                                <h3 className="text-xs font-black text-[var(--color-text)]">Informasi</h3>
                            </div>

                            {/* Period ID + Copy */}
                            <div className="p-3 rounded-xl bg-[var(--color-surface-alt)]/50 border border-[var(--color-border)] mb-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-0.5">
                                            ID Periode
                                        </p>
                                        <p className="text-[10px] font-mono font-bold text-[var(--color-text)] truncate">
                                            {period.id}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleCopyId}
                                        className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                                            copiedId
                                                ? 'bg-emerald-500/10 text-emerald-600'
                                                : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]'
                                        }`}
                                        title="Salin ID"
                                    >
                                        <Copy className="w-3 h-3" />
                                    </button>
                                </div>
                                {copiedId && (
                                    <p className="text-[9px] text-emerald-600 font-bold mt-1.5">Tersalin ke clipboard</p>
                                )}
                            </div>

                            {/* Copy Summary */}
                            <div className="p-3 rounded-xl bg-[var(--color-surface-alt)]/50 border border-[var(--color-border)] mb-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-0.5">
                                            Ringkasan Periode
                                        </p>
                                        <p className="text-[10px] font-medium text-[var(--color-text-muted)]">
                                            Salin ringkasan untuk laporan
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleCopySummary}
                                        className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                                            copiedSummary
                                                ? 'bg-emerald-500/10 text-emerald-600'
                                                : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]'
                                        }`}
                                        title="Salin Ringkasan"
                                    >
                                        <Copy className="w-3 h-3" />
                                    </button>
                                </div>
                                {copiedSummary && (
                                    <p className="text-[9px] text-emerald-600 font-bold mt-1.5">Ringkasan tersalin</p>
                                )}
                            </div>

                            {/* Metadata rows */}
                            <div className="space-y-0 divide-y divide-[var(--color-border)]/50">
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-[10px] font-bold text-[var(--color-text-muted)]">Dibuat</span>
                                    <span className="text-[10px] font-bold text-[var(--color-text)]">{formatDate(period.created_at)}</span>
                                </div>
                                {period.updated_at && period.updated_at !== period.created_at && (
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-[10px] font-bold text-[var(--color-text-muted)]">Diperbarui</span>
                                        <span className="text-[10px] font-bold text-[var(--color-text)]">{formatDate(period.updated_at)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-[10px] font-bold text-[var(--color-text-muted)]">Status Aktif</span>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                        period.is_active
                                            ? 'bg-emerald-500/10 text-emerald-600'
                                            : 'bg-zinc-500/10 text-zinc-500'
                                    }`}>
                                        {period.is_active ? 'Aktif' : 'Tidak Aktif'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-[10px] font-bold text-[var(--color-text-muted)]">Status Kunci</span>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                        period.is_locked
                                            ? 'bg-amber-500/10 text-amber-600'
                                            : 'bg-emerald-500/10 text-emerald-600'
                                    }`}>
                                        {period.is_locked ? 'Terkunci' : 'Terbuka'}
                                    </span>
                                </div>
                                {period.locked_at && (
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-[10px] font-bold text-[var(--color-text-muted)]">Dikunci Pada</span>
                                        <span className="text-[10px] font-bold text-[var(--color-text)]">{formatDate(period.locked_at)}</span>
                                    </div>
                                )}
                                {lockedByUser && (
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-[10px] font-bold text-[var(--color-text-muted)]">Dikunci Oleh</span>
                                        <span className="text-[10px] font-bold text-[var(--color-text)] truncate max-w-[120px]">
                                            {lockedByUser.full_name || lockedByUser.email || '-'}
                                        </span>
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

            {/* ── Sticky Action Bar ── */}
            <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-xl px-5 py-2.5">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={handleEdit}
                            disabled={!canEdit || period.is_locked}
                            title={!canEdit ? 'Akses terbatas' : period.is_locked ? 'Buka kunci terlebih dahulu' : 'Edit (E)'}
                            className="h-9 px-4 rounded-xl bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-[var(--color-primary)]/20 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                            onClick={handleToggleActive}
                            disabled={!canEdit || period.is_locked || saving}
                            title={period.is_locked ? 'Periode terkunci' : !canEdit ? 'Akses terbatas' : undefined}
                            className="h-9 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-[var(--color-surface-alt)] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {period.is_active ? <EyeSlash className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            {period.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button
                            onClick={handleToggleLock}
                            disabled={!canEdit || saving}
                            title={!canEdit ? 'Akses terbatas' : `Lock/Unlock (L)`}
                            className={`h-9 px-4 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                period.is_locked
                                    ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                    : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)]'
                            }`}
                        >
                            {period.is_locked ? <LockOpen className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            {period.is_locked ? 'Buka Kunci' : 'Kunci'}
                        </button>
                        <button
                            onClick={() => setIsDeleteOpen(true)}
                            disabled={!canEdit || saving}
                            title={!canEdit ? 'Akses terbatas' : undefined}
                            className="h-9 px-4 rounded-xl border border-red-200 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Archive className="w-3.5 h-3.5" /> Arsipkan
                        </button>
                    </div>
                    <button
                        onClick={goBack}
                        className="h-9 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-[var(--color-surface-alt)]"
                    >
                        <CaretLeft className="w-3.5 h-3.5" /> Kembali
                    </button>
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
