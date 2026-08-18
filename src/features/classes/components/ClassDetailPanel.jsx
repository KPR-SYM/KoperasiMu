import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
    CaretLeft, Buildings, Users, Lock, LockOpen, Pencil, Trash,
    Copy, Eye, EyeSlash, UserCircle, Warning, Notepad, Bed,
    Calendar, Hash, GenderMale, GenderFemale, Fingerprint, TrendUp,
    Link as LinkIcon, ArrowSquareOut, Gauge, ShieldCheck, Megaphone,
    ChalkboardTeacher, GraduationCap, BookOpen, Printer, CheckFat,
    ClockCounterClockwise, ArrowsClockwise, Plus, FloppyDisk, X,
    Prohibit, Archive, CheckCircle, Info, ArrowClockwise,
} from '@phosphor-icons/react'
import { supabase } from '@lib/supabase'
import { useFlag } from '@context/FeatureFlags'
import { useToast } from '@context/Toast'
import { useAuth } from '@context/Auth'
import { usePrivacyMode } from '@shared/hooks/usePrivacyMode'
import { logAudit } from '@utils/auditLogger'
import { Skeleton, Tooltip, PrivacyMask, ConfirmDialog } from '@shared/components'
import ClassFormModal from '@features/classes/components/ClassFormModal'

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function formatDate(dateStr) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) +
        ', ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function getGradeStyle(gradeLevel) {
    const g = Number(gradeLevel)
    if (g === 12) return { bg: 'bg-emerald-500/10', text: 'text-emerald-600', label: 'XII' }
    if (g === 11) return { bg: 'bg-purple-500/10', text: 'text-purple-600', label: 'XI' }
    if (g === 10) return { bg: 'bg-blue-500/10', text: 'text-blue-600', label: 'X' }
    if (g === 9)  return { bg: 'bg-amber-500/10', text: 'text-amber-600', label: 'IX' }
    if (g === 8)  return { bg: 'bg-orange-500/10', text: 'text-orange-600', label: 'VIII' }
    if (g === 7)  return { bg: 'bg-cyan-500/10', text: 'text-cyan-600', label: 'VII' }
    return { bg: 'bg-zinc-500/10', text: 'text-zinc-500', label: String(gradeLevel || '-') }
}

function getProgramInfo(name) {
    if (!name) return { label: 'Reguler', icon: Buildings, color: 'zinc' }
    if (name.toLowerCase().includes('boarding')) return { label: 'Boarding', icon: Bed, color: 'blue' }
    return { label: 'Reguler', icon: Buildings, color: 'zinc' }
}

function getGenderInfo(name) {
    if (!name) return { label: '-', icon: null, color: 'zinc' }
    if (name.toLowerCase().includes('putra')) return { label: 'Putra', icon: GenderMale, color: 'sky' }
    if (name.toLowerCase().includes('putri')) return { label: 'Putri', icon: GenderFemale, color: 'pink' }
    return { label: '-', icon: null, color: 'zinc' }
}

function computeHealthScore(cls, studentCount) {
    if (!cls) return { score: 0, label: '-', color: '#a1a1aa', items: [] }
    const items = []
    items.push({ label: cls.name ? 'Nama ditentukan' : 'Tanpa nama', pass: !!cls.name })
    items.push({ label: cls.grade_level ? `Level ${cls.grade_level}` : 'Level belum ditentukan', pass: !!cls.grade_level })
    items.push({ label: cls.homeroom_teacher_id ? 'Ada wali kelas' : 'Tanpa wali kelas', pass: !!cls.homeroom_teacher_id })
    items.push({ label: cls.academic_year ? `Tahun ${cls.academic_year}` : 'Tahun belum ditentukan', pass: !!cls.academic_year })
    items.push({ label: studentCount > 0 ? `${studentCount} siswa` : 'Belum ada siswa', pass: studentCount > 0 })
    items.push({ label: cls.capacity ? `Kapasitas ${cls.capacity}` : 'Kapasitas belum ditentukan', pass: !!cls.capacity })

    const passCount = items.filter(i => i.pass).length
    const score = Math.round((passCount / items.length) * 100)
    let color = '#10b981'
    if (score < 50) color = '#ef4444'
    else if (score < 80) color = '#f59e0b'
    const label = score >= 80 ? 'Sangat Baik' : score >= 50 ? 'Cukup' : 'Perlu Perhatian'
    return { score, label, color, items }
}

/* ─── Sub-components ───────────────────────────────────────────────────────── */

