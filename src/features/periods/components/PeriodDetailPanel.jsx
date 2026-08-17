import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Calendar, CaretLeft, CheckCircle, ClockCounterClockwise,
    Buildings, Users, Lock, LockOpen, Pencil, Archive,
    Fingerprint, Eye, EyeSlash, Copy, Prohibit,
    Timer, CalendarCheck, Hourglass, UserCircle, Info, TrendUp,
    ArrowLeft, ArrowRight, ArrowClockwise, Notepad, ListChecks,
    Warning, CheckFat, Link as LinkIcon, ArrowSquareOut,
    Gauge, ShieldCheck, BookOpen, GraduationCap, ChalkboardTeacher,
    Megaphone, Printer,
} from '@phosphor-icons/react'
import { supabase } from '@lib/supabase'
import { useFlag } from '@context/FeatureFlags'
import { useToast } from '@context/Toast'
import { useAuth } from '@context/Auth'
import { usePrivacyMode } from '@shared/hooks/usePrivacyMode'
import { logAudit } from '@utils/auditLogger'
import {
    AuditTimeline, Skeleton, Tooltip, PrivacyMask,
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
    if (g === 'IX'  || g === '9')  return { bg: 'bg-amber-500/10',   text: 'text-amber-600'   }
    if (g === 'VIII' || g === '8') return { bg: 'bg-orange-500/10',  text: 'text-orange-600'  }
    if (g === 'VII' || g === '7')  return { bg: 'bg-cyan-500/10',    text: 'text-cyan-600'    }
    return { bg: 'bg-zinc-500/10', text: 'text-zinc-500' }
}