function LifecycleTimeline({ cls }) {
    const steps = [
        { label: 'Dibuat', done: true, icon: Calendar },
        { label: 'Aktif', done: cls.is_active, icon: CheckCircle },
        { label: 'Terkunci', done: cls.is_locked, icon: Lock },
        { label: 'Diarsipkan', done: !!cls.deleted_at, icon: Archive },
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

function HealthScore({ cls, studentCount, isPrivacyMode }) {
    const { score, label, color, items } = computeHealthScore(cls, studentCount)
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
                <h3 className="text-xs font-black text-[var(--color-text)]">Kesehatan Kelas</h3>
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
                                    <PrivacyMask active={isPrivacyMode}>{item.label}</PrivacyMask>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function TeacherInfoCard({ cls, teacherName, onEdit, isPrivacyMode }) {
    const hasTeacher = cls.homeroom_teacher_id && teacherName

    return (
        <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <ChalkboardTeacher className="w-3.5 h-3.5 text-purple-500" />
                </div>
                <h3 className="text-xs font-black text-[var(--color-text)]">Wali Kelas</h3>
            </div>
            {hasTeacher ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-alt)]/30 border border-[var(--color-border)]">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 flex items-center justify-center text-purple-600 text-sm font-black shrink-0">
                        {teacherName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-[var(--color-text)] truncate">
                            <PrivacyMask active={isPrivacyMode}>{teacherName}</PrivacyMask>
                        </p>
                        <p className="text-[9px] text-[var(--color-text-muted)]">Homeroom Teacher</p>
                    </div>
                </div>
            ) : (
                <div className="text-center py-3">
                    <UserCircle className="w-8 h-8 text-[var(--color-text-muted)] opacity-30 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-[var(--color-text-muted)] mb-2">Belum ada wali kelas</p>
                    <button onClick={onEdit}
                        className="h-7 px-3 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[9px] font-black uppercase tracking-widest hover:bg-[var(--color-primary)]/20 transition-colors inline-flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Tetapkan Wali
                    </button>
                </div>
            )}
        </div>
    )
}

function NotesSection({ notes, setNotes, isNotesEditing, setIsNotesEditing, onSave, saving, isPrivacyMode }) {
    const [localNotes, setLocalNotes] = useState(notes || '')

    useEffect(() => { setLocalNotes(notes || '') }, [notes])

    return (
        <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Notepad className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <h3 className="text-xs font-black text-[var(--color-text)] flex-1">Catatan</h3>
                {!isNotesEditing ? (
                    <button onClick={() => setIsNotesEditing(true)}
                        className="text-[9px] font-bold text-[var(--color-primary)] hover:underline">
                        {notes ? 'Edit' : 'Tambah'}
                    </button>
                ) : (
                    <div className="flex items-center gap-1">
                        <button onClick={() => { setIsNotesEditing(false); setLocalNotes(notes || '') }}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all">
                            <X className="w-3 h-3" />
                        </button>
                        <button onClick={() => { onSave(localNotes); setIsNotesEditing(false) }} disabled={saving}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all disabled:opacity-50">
                            <FloppyDisk className="w-3 h-3" />
                        </button>
                    </div>
                )}
            </div>
            {isNotesEditing ? (
                <textarea value={localNotes} onChange={e => setLocalNotes(e.target.value)}
                    placeholder="Tulis catatan tentang kelas ini..."
                    className="w-full h-24 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 text-[11px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] placeholder:opacity-40 outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] resize-none"
                />
            ) : (
                <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                    {notes ? <PrivacyMask active={isPrivacyMode}>{notes}</PrivacyMask> : <span className="italic opacity-50">Belum ada catatan.</span>}
                </p>
            )}
        </div>
    )
}

function WarningsPanel({ cls, studentCount, onAddTeacher, collapsed, onToggleCollapse }) {
    const warnings = []
    if (!cls.homeroom_teacher_id) {
        warnings.push({ icon: UserCircle, color: 'amber', msg: 'Belum ada wali kelas ditugaskan', onClick: onAddTeacher })
    }
    if (!cls.academic_year) {
        warnings.push({ icon: Calendar, color: 'blue', msg: 'Belum ditahun akademik' })
    }
    if (studentCount === 0) {
        warnings.push({ icon: Users, color: 'amber', msg: 'Belum ada siswa terdaftar' })
    }
    if (cls.capacity && studentCount > cls.capacity) {
        warnings.push({ icon: Warning, color: 'red', msg: `Melebihi kapasitas (${studentCount}/${cls.capacity})` })
    }

    if (warnings.length === 0) return null

    return (
        <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <button onClick={onToggleCollapse} className="flex items-center gap-2.5 mb-0 w-full text-left">
                <div className="w-7 h-7 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Megaphone className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <h3 className="text-xs font-black text-[var(--color-text)] flex-1">Peringatan</h3>
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
                            <Wrapper key={i} onClick={w.onClick || undefined}
                                className={`flex items-center gap-2 py-2 text-left w-full transition-colors first:pt-0 last:pb-0 ${w.onClick ? 'hover:opacity-70 cursor-pointer' : ''}`}>
                                <Icon className={`w-3 h-3 shrink-0 ${w.color === 'red' ? 'text-red-500' : w.color === 'amber' ? 'text-amber-500' : 'text-blue-500'}`} />
                                <span className={`text-[10px] font-medium ${w.color === 'red' ? 'text-red-600' : w.color === 'amber' ? 'text-amber-600' : 'text-blue-600'}`}>
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

function ComparisonCard({ cls, studentCount, allClassesData, isPrivacyMode }) {
    if (!allClassesData || allClassesData.length < 2) return null

    const sorted = [...allClassesData].sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0))
    const rank = sorted.findIndex(c => c.id === cls.id) + 1
    const avgStudentsAll = sorted.reduce((s, c) => s + (c.studentCount || 0), 0) / sorted.length
    const avgCapacityAll = sorted.reduce((s, c) => s + (c.capacity || 0), 0) / sorted.length

    const hasStudents = studentCount > 0 || sorted.some(c => (c.studentCount || 0) > 0)
    const metrics = [
        ...(hasStudents ? [{ label: 'Peringkat Siswa', value: studentCount > 0 ? `#${rank}` : '—', sub: `dari ${sorted.length} kelas`, color: studentCount > 0 && rank <= 3 ? 'text-emerald-600' : 'text-[var(--color-text)]' }] : []),
        { label: 'Avg Siswa/Kelas', value: Math.round(avgStudentsAll), sub: `kelas ini: ${studentCount}`, color: studentCount >= avgStudentsAll ? 'text-emerald-600' : 'text-amber-600' },
        { label: 'Avg Kapasitas', value: Math.round(avgCapacityAll), sub: `kelas ini: ${cls.capacity || 0}`, color: 'text-[var(--color-text)]' },
    ]

    return (
        <div className="p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <TrendUp className="w-3 h-3 text-cyan-500" />
                </div>
                <h3 className="text-[10px] font-black text-[var(--color-text)]">Perbandingan</h3>
                <span className="text-[8px] font-bold text-[var(--color-text-muted)]">{sorted.length} kelas</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {metrics.map((m, i) => (
                    <div key={i} className="text-center p-2 rounded-xl bg-[var(--color-surface-alt)]/30 border border-[var(--color-border)]">
                        <span className={`text-sm font-black ${m.color}`}><PrivacyMask active={isPrivacyMode}>{m.value}</PrivacyMask></span>
                        <p className="text-[8px] font-bold text-[var(--color-text-muted)] leading-tight mt-0.5">{m.label}</p>
                        <p className="text-[7px] font-medium text-[var(--color-text-muted)]"><PrivacyMask active={isPrivacyMode}>{m.sub}</PrivacyMask></p>
                    </div>
                ))}
            </div>
        </div>
    )
}

function AuditTrail({ auditLogs, isPrivacyMode }) {
    if (!auditLogs || auditLogs.length === 0) return null

    return (
        <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <ClockCounterClockwise className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <h3 className="text-xs font-black text-[var(--color-text)]">Riwayat</h3>
                <span className="text-[9px] font-bold text-[var(--color-text-muted)]">{auditLogs.length} aktivitas</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
                {auditLogs.slice(0, 10).map((log, i) => (
                    <div key={log.id || i} className="flex items-start gap-2 py-1.5">
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-600' :
                            log.action === 'DELETE' ? 'bg-red-500/10 text-red-600' :
                            'bg-blue-500/10 text-blue-600'
                        }`}>
                            {log.action === 'CREATE' ? <Plus className="w-2.5 h-2.5" /> :
                             log.action === 'DELETE' ? <Trash className="w-2.5 h-2.5" /> :
                             <Pencil className="w-2.5 h-2.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-[var(--color-text)]">
                                {log.action === 'CREATE' ? 'Dibuat' : log.action === 'DELETE' ? 'Dihapus' : 'Diperbarui'}
                            </p>
                            <p className="text-[9px] text-[var(--color-text-muted)]">
                                <PrivacyMask active={isPrivacyMode}>{log.user_name || 'Sistem'}</PrivacyMask> · {formatDateTime(log.created_at)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function QuickLinks({ cls, isPrivacyMode }) {
    const links = [
        { label: 'Data Siswa Kelas Ini', sublabel: `${cls.name}`, icon: Users, color: 'blue', href: '/master/students', mask: true },
        { label: 'Tahun Akademik', sublabel: cls.academic_year || '-', icon: Calendar, color: 'emerald', href: '/master/periods', mask: true },
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
                        <a key={i} href={link.href}
                            className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 hover:bg-[var(--color-surface-alt)]/60 transition-colors group">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                link.color === 'blue' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'
                            }`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-[var(--color-text)]">{link.label}</p>
                                <p className="text-[9px] text-[var(--color-text-muted)]">
                                    {link.mask ? <PrivacyMask active={isPrivacyMode}>{link.sublabel}</PrivacyMask> : link.sublabel}
                                </p>
                            </div>
                            <ArrowSquareOut className="w-3.5 h-3.5 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                    )
                })}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-32 rounded-2xl" />
                        <Skeleton className="h-32 rounded-2xl" />
                    </div>
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
                            <Skeleton className="h-10 rounded-xl" />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
                    </div>
                    <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
                        <Skeleton className="h-4 w-32 rounded" />
                        <div className="space-y-2">
                            {[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-32 rounded-2xl" />
                    <Skeleton className="h-32 rounded-2xl" />
                    <Skeleton className="h-28 rounded-2xl" />
                    <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
                        <Skeleton className="h-4 w-32 rounded" />
                        <Skeleton className="h-24 rounded-xl" />
                        <Skeleton className="h-20 rounded-xl" />
                    </div>
                    <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
                        <Skeleton className="h-4 w-32 rounded" />
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

export default function ClassDetailPanel({ classId, onBack, teachersList = [], periodsList = [] }) {
    const { addToast } = useToast()
    const { enabled: canEdit } = useFlag('access.teacher_classes')
    const { profile } = useAuth()
    const { isPrivacyMode, togglePrivacyMode } = usePrivacyMode()

    const addToastRef = useRef(addToast)
    const onBackRef = useRef(onBack)
    useEffect(() => { addToastRef.current = addToast }, [addToast])
    useEffect(() => { onBackRef.current = onBack }, [onBack])

    const [cls, setCls] = useState(null)
    const [loading, setLoading] = useState(true)
    const [studentCount, setStudentCount] = useState(0)
    const [studentList, setStudentList] = useState([])
    const [teacherName, setTeacherName] = useState('')
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [copiedSummary, setCopiedSummary] = useState(false)
    const [lastRefresh, setLastRefresh] = useState(null)
    const [notes, setNotes] = useState('')
    const [isNotesEditing, setIsNotesEditing] = useState(false)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [warningsCollapsed, setWarningsCollapsed] = useState(false)
    const [auditLogs, setAuditLogs] = useState([])
    const [allClassesData, setAllClassesData] = useState([])

    /* ── Fetch ── */
    const fetchClass = useCallback(async () => {
        setLoading(true)
        try {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(classId)
            let query = supabase.from('classes').select('*').is('deleted_at', null)
            if (isUUID) {
                query = query.eq('uuid', classId)
            } else {
                query = query.eq('id', classId)
            }
            const { data, error } = await query.single()

            if (error || !data) {
                addToastRef.current('Kelas tidak ditemukan', 'error')
                onBackRef.current()
                return
            }
            setCls(data)
            setNotes(data.notes || '')
            setLastRefresh(new Date())

            // Fetch teacher name
            if (data.homeroom_teacher_id) {
                try {
                    const { data: teacher } = await supabase
                        .from('teachers')
                        .select('full_name')
                        .eq('id', data.homeroom_teacher_id)
                        .single()
                    setTeacherName(teacher?.full_name || '')
                } catch {
                    setTeacherName('')
                }
            } else {
                setTeacherName('')
            }

            // Fetch students
            try {
                const { data: students, count } = await supabase
                    .from('students')
                    .select('id, full_name, nisn', { count: 'exact' })
                    .eq('class_id', data.id)
                    .is('deleted_at', null)
                    .order('full_name')
                setStudentList(students || [])
                setStudentCount(count || 0)
            } catch {
                setStudentList([])
                setStudentCount(0)
            }

            // Fetch audit logs
            try {
                const { data: logs } = await supabase
                    .from('audit_logs')
                    .select('*')
                    .eq('tableName', 'classes')
                    .eq('recordId', data.id)
                    .order('created_at', { ascending: false })
                    .limit(10)
                setAuditLogs(logs || [])
            } catch {
                setAuditLogs([])
            }

            // Fetch all classes for comparison
            try {
                const { data: allClasses } = await supabase
                    .from('classes')
                    .select('id, name, grade_level, capacity')
                    .is('deleted_at', null)

                if (allClasses && allClasses.length > 0) {
                    const classIds = allClasses.map(c => c.id)
                    const { data: studentData } = await supabase
                        .from('students')
                        .select('class_id')
                        .in('class_id', classIds)
                        .is('deleted_at', null)

                    const countMap = {}
                    studentData?.forEach(s => {
                        countMap[s.class_id] = (countMap[s.class_id] || 0) + 1
                    })
                    const enriched = allClasses.map(c => ({ ...c, studentCount: countMap[c.id] || 0 }))
                    setAllClassesData(enriched)
                }
            } catch {
                setAllClassesData([])
            }
        } catch {
            addToastRef.current('Gagal memuat data kelas', 'error')
            onBackRef.current()
        } finally {
            setLoading(false)
        }
    }, [classId])

    useEffect(() => { fetchClass() }, [fetchClass])

    /* ── Handlers ── */
    const handleCopySummary = useCallback(() => {
        if (!cls) return
        const summary = [
            `Kelas: ${cls.name}`,
            `Level: ${cls.grade_level}`,
            `Program: ${getProgramInfo(cls.name).label}`,
            `Tahun Akademik: ${cls.academic_year || '-'}`,
            `Wali Kelas: ${teacherName || '-'}`,
            `Siswa: ${studentCount} / ${cls.capacity || '-'}`,
            `Status: ${cls.is_active ? 'Aktif' : 'Nonaktif'}`,
            `Dikunci: ${cls.is_locked ? 'Ya' : 'Tidak'}`,
            `Dibuat: ${formatDateTime(cls.created_at)}`,
        ].filter(Boolean).join('\n')
        navigator.clipboard.writeText(summary)
            .then(() => { setCopiedSummary(true); setTimeout(() => setCopiedSummary(false), 2000) })
            .catch(() => addToast('Gagal menyalin ringkasan', 'error'))
    }, [cls, teacherName, studentCount, addToast])

    const handleRefresh = useCallback(() => {
        fetchClass()
        addToast('Data diperbarui', 'info')
    }, [fetchClass, addToast])

    const handleEdit = useCallback(() => {
        setIsFormOpen(true)
    }, [])

    const handleSubmitEdit = useCallback(async (formData, setFormErrors) => {
        if (!cls || saving) return
        setSaving(true)
        const errors = {}
        if (!formData.name?.trim()) errors.name = 'Nama kelas wajib diisi'
        if (!formData.academic_year) errors.academic_year = 'Tahun akademik wajib diisi'
        if (Object.keys(errors).length > 0) { setFormErrors(errors); setSaving(false); return }
        try {
            const payload = {
                name: formData.name.trim(),
                grade_level: formData.level ? Number(formData.level) : cls.grade_level,
                academic_year: formData.academic_year,
                homeroom_teacher_id: formData.homeroom_teacher_id || null,
                capacity: formData.capacity ? Number(formData.capacity) : cls.capacity,
            }
            const { error } = await supabase.from('classes').update(payload).eq('id', cls.id)
            if (error) throw error
            addToast('Kelas berhasil diupdate', 'success')
            try { await logAudit({ action: 'UPDATE', source: 'MASTER', tableName: 'classes', recordId: cls.id, oldData: cls, newData: { ...cls, ...payload } }) } catch { /* skip */ }
            setIsFormOpen(false)
            fetchClass()
        } catch (err) {
            addToast(err?.message || 'Gagal menyimpan', 'error')
        } finally {
            setSaving(false)
        }
    }, [cls, saving, addToast, fetchClass])

    const handleDeleteConfirm = useCallback(async () => {
        if (!cls || deleting) return
        setDeleting(true)
        try {
            const deletedAt = new Date().toISOString()
            const { error } = await supabase.from('classes').update({ deleted_at: deletedAt, deleted_by: profile?.id || null }).eq('id', cls.id)
            if (error) throw error
            addToast('Kelas berhasil diarsipkan', 'success')
            try { await logAudit({ action: 'UPDATE', source: 'MASTER', tableName: 'classes', recordId: cls.id, oldData: cls, newData: { ...cls, deleted_at: deletedAt, deleted_by: profile?.id } }) } catch { /* skip */ }
            onBack()
        } catch (err) {
            addToast(err?.message || 'Gagal mengarsipkan', 'error')
        } finally {
            setDeleting(false)
            setIsDeleteOpen(false)
        }
    }, [cls, deleting, addToast, onBack, profile])

    const handleToggleLock = useCallback(async () => {
        if (!cls || saving) return
        const newStatus = !cls.is_locked
        const updatePayload = newStatus
            ? { is_locked: true, locked_at: new Date().toISOString(), locked_by: profile?.id ?? null }
            : { is_locked: false, locked_at: null, locked_by: null }
        setCls(prev => prev ? { ...prev, ...updatePayload } : prev)
        setSaving(true)
        try {
            const { error } = await supabase.from('classes').update(updatePayload).eq('id', cls.id)
            if (error) throw error
            addToast(newStatus ? 'Kelas dikunci' : 'Kunci kelas dibuka', 'success')
            try { await logAudit({ action: 'UPDATE', source: 'MASTER', tableName: 'classes', recordId: cls.id, oldData: cls, newData: { ...cls, ...updatePayload } }) } catch { /* skip */ }
            fetchClass()
        } catch (err) {
            setCls(prev => prev ? { ...prev, ...cls } : prev)
            addToast(err?.message || 'Gagal mengubah kunci', 'error')
        } finally {
            setSaving(false)
        }
    }, [cls, saving, addToast, profile, fetchClass])

    const handleToggleActive = useCallback(async () => {
        if (!cls || saving) return
        const newActive = !cls.is_active
        setCls(prev => prev ? { ...prev, is_active: newActive } : prev)
        setSaving(true)
        try {
            const { error } = await supabase.from('classes').update({ is_active: newActive }).eq('id', cls.id)
            if (error) throw error
            addToast(newActive ? 'Kelas diaktifkan' : 'Kelas dinonaktifkan', 'success')
            logAudit({ action: 'UPDATE', source: 'MASTER', tableName: 'classes', recordId: cls.id, oldData: cls, newData: { ...cls, is_active: newActive } }).catch(() => {})
        } catch (err) {
            setCls(prev => prev ? { ...prev, is_active: cls.is_active } : prev)
            addToast(err?.message || 'Gagal mengubah status', 'error')
        } finally {
            setSaving(false)
        }
    }, [cls, saving, addToast])

    const handleSaveNotes = useCallback(async (newNotes) => {
        if (!cls) return
        try {
            const { error } = await supabase.from('classes').update({ notes: newNotes }).eq('id', cls.id)
            if (error) throw error
            setCls(prev => prev ? { ...prev, notes: newNotes } : prev)
            setNotes(newNotes)
            addToast('Catatan disimpan', 'success')
        } catch {
            addToast('Gagal menyimpan catatan', 'error')
        }
    }, [cls, addToast])

    const goBack = useCallback(() => onBack(), [onBack])
    const handlePrint = useCallback(() => { window.print() }, [])

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

    if (!cls) return null

    /* ── Derived values ── */
    const gradeStyle = getGradeStyle(cls.grade_level)
    const programInfo = getProgramInfo(cls.name)
    const genderInfo = getGenderInfo(cls.name)
    const isNoTeacher = !cls.homeroom_teacher_id
    const isCrowded = cls.capacity && studentCount > cls.capacity
    const occupancyPct = cls.capacity ? Math.min(100, Math.round((studentCount / cls.capacity) * 100)) : 0

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
                        title="Kembali ke Data Kelas (Esc)">
                        <CaretLeft className="w-3.5 h-3.5" />
                        <span>Data Kelas</span>
                    </button>
                    {lastRefresh && (
                        <span className="text-[8px] font-bold text-[var(--color-text-muted)] ml-1">
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
                            Detail Kelas
                        </h1>
                        <p className="text-[var(--color-text-muted)] text-[10px] mt-0.5 font-medium">
                            <PrivacyMask active={isPrivacyMode}>{cls.name}</PrivacyMask> — informasi lengkap kelas.
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 min-w-0 overflow-x-auto scrollbar-hide lg:shrink-0 -mx-5 px-5 lg:mx-0 lg:px-0 py-0.5">
                        <Tooltip content={!canEdit ? 'Akses terbatas' : cls.is_locked ? 'Buka kunci terlebih dahulu' : 'Edit (E)'} position="bottom">
                            <button onClick={handleEdit} disabled={!canEdit || cls.is_locked}
                                className="h-8 px-3 rounded-lg bg-[var(--color-primary)] text-white flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-[var(--color-primary)]/20 disabled:opacity-40 disabled:cursor-not-allowed">
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                        </Tooltip>
                        <Tooltip content={cls.is_locked ? 'Terkunci' : !canEdit ? 'Akses terbatas' : cls.is_active ? 'Nonaktifkan' : 'Aktifkan'} position="bottom">
                            <button onClick={handleToggleActive} disabled={!canEdit || cls.is_locked || saving}
                                className="h-8 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-1.5 transition-all hover:bg-[var(--color-surface-alt)] disabled:opacity-40 disabled:cursor-not-allowed">
                                {cls.is_active ? <Prohibit className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            </button>
                        </Tooltip>
                        <Tooltip content={!canEdit ? 'Akses terbatas' : cls.is_locked ? 'Buka Kunci (L)' : 'Kunci (L)'} position="bottom">
                            <button onClick={handleToggleLock} disabled={!canEdit || saving}
                                className={`h-8 px-3 rounded-lg border flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                    cls.is_locked ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)]'
                                }`}>
                                {cls.is_locked ? <LockOpen className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            </button>
                        </Tooltip>
                        <Tooltip content="Arsipkan" position="bottom">
                            <button onClick={() => setIsDeleteOpen(true)} disabled={!canEdit || cls.is_locked}
                                className="h-8 px-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 flex items-center gap-1.5 transition-all hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed">
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
                        <div className="w-px h-5 bg-[var(--color-border)] mx-0.5 shrink-0" />
                        <Tooltip content="Cetak (Ctrl+P)" position="bottom">
                            <button onClick={handlePrint}
                                className="h-8 w-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center transition-all hover:bg-[var(--color-surface-alt)] shrink-0">
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
                            <WarningsPanel cls={cls} studentCount={studentCount}
                                onAddTeacher={handleEdit} collapsed={warningsCollapsed}
                                onToggleCollapse={() => setWarningsCollapsed(v => !v)} />
                            <HealthScore cls={cls} studentCount={studentCount} isPrivacyMode={isPrivacyMode} />
                        </div>

                        {/* Main Header Card */}
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
                            {/* Status accent bar */}
                            <div className={`h-1 w-full bg-gradient-to-r ${
                                cls.is_active ? 'from-emerald-500 to-teal-400' : 'from-zinc-400 to-zinc-300'
                            }`} />

                            <div className="p-5 space-y-4">
                                {/* Title row */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
                                            Nama Kelas
                                        </p>
                                        <h2 className="text-2xl font-black text-[var(--color-text)] leading-tight">
                                            <PrivacyMask active={isPrivacyMode}>{cls.name}</PrivacyMask>
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${gradeStyle.bg} ${gradeStyle.text} border-current/20`}>
                                                Level <PrivacyMask active={isPrivacyMode}>{gradeStyle.label}</PrivacyMask>
                                            </span>
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                programInfo.color === 'blue' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                                            }`}>
                                                <programInfo.icon className="w-3 h-3" /> <PrivacyMask active={isPrivacyMode}>{programInfo.label}</PrivacyMask>
                                            </span>
                                            {genderInfo.icon && (
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                    genderInfo.color === 'sky' ? 'bg-sky-500/10 text-sky-600 border-sky-500/20' : 'bg-pink-500/10 text-pink-600 border-pink-500/20'
                                                }`}>
                                                    <genderInfo.icon className="w-3 h-3" /> <PrivacyMask active={isPrivacyMode}>{genderInfo.label}</PrivacyMask>
                                                </span>
                                            )}
                                            {cls.is_active && (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                                    <CheckCircle className="w-3 h-3" /> Aktif
                                                </span>
                                            )}
                                            {cls.is_locked && (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                                    <Lock className="w-3 h-3" /> Terkunci
                                                </span>
                                            )}
                                            {isNoTeacher && (
                                                <Tooltip content="Wali kelas belum ditugaskan — penting untuk komunikasi orang tua" position="top">
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 border border-amber-500/20 cursor-help">
                                                        <Warning className="w-3 h-3" /> Tanpa Wali
                                                    </span>
                                                </Tooltip>
                                            )}
                                            {isCrowded && (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-600 border border-rose-500/20">
                                                    Melebihi Kapasitas
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                                        cls.is_active
                                            ? 'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary)]/70 text-white shadow-lg shadow-[var(--color-primary)]/30'
                                            : 'bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-muted)]'
                                    }`}>
                                        <span className="text-lg font-black">{cls.grade_level}</span>
                                    </div>
                                </div>

                                {/* Lifecycle Timeline */}
                                <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2.5">Lifecycle</p>
                                    <LifecycleTimeline cls={cls} />
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 space-y-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded-md bg-blue-500/10 flex items-center justify-center">
                                                <Users className="w-3 h-3 text-blue-500" />
                                            </div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Siswa</p>
                                        </div>
                                        <p className="text-xs font-black text-[var(--color-text)]"><PrivacyMask active={isPrivacyMode}>{studentCount}</PrivacyMask></p>
                                    </div>

                                    <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 space-y-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center">
                                                <Buildings className="w-3 h-3 text-emerald-500" />
                                            </div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Kapasitas</p>
                                        </div>
                                        <p className="text-xs font-black text-[var(--color-text)]"><PrivacyMask active={isPrivacyMode}>{cls.capacity || '-'}</PrivacyMask></p>
                                    </div>

                                    <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 space-y-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded-md bg-purple-500/10 flex items-center justify-center">
                                                <Calendar className="w-3 h-3 text-purple-500" />
                                            </div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Tahun Akademik</p>
                                        </div>
                                        <p className="text-xs font-black text-[var(--color-text)]">
                                            <PrivacyMask active={isPrivacyMode}>{cls.academic_year || '-'}</PrivacyMask>
                                        </p>
                                    </div>

<div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/30 space-y-1.5 cursor-default"
                                         title={studentCount === 0 ? 'Belum ada siswa terdaftar' : `${studentCount} dari ${cls.capacity || 0} kapasitas terisi`}>
                                         <div className="flex items-center gap-1.5">
                                             <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                                                 occupancyPct > 100 ? 'bg-red-500/10' : occupancyPct > 80 ? 'bg-amber-500/10' : 'bg-emerald-500/10'
                                             }`}>
                                                 <Gauge className={`w-3 h-3 ${
                                                     occupancyPct > 100 ? 'text-red-500' : occupancyPct > 80 ? 'text-amber-500' : 'text-emerald-500'
                                                 }`} />
                                             </div>
                                             <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Okupansi</p>
                                         </div>
                                         <p className="text-xs font-black text-[var(--color-text)]"><PrivacyMask active={isPrivacyMode}>{occupancyPct}%</PrivacyMask></p>
                                         {cls.capacity && (
                                             <div className="h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                                                 <div className={`h-full rounded-full transition-all ${occupancyPct > 100 ? 'bg-red-500' : occupancyPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                     style={{ width: `${Math.min(100, occupancyPct)}%` }} />
                                             </div>
                                         )}
                                     </div>
                                </div>
                            </div>
                        </div>

                        {/* Lock Info Alert */}
                        {cls.is_locked && (
                            <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-200 bg-amber-50">
                                <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                                    <Lock className="w-4 h-4 text-amber-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-black text-amber-800 mb-0.5">Kelas Terkunci</p>
                                    <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                                        Dikunci pada {formatDateTime(cls.locked_at)}
                                    </p>
                                    <p className="text-[10px] text-amber-600 font-medium mt-1">
                                        Data tidak dapat diedit atau diubah statusnya selama terkunci.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Student List */}
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
                            <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <Users className="w-3.5 h-3.5 text-blue-500" />
                                    </div>
                                    <h3 className="text-xs font-black text-[var(--color-text)]">Daftar Siswa</h3>
                                </div>
                                {studentCount > 0 && (
                                    <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                        {studentCount} siswa
                                    </span>
                                )}
                            </div>
                            <div className="p-4">
                                {studentList.length === 0 ? (
                                    <div className="py-10 text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                                            <Users className="w-6 h-6 text-amber-500" />
                                        </div>
                                        <p className="text-[11px] font-black text-[var(--color-text)]">Belum ada siswa terdaftar</p>
                                        <p className="text-[10px] text-[var(--color-text-muted)] mt-1 max-w-[200px] mx-auto">
                                            Daftarkan siswa ke kelas ini untuk mulai mengelola data.
                                        </p>
                                        <a href="/master/students"
                                            className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-[10px] font-black hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-[var(--color-primary)]/20">
                                            <Plus className="w-3.5 h-3.5" /> Daftarkan Siswa
                                        </a>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-[var(--color-border)] max-h-64 overflow-y-auto">
                                        {studentList.slice(0, 20).map((s, i) => (
                                            <div key={s.id} className="flex items-center gap-3 py-2">
                                                <div className="w-7 h-7 rounded-lg bg-[var(--color-surface-alt)] flex items-center justify-center text-[9px] font-black text-[var(--color-text-muted)]">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] font-bold text-[var(--color-text)] truncate">
                                                        <PrivacyMask active={isPrivacyMode}>{s.full_name}</PrivacyMask>
                                                    </p>
                                                    <p className="text-[9px] text-[var(--color-text-muted)]">NISN: <PrivacyMask active={isPrivacyMode}>{s.nisn}</PrivacyMask></p>
                                                </div>
                                            </div>
                                        ))}
                                        {studentList.length > 20 && (
                                            <p className="text-[10px] text-[var(--color-text-muted)] text-center py-2">
                                                +{studentList.length - 20} siswa lainnya
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Notes / Catatan Internal */}
                        <NotesSection
                            notes={notes}
                            setNotes={setNotes}
                            isNotesEditing={isNotesEditing}
                            setIsNotesEditing={setIsNotesEditing}
                            onSave={handleSaveNotes}
                            saving={saving}
                            isPrivacyMode={isPrivacyMode}
                        />
                    </div>

                    {/* ── Right Column (1/3) ── */}
                    <div className="space-y-4">
                        {/* Quick Links */}
                        <QuickLinks cls={cls} isPrivacyMode={isPrivacyMode} />

                        {/* Comparison Card */}
                        <ComparisonCard cls={cls} studentCount={studentCount} allClassesData={allClassesData} isPrivacyMode={isPrivacyMode} />

                        {/* Teacher Info */}
                        <TeacherInfoCard cls={cls} teacherName={teacherName} onEdit={handleEdit} isPrivacyMode={isPrivacyMode} />

                        {/* Informasi / Metadata */}
                        <div className="p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-5 h-5 rounded-lg bg-zinc-500/10 flex items-center justify-center">
                                    <Info className="w-3 h-3 text-[var(--color-text-muted)]" />
                                </div>
                                <h3 className="text-[10px] font-black text-[var(--color-text)]">Informasi</h3>
                            </div>

                            {/* Quick actions row */}
                            <button
                                onClick={handleCopySummary}
                                className={`w-full flex items-center gap-1.5 p-2 rounded-lg border text-left transition-all mb-2 ${
                                    copiedSummary
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                                        : 'bg-[var(--color-surface-alt)]/30 border-[var(--color-border)] hover:bg-[var(--color-border)]/50'
                                }`}
                            >
                                <Copy className="w-3 h-3 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[8px] font-black uppercase text-[var(--color-text-muted)]">Ringkasan Kelas</p>
                                    <p className="text-[9px] font-medium text-[var(--color-text-muted)]">Salin untuk laporan</p>
                                </div>
                            </button>

                            {/* Metadata rows */}
                            <div className="space-y-0 divide-y divide-[var(--color-border)]/50">
                                <div className="flex justify-between items-center py-1.5">
                                    <span className="text-[9px] font-bold text-[var(--color-text-muted)]">Dibuat</span>
                                    <span className="text-[9px] font-bold text-[var(--color-text)]"><PrivacyMask active={isPrivacyMode}>{formatDate(cls.created_at)}</PrivacyMask></span>
                                </div>
                                {cls.updated_at && cls.updated_at !== cls.created_at && (
                                    <div className="flex justify-between items-center py-1.5">
                                        <span className="text-[9px] font-bold text-[var(--color-text-muted)]">Diperbarui</span>
                                        <span className="text-[9px] font-bold text-[var(--color-text)]"><PrivacyMask active={isPrivacyMode}>{formatDate(cls.updated_at)}</PrivacyMask></span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center py-1.5">
                                    <span className="text-[9px] font-bold text-[var(--color-text-muted)]">Status Aktif</span>
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                                        cls.is_active
                                            ? 'bg-emerald-500/10 text-emerald-600'
                                            : 'bg-zinc-500/10 text-zinc-500'
                                    }`}>
                                        {cls.is_active ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1.5">
                                    <span className="text-[9px] font-bold text-[var(--color-text-muted)]">Status Kunci</span>
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                                        cls.is_locked
                                            ? 'bg-amber-500/10 text-amber-600'
                                            : 'bg-emerald-500/10 text-emerald-600'
                                    }`}>
                                        {cls.is_locked ? 'Terkunci' : 'Terbuka'}
                                    </span>
                                </div>
                                {cls.locked_at && (
                                    <div className="flex justify-between items-center py-1.5">
                                        <span className="text-[9px] font-bold text-[var(--color-text-muted)]">Dikunci Pada</span>
                                        <span className="text-[9px] font-bold text-[var(--color-text)]"><PrivacyMask active={isPrivacyMode}>{formatDate(cls.locked_at)}</PrivacyMask></span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Riwayat Perubahan */}
                        <div className="p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-5 h-5 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                    <ClockCounterClockwise className="w-3 h-3 text-indigo-500" />
                                </div>
                                <h3 className="text-[10px] font-black text-[var(--color-text)]">Riwayat Perubahan</h3>
                                <span className="text-[8px] font-bold text-[var(--color-text-muted)]">{auditLogs.length} aktivitas</span>
                            </div>
                            <AuditTrail auditLogs={auditLogs} isPrivacyMode={isPrivacyMode} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Modals ── */}
            <ClassFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                selectedItem={cls}
                teachersList={teachersList}
                periodsList={periodsList}
                onSubmit={handleSubmitEdit}
                submitting={saving}
            />

            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Arsipkan Kelas"
                description="Yakin ingin mengarsipkan kelas ini?"
                icon={Archive}
                iconBg="bg-amber-500/10"
                iconColor="text-amber-500"
                confirmText="Arsipkan"
                confirmIcon={Archive}
                confirmColor="amber"
                submitting={deleting}
            >
                <p className="text-[11px] font-bold text-[var(--color-text-muted)] leading-relaxed">
                    Kelas <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 font-black mx-0.5">{cls.name}</span> akan dipindahkan ke arsip. Anda dapat memulihkannya nanti.
                </p>
            </ConfirmDialog>
        </div>
    )
}