const TIME_STATUS_CONFIG = {
    running:  { label: 'Sedang Berjalan', color: 'bg-sky-500/10 text-sky-600 border-sky-500/20',            accent: 'from-sky-500 to-blue-400',           dot: true  },
    upcoming: { label: 'Akan Datang',     color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',         accent: 'from-blue-500 to-indigo-400',       dot: false },
    ended:    { label: 'Sudah Berakhir',  color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',          accent: 'from-zinc-400 to-zinc-300',          dot: false },
    unknown:  { label: 'Tidak Diketahui', color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',          accent: 'from-zinc-400 to-zinc-300',          dot: false },
}

function computeHealthScore(period, usageStats) {
    if (!period) return { score: 0, label: '-', color: '#a1a1aa', items: [] }
    const items = []
    // Has start & end dates
    if (period.start_date && period.end_date) {
        items.push({ label: 'Tanggal ditentukan', pass: true })
    } else {
        items.push({ label: 'Tanggal belum lengkap', pass: false })
    }
    // Has classes
    if (usageStats && usageStats.classCount > 0) {
        items.push({ label: `${usageStats.classCount} kelas terdaftar`, pass: true })
    } else {
        items.push({ label: 'Belum ada kelas', pass: false })
    }
    // Has students
    if (usageStats && usageStats.studentCount > 0) {
        items.push({ label: `${usageStats.studentCount} siswa aktif`, pass: true })
    } else {
        items.push({ label: 'Belum ada siswa', pass: false })
    }
    // Not locked (editable)
    items.push({ label: period.is_locked ? 'Terkunci' : 'Terbuka', pass: !period.is_locked })
    // Has notes
    items.push({ label: period.notes ? 'Ada catatan' : 'Tanpa catatan', pass: !!period.notes })
    // Dates valid (end > start)
    if (period.start_date && period.end_date) {
        const valid = new Date(period.end_date) > new Date(period.start_date)
        items.push({ label: valid ? 'Durasi valid' : 'Durasi invalid', pass: valid })
    }

    const passCount = items.filter(i => i.pass).length
    const score = Math.round((passCount / items.length) * 100)
    let color = '#10b981'
    if (score < 50) color = '#ef4444'
    else if (score < 80) color = '#f59e0b'
    const label = score >= 80 ? 'Sangat Baik' : score >= 50 ? 'Cukup' : 'Perlu Perhatian'
    return { score, label, color, items }
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

function HealthScore({ period, usageStats }) {
    const { score, label, color, items } = computeHealthScore(period, usageStats)
    const size = 48
    const strokeWidth = 5
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / 100) * circumference
    const passCount = items.filter(i => i.pass).length

    return (
        <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 flex items-center justify-center">
                    <Gauge className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <h3 className="text-xs font-black text-[var(--color-text)]">Kesehatan Periode</h3>
            </div>
            <div className="flex items-center gap-3">
                <div className="relative shrink-0" style={{ width: size, height: size }}>
                    <svg width={size} height={size} className="transform -rotate-90">
                        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--color-surface-alt)" strokeWidth={strokeWidth} />
                        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
                            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                            className="transition-all duration-700" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xs font-black" style={{ color }}>{score}</span>
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-[11px] font-black text-[var(--color-text)]">{label}</span>
                        <span className="text-[9px] font-semibold text-[var(--color-text-muted)]">{passCount}/{items.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                        {items.map((item, i) => (
                            <div key={i} className="flex items-center gap-1">
                                {item.pass ? (
                                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                                ) : (
                                    <Warning className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                                )}
                                <span className={`text-[9px] font-medium ${item.pass ? 'text-[var(--color-text-muted)]' : 'text-amber-600'}`}>
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function WarningsPanel({ period, usageStats, overlapWarning, onAddNotes, collapsed, onToggleCollapse }) {
    const warnings = []
    if (!usageStats || usageStats.classCount === 0) {
        warnings.push({ icon: Buildings, color: 'amber', msg: 'Belum ada kelas terdaftar untuk periode ini' })
    }
    if (!usageStats || usageStats.studentCount === 0) {
        warnings.push({ icon: Users, color: 'amber', msg: 'Belum ada siswa terdaftar di periode ini' })
    }
    if (overlapWarning && overlapWarning.length > 0) {
        warnings.push({ icon: Warning, color: 'red', msg: `${overlapWarning.length} periode aktif lain bertumpang tindih` })
    }
    if (!period.notes) {
        warnings.push({ icon: Notepad, color: 'blue', msg: 'Belum ada catatan internal', onClick: onAddNotes })
    }

    if (warnings.length === 0) return null

    return (
        <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <button
                onClick={onToggleCollapse}
                className="flex items-center gap-2.5 mb-0 w-full text-left"
            >
                <div className="w-7 h-7 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Megaphone className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <h3 className="text-xs font-black text-[var(--color-text)] flex-1">Peringatan & Saran</h3>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    {warnings.length}
                </span>
                <CaretLeft className={`w-3.5 h-3.5 text-[var(--color-text-muted)] transition-transform ${collapsed ? '-rotate-90' : ''}`} />
            </button>
            {!collapsed && (
                <div className="mt-2.5 divide-y divide-[var(--color-border)]">
                    {warnings.map((w, i) => {
                        const Icon = w.icon
                        const Wrapper = w.onClick ? 'button' : 'div'
                        return (
                            <Wrapper
                                key={i}
                                onClick={w.onClick || undefined}
                                className={`flex items-center gap-2 py-2 text-left w-full transition-colors first:pt-0 last:pb-0 ${
                                    w.onClick ? 'hover:opacity-70 cursor-pointer' : ''
                                }`}
                            >
                                <Icon className={`w-3 h-3 shrink-0 ${
                                    w.color === 'red' ? 'text-red-500' : w.color === 'amber' ? 'text-amber-500' : 'text-blue-500'
                                }`} />
                                <span className={`text-[10px] font-medium ${
                                    w.color === 'red' ? 'text-red-600' : w.color === 'amber' ? 'text-amber-600' : 'text-blue-600'
                                }`}>
                                    {w.msg}
                                </span>
                            </Wrapper>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

function QuickLinks({ period }) {
    const links = [
        { label: 'Lihat Semua Kelas', sublabel: `${period.academic_year} ${period.semester}`, icon: ChalkboardTeacher, color: 'blue', href: '/master/classes' },
        { label: 'Data Siswa', sublabel: 'Periode ini', icon: GraduationCap, color: 'emerald', href: '/master/students' },
        { label: 'Penerimaan Baru', sublabel: 'Enrollment', icon: BookOpen, color: 'purple', href: '/enrollment' },
    ]

    return (
        <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <LinkIcon className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <h3 className="text-xs font-black text-[var(--color-text)]">Aksi Cepat</h3>
            </div>
            <div className="space-y-2">
                {links.map((link, i) => {
                    const Icon = link.icon
                    return (
                        <a
                            key={i}
                            href={link.href}
                            className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 hover:bg-[var(--color-surface-alt)]/60 transition-colors group"
                        >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                link.color === 'blue'    ? 'bg-blue-500/10 text-blue-500'    :
                                link.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' :
                                'bg-purple-500/10 text-purple-500'
                            }`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-[var(--color-text)]">{link.label}</p>
                                <p className="text-[9px] text-[var(--color-text-muted)]">{link.sublabel}</p>
                            </div>
                            <ArrowSquareOut className="w-3.5 h-3.5 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                    )
                })}
            </div>
        </div>
    )
}

function ComparisonCard({ period, usageStats, allPeriodsData }) {
    if (!allPeriodsData || allPeriodsData.length < 2) return null

    const sorted = [...allPeriodsData].sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0))
    const rank = sorted.findIndex(p => p.id === period.id) + 1
    const avgStudentsAll = sorted.reduce((s, p) => s + (p.studentCount || 0), 0) / sorted.length
    const avgClassesAll = sorted.reduce((s, p) => s + (p.classCount || 0), 0) / sorted.length
    const thisAvg = usageStats?.classCount > 0 ? usageStats.studentCount / usageStats.classCount : 0

    const metrics = [
        { label: 'Peringkat Siswa', value: `#${rank}`, sub: `dari ${sorted.length} periode`, color: rank <= 3 ? 'text-emerald-600' : 'text-[var(--color-text)]' },
        { label: 'Avg Siswa/Kelas', value: Math.round(thisAvg), sub: `rata-rata: ${Math.round(avgStudentsAll / (avgClassesAll || 1))}`, color: thisAvg >= avgStudentsAll / (avgClassesAll || 1) ? 'text-emerald-600' : 'text-amber-600' },
        { label: 'Total Kelas', value: usageStats?.classCount || 0, sub: `rata-rata: ${Math.round(avgClassesAll)}`, color: 'text-[var(--color-text)]' },
    ]

    return (
        <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                    <TrendUp className="w-3.5 h-3.5 text-cyan-500" />
                </div>
                <h3 className="text-xs font-black text-[var(--color-text)]">Perbandingan</h3>
                <span className="text-[9px] font-bold text-[var(--color-text-muted)]">{sorted.length} periode</span>
            </div>
            <div className="space-y-2">
                {metrics.map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--color-surface-alt)]/30 border border-[var(--color-border)]">
                        <span className="text-[10px] font-bold text-[var(--color-text-muted)]">{m.label}</span>
                        <div className="text-right">
                            <span className={`text-sm font-black ${m.color}`}>{m.value}</span>
                            <p className="text-[8px] font-medium text-[var(--color-text-muted)]">{m.sub}</p>
                        </div>
                    </div>
                ))}
            </div>
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
                    <div className="grid grid-cols-2 gap-3">
                        <Skeleton className="h-32 rounded-2xl" />
                        <Skeleton className="h-32 rounded-2xl" />
                    </div>
                    <Skeleton className="h-28 rounded-2xl" />
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
    const { isPrivacyMode, togglePrivacyMode } = usePrivacyMode()

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
    
    const [copiedId, setCopiedId] = useState(false)
    const [lastRefresh, setLastRefresh] = useState(null)
    const [copiedSummary, setCopiedSummary] = useState(false)
    const [notes, setNotes] = useState('')
    const [isNotesEditing, setIsNotesEditing] = useState(false)
    const [neighborPeriods, setNeighborPeriods] = useState({ prev: null, next: null })
    const [overlapWarning, setOverlapWarning] = useState(null)

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [allPeriodsData, setAllPeriodsData] = useState([])
    const [warningsCollapsed, setWarningsCollapsed] = useState(false)

    /* ── Fetch ── */
    const fetchPeriod = useCallback(async () => {
        setLoading(true)
        try {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(periodId)
            let query = supabase.from('periods').select('*').is('deleted_at', null)
            if (isUUID) {
                query = query.eq('uuid', periodId)
            } else {
                query = query.eq('id', periodId)
            }
            const { data, error } = await query.single()
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

            // Fetch classes (match by academic_year string, use grade_level instead of grade)
            const { data: cls, error: clsErr } = await supabase
                .from('classes')
                .select('id, name, grade_level')
                .eq('academic_year', data.academic_year)
                .order('name')
            if (clsErr) console.error('[PeriodDetailPanel] classes fetch error:', clsErr)
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
                    .select('id, uuid, academic_year, semester, start_date, end_date, is_active, is_locked')
                    .is('deleted_at', null)
                    .order('start_date', { ascending: true })

                if (allPeriods && allPeriods.length > 1) {
                    const idx = allPeriods.findIndex(p => p.id === data.id)
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
                    const overlaps = activePeriods.filter(p => p.id !== data.id)
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

            // Fetch all periods with class/student counts for comparison
            try {
                const { data: allP } = await supabase
                    .from('periods')
                    .select('id, academic_year, semester, start_date, end_date, is_active')
                    .is('deleted_at', null)
                    .order('start_date', { ascending: true })

                if (allP && allP.length > 0) {
                    const pIds = allP.map(p => p.id)
                    // Get class counts per period via academic_year
                    const enriched = await Promise.all(allP.map(async (p) => {
                        const { data: cls } = await supabase
                            .from('classes')
                            .select('id')
                            .eq('academic_year', p.academic_year)
                        const classCount = cls?.length || 0
                        let studentCount = 0
                        if (classCount > 0) {
                            const classIds = cls.map(c => c.id)
                            const { data: st } = await supabase
                                .from('students')
                                .select('id', { count: 'exact', head: true })
                                .in('class_id', classIds)
                                .is('deleted_at', null)
                            studentCount = st?.length || 0
                        }
                        return { ...p, classCount, studentCount }
                    }))
                    setAllPeriodsData(enriched)
                }
            } catch {
                setAllPeriodsData([])
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
        if (!formData.name.trim())  errors.name      = 'Nama tahun akademik wajib diisi'
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
            try { await logAudit({ action: 'UPDATE', source: 'MASTER', tableName: 'periods', recordId: period.id, oldData: period, newData: { ...period, is_active: newActive } }) } catch { /* skip */ }
        } catch (err) {
            setPeriod(prev => prev ? { ...prev, is_active: period.is_active } : prev)
            addToast(err?.message || 'Gagal mengubah status', 'error')
        } finally {
            setSaving(false)
        }
    }, [period, saving, addToast])

    const goBack = useCallback(() => onBack(), [onBack])

    const handlePrint = useCallback(() => {
        window.print()
    }, [])

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
        <div className="-mx-4 sm:-mx-5 lg:-mx-6 -mt-4 lg:-mt-6">
                <div className="px-5 pt-5 pb-3">
                    <div className="flex items-center gap-2 mb-3">
                        <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
                        <Skeleton className="h-3 w-64 rounded" />
                    </div>
                    <Skeleton className="h-7 w-56 rounded-lg" />
                </div>
                <div className="px-5 pb-5">
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
                    <button
                        onClick={goBack}
                        className="h-7 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-1 text-[10px] font-black text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-all shrink-0"
                        title="Kembali ke Tahun Akademik (Esc)"
                    >
                        <CaretLeft className="w-3.5 h-3.5" />
                        <span>Tahun Akademik</span>
                    </button>
                    {lastRefresh && (
                        <span className="text-[8px] font-bold text-[var(--color-text-muted)] ml-1 shrink-0 whitespace-nowrap">
                            Diperbarui {(() => {
                                const ms = Date.now() - lastRefresh.getTime()
                                const mins = Math.floor(ms / 60000)
                                if (mins < 1) return 'baru saja'
                                if (mins < 60) return `${mins}m lalu`
                                return `${Math.floor(mins / 60)}j lalu`
                            })()}
                        </span>
                    )}
                </div>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-black font-heading tracking-tight text-[var(--color-text)] leading-tight">
                            Detail Tahun Akademik
                        </h1>
                        <p className="text-[var(--color-text-muted)] text-[10px] mt-0.5 font-medium">
                            {period.academic_year} {period.semester} — informasi lengkap periode akademik.
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 min-w-0 overflow-x-auto scrollbar-hide lg:shrink-0 -mx-5 px-5 lg:mx-0 lg:px-0 py-0.5">
                        <Tooltip content={!canEdit ? 'Akses terbatas' : period.is_locked ? 'Buka kunci terlebih dahulu' : 'Edit (E)'} position="bottom">
                            <button
                                onClick={handleEdit}
                                disabled={!canEdit || period.is_locked}
                                className="h-8 px-3 rounded-lg bg-[var(--color-primary)] text-white flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-[var(--color-primary)]/20 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                        </Tooltip>
                        <Tooltip content={period.is_locked ? 'Periode terkunci' : !canEdit ? 'Akses terbatas' : period.is_active ? 'Nonaktifkan' : 'Aktifkan'} position="bottom">
                            <button
                                onClick={handleToggleActive}
                                disabled={!canEdit || period.is_locked || saving}
                                className="h-8 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-1.5 transition-all hover:bg-[var(--color-surface-alt)] disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                            >
                                {period.is_active ? <Prohibit className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            </button>
                        </Tooltip>
                        <Tooltip content={!canEdit ? 'Akses terbatas' : period.is_locked ? 'Buka Kunci (L)' : 'Kunci (L)'} position="bottom">
                            <button
                                onClick={handleToggleLock}
                                disabled={!canEdit || saving}
                                className={`h-8 px-3 rounded-lg border flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 ${
                                    period.is_locked
                                        ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                        : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)]'
                                }`}
                            >
                                {period.is_locked ? <LockOpen className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            </button>
                        </Tooltip>
                        <Tooltip content={!canEdit ? 'Akses terbatas' : 'Arsipkan periode'} position="bottom">
                            <button
                                onClick={() => setIsDeleteOpen(true)}
                                disabled={!canEdit || saving}
                                className="h-8 px-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 flex items-center gap-1.5 transition-all hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                            >
                                <Archive className="w-3.5 h-3.5" />
                            </button>
                        </Tooltip>
                        <div className="w-px h-5 bg-[var(--color-border)] mx-0.5 shrink-0" />
                        <Tooltip content="Muat ulang data" position="bottom">
                            <button
                                onClick={handleRefresh}
                                className="h-8 w-8 rounded-lg border bg-[var(--color-surface-alt)] border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all shrink-0"
                            >
                                <ArrowClockwise className="w-3.5 h-3.5" />
                            </button>
                        </Tooltip>
                        <Tooltip content={isPrivacyMode ? 'Matikan Mode Privasi' : 'Aktifkan Mode Privasi'} position="bottom">
                            <button
                                onClick={togglePrivacyMode}
                                className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all shrink-0 ${isPrivacyMode ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : 'bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
                            >
                                {isPrivacyMode ? <EyeSlash className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                        </Tooltip>
                        
                        <div className="w-px h-5 bg-[var(--color-border)] mx-0.5 shrink-0" />
                        <Tooltip content="Cetak / Export PDF" position="bottom">
                            <button
                                onClick={handlePrint}
                                className="h-8 w-8 rounded-lg border bg-[var(--color-surface-alt)] border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all shrink-0"
                            >
                                <Printer className="w-3.5 h-3.5" />
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="px-5 pb-5 print-area">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* ── Left Column (2/3) ── */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Top Row: 2 cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <WarningsPanel period={period} usageStats={usageStats} overlapWarning={overlapWarning} onAddNotes={() => setIsNotesEditing(true)} collapsed={warningsCollapsed} onToggleCollapse={() => setWarningsCollapsed(v => !v)} />
                            <HealthScore period={period} usageStats={usageStats} />
                        </div>

                        {/* Main Header Card */}
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
                            {/* Status accent bar */}
                            <div className={`h-1 w-full bg-gradient-to-r ${tsc.accent}`} />

                            <div className="p-5 space-y-4">
                                {/* Title row */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
                                            Tahun Akademik
                                        </p>
                                        <h2 className="text-2xl font-black text-[var(--color-text)] leading-tight">
                                            <PrivacyMask active={isPrivacyMode}>{period.academic_year}</PrivacyMask>
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
                                            <PrivacyMask active={isPrivacyMode}>{formatDate(period.start_date)}</PrivacyMask>
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
                                            <PrivacyMask active={isPrivacyMode}>{formatDate(period.end_date)}</PrivacyMask>
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
<span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getProgressBadgeClass(progressPct)}`}>
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
                        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                            <div className="p-3 sm:p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <TrendUp className="w-3.5 h-3.5 text-blue-500" />
                                    </div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Hari Berlalu</p>
                                </div>
                                <p className="text-2xl font-black text-[var(--color-text)] leading-none">
                                    {timeStatus === 'upcoming' ? 0 : <PrivacyMask active={isPrivacyMode}>{daysElapsed}</PrivacyMask>}
                                </p>
                                <p className="text-[9px] text-[var(--color-text-muted)] font-bold">dari {totalDays} hari total</p>
                            </div>

                            <div className="p-3 sm:p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                        <Timer className="w-3.5 h-3.5 text-amber-500" />
                                    </div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Hari Tersisa</p>
                                </div>
                                <p className="text-2xl font-black text-[var(--color-text)] leading-none">
                                    <PrivacyMask active={isPrivacyMode}>{daysRemaining}</PrivacyMask>
                                </p>
                                <p className="text-[9px] text-[var(--color-text-muted)] font-bold">
                                    {timeStatus === 'ended'    ? 'periode telah berakhir' :
                                     timeStatus === 'upcoming' ? 'belum dimulai'           : 'hingga berakhir'}
                                </p>
                            </div>

                            <div className="p-3 sm:p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <Users className="w-3.5 h-3.5 text-emerald-500" />
                                    </div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Rata-rata Siswa</p>
                                </div>
                                <p className="text-2xl font-black text-[var(--color-text)] leading-none">
                                    <PrivacyMask active={isPrivacyMode}>{avgStudents}</PrivacyMask>
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
                                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                                            <Buildings className="w-6 h-6 text-amber-500" />
                                        </div>
                                        <p className="text-[11px] font-black text-[var(--color-text)]">Belum ada kelas</p>
                                        <p className="text-[10px] text-[var(--color-text-muted)] mt-1 max-w-[200px] mx-auto">
                                            Kelas perlu ditambahkan untuk mengelola siswa di periode ini
                                        </p>
                                        <a
                                            href="/master/classes"
                                            className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-[10px] font-black hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-[var(--color-primary)]/20"
                                        >
                                            <Buildings className="w-3.5 h-3.5" />
                                            Tambah Kelas
                                        </a>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            {classList.slice(0, 10).map((cls) => {
                                                const gs = getGradeStyle(cls.grade_level)
                                                const maxStudents = Math.max(...classList.map(c => c.studentCount || 0), 1)
                                                const studentPct = ((cls.studentCount || 0) / maxStudents) * 100
                                                return (
                                                    <div
                                                        key={cls.id}
                                                        className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 hover:bg-[var(--color-surface-alt)]/60 transition-all group"
                                                    >
                                                        <div className={`w-10 h-10 rounded-xl ${gs.bg} ${gs.text} flex items-center justify-center text-[11px] font-black shrink-0`}>
                                                            {cls.grade_level || <Buildings className="w-4 h-4" />}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-[11px] font-bold text-[var(--color-text)] truncate">{cls.name}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-full transition-all duration-500"
                                                                        style={{ width: `${studentPct}%`, backgroundColor: `var(--color-primary)` }}
                                                                    />
                                                                </div>
                                                                <span className="text-[9px] font-bold text-[var(--color-text-muted)] shrink-0">
                                                                    {cls.studentCount || 0} siswa
                                                                </span>
                                                            </div>
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
<div className="flex items-start gap-2">
                                         {!notes && <Notepad className="w-4 h-4 text-[var(--color-text-muted)] opacity-30 mt-0.5 shrink-0" />}
                                         <p className={`text-[11px] leading-relaxed ${notes ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)] italic'}`}>
                                             {notes || 'Belum ada catatan.'}
                                         </p>
                                     </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">

                        {/* Quick Links */}
                        <QuickLinks period={period} />

                        {/* Comparison Card */}
                        <ComparisonCard period={period} usageStats={usageStats} allPeriodsData={allPeriodsData} />

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
                                            onClick={() => navigate(`/master/periods/${neighborPeriods.prev.uuid || neighborPeriods.prev.id}`)}
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
                                            onClick={() => navigate(`/master/periods/${neighborPeriods.next.uuid || neighborPeriods.next.id}`)}
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
                    </div>
                </div>
            </div>

            {/* Modals */}
            <div className="no-print">
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
        </div>
    )
}
