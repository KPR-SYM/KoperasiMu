import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
    CaretLeft, Pencil, Printer, Users, GraduationCap,
    ClockCounterClockwise, Copy, Info,
    GenderMale, GenderFemale, SealCheck, Calendar, IdentificationCard,
    MapPin, ChatCircle, Tag, UserCheck,
    Prohibit, CheckCircle, Archive, Eye, EyeSlash, ArrowClockwise,
} from '@phosphor-icons/react'
import { supabase } from '@lib/supabase'
import { useFlag } from '@context/FeatureFlags'
import { useToast } from '@context/Toast'
import { useAuth } from '@context/Auth'
import { logAudit } from '@utils/auditLogger'
import { Skeleton, AuditTimeline, ConfirmDialog } from '@shared/components'
import { PrivacyMask } from '@shared/components'
import { usePrivacyMode } from '@shared/hooks/usePrivacyMode'
import StudentFormModal from '@features/students/components/StudentFormModal'

const STATUS_CONFIG = {
    aktif: { label: 'Aktif', color: 'bg-emerald-500 text-white border-white/20' },
    lulus: { label: 'Lulus', color: 'bg-blue-500 text-white border-white/20' },
    pindah: { label: 'Pindah', color: 'bg-amber-500 text-white border-white/20' },
    keluar: { label: 'Keluar', color: 'bg-rose-500 text-white border-white/20' },
}

function formatDate(dateStr) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function calculateAge(birthDate) {
    if (!birthDate) return null
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
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

function InfoRow({ label, value, hint, isPrivacyMode, icon }) {
    return (
        <div className="space-y-1">
            <p className="text-[9px] font-black uppercase text-[var(--color-text-muted)] tracking-widest opacity-80 flex items-center gap-1.5">
                {icon && <icon className="opacity-50 w-2 h-2" />} {label}
            </p>
            {value ? (
                <p className="text-[12px] font-bold text-[var(--color-text)] truncate" title={typeof value === 'string' ? value : undefined}>
                    <PrivacyMask active={isPrivacyMode}>{value}</PrivacyMask>
                </p>
            ) : (
                <p className="text-[11px] text-[var(--color-text-muted)] italic">{hint || 'Belum diisi'}</p>
            )}
        </div>
    )
}

function SectionCard({ icon, iconBg, accent, title, children }) {
    const Icon = icon
    return (
        <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-4">
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

export default function StudentDetailPanel({ studentId, onBack, classesList = [], canEdit }) {
    const { addToast } = useToast()
    const { profile } = useAuth()
    const { enabled: canEditFlag } = useFlag('students.edit')
    const editable = canEdit ?? canEditFlag

    const addToastRef = useRef(addToast)
    const onBackRef = useRef(onBack)
    useEffect(() => { addToastRef.current = addToast }, [addToast])
    useEffect(() => { onBackRef.current = onBack }, [onBack])

    const [student, setStudent] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [profileTab, setProfileTab] = useState('info')
    const [lastRefresh, setLastRefresh] = useState(null)

    const isAdmin = ['developer', 'admin'].includes(profile?.role)
    const { isPrivacyMode, togglePrivacyMode } = usePrivacyMode()

    const fetchStudent = useCallback(async () => {
        setLoading(true)
        try {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentId)
            let query = supabase.from('students').select('*').is('deleted_at', null)
            if (isUUID) {
                query = query.eq('uuid', studentId)
            } else {
                query = query.eq('id', studentId)
            }
            const { data, error } = await query.single()
            if (error || !data) {
                addToastRef.current('Siswa tidak ditemukan', 'error')
                onBackRef.current()
                return
            }
            setStudent(data)
            setLastRefresh(new Date())
        } catch {
            addToastRef.current('Gagal memuat data siswa', 'error')
            onBackRef.current()
        } finally {
            setLoading(false)
        }
    }, [studentId])

    useEffect(() => { fetchStudent() }, [fetchStudent])

    const handleRefresh = useCallback(() => {
        fetchStudent()
        addToast('Data diperbarui', 'info')
    }, [fetchStudent, addToast])

    const handleDeleteConfirm = useCallback(async () => {
        if (!student || deleting) return
        setDeleting(true)
        try {
            const { error } = await supabase.from('students').update({ deleted_at: new Date().toISOString() }).eq('id', student.id)
            if (error) throw error
            addToast('Siswa berhasil diarsipkan', 'success')
            logAudit({ action: 'UPDATE', source: 'MASTER', tableName: 'students', recordId: student.id, oldData: student, newData: { ...student, deleted_at: new Date().toISOString() } }).catch(() => {})
            onBack()
        } catch (err) {
            addToast(err?.message || 'Gagal mengarsipkan', 'error')
        } finally {
            setDeleting(false)
            setIsDeleteOpen(false)
        }
    }, [student, deleting, addToast, onBack])

    const handleEdit = useCallback(() => setIsFormOpen(true), [])

    const handleSubmitEdit = useCallback(async (payload) => {
        if (!student || saving) return
        setSaving(true)
        try {
            const { error } = await supabase.from('students').update({
                name: payload.name,
                nisn: payload.nisn,
                gender: payload.gender,
                birth_date: payload.birth_date,
                address: payload.address,
                phone: payload.phone,
                class_id: payload.class_id,
                status: payload.status || 'aktif',
            }).eq('id', student.id)
            if (error) throw error
            addToast('Data siswa berhasil diupdate', 'success')
            logAudit({ action: 'UPDATE', source: 'MASTER', tableName: 'students', recordId: student.id, oldData: student, newData: { ...student, ...payload } }).catch(() => {})
            setIsFormOpen(false)
            fetchStudent()
            return null
        } catch (err) {
            return { error: true, code: err.code, message: 'Gagal menyimpan data.' }
        } finally {
            setSaving(false)
        }
    }, [student, saving, addToast, fetchStudent])

    const goBack = useCallback(() => onBack(), [onBack])
    const handlePrint = useCallback(() => window.print(), [])
    const handlePrintRef = useRef(handlePrint)
    useEffect(() => { handlePrintRef.current = handlePrint }, [handlePrint])
    const handleEditRef = useRef(handleEdit)
    const goBackRef = useRef(goBack)
    useEffect(() => { handleEditRef.current = handleEdit }, [handleEdit])
    useEffect(() => { goBackRef.current = goBack }, [goBack])

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
            if (e.key === 'Escape') { e.preventDefault(); goBackRef.current() }
            else if ((e.key === 'e' || e.key === 'E') && !e.ctrlKey && !e.metaKey) { e.preventDefault(); handleEditRef.current() }
            else if ((e.key === 'p' || e.key === 'P') && !e.ctrlKey && !e.metaKey) { e.preventDefault(); handlePrintRef.current() }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

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

    if (!student) return null

    const genderInfo = student.gender === 'L' ? { label: 'Laki-laki', icon: GenderMale, color: 'text-sky-500' } : student.gender === 'P' ? { label: 'Perempuan', icon: GenderFemale, color: 'text-pink-500' } : null
    const age = calculateAge(student.birth_date)
    const statusInfo = STATUS_CONFIG[student.status] || STATUS_CONFIG.aktif
    const className = classesList?.find(c => c.id === student.class_id)?.name || student.className || '-'

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

            <div className="px-5 pt-5 pb-3 no-print">
                <div className="flex items-center gap-2 mb-3">
                    <button onClick={goBack}
                        className="h-7 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-1 text-[10px] font-black text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-all shrink-0"
                        title="Kembali ke Data Siswa (Esc)">
                        <CaretLeft className="w-3.5 h-3.5" />
                        <span>Data Siswa</span>
                    </button>
                    {lastRefresh && (
                        <span className="text-[8px] font-bold text-[var(--color-text-muted)] ml-1">
                            Diperbarui {formatDate(lastRefresh)}
                        </span>
                    )}
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black font-heading tracking-tight text-[var(--color-text)] leading-tight flex items-center gap-2">
                            <PrivacyMask active={isPrivacyMode}>{student.name}</PrivacyMask>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                                {statusInfo.label}
                            </span>
                        </h1>
                        <p className="text-[var(--color-text-muted)] text-[10px] mt-0.5 font-medium">
                            NISN: <PrivacyMask active={isPrivacyMode}>{student.nisn || '-'}</PrivacyMask> · {className}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={togglePrivacyMode}
                            className={`h-8 px-3 rounded-xl border flex items-center gap-1.5 text-[10px] font-black transition-all active:scale-95 ${isPrivacyMode ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}>
                            {isPrivacyMode ? <EyeSlash className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            Privasi
                        </button>
                        <button onClick={handleRefresh} className="h-8 px-3 rounded-xl border border-[var(--color-border)] text-[10px] font-black text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center gap-1.5 transition-all active:scale-95">
                            <ArrowClockwise className="w-3 h-3" /> Refresh
                        </button>
                        <button onClick={handlePrint} className="h-8 px-3 rounded-xl border border-[var(--color-border)] text-[10px] font-black text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center gap-1.5 transition-all active:scale-95">
                            <Printer className="w-3 h-3" /> Print
                        </button>
                        {editable && (
                            <button onClick={handleEdit} className="h-8 px-4 rounded-xl bg-[var(--color-primary)] text-white text-[10px] font-black flex items-center gap-1.5 transition-all hover:brightness-110 active:scale-95 shadow-md">
                                <Pencil className="w-3 h-3" /> Edit
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="px-5 pb-5 space-y-4 print-area">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SectionCard icon={IdentificationCard} iconBg="text-sky-500" accent="bg-sky-500" title="Identitas">
                        <div className="grid grid-cols-2 gap-4">
                            <InfoRow label="Nama Lengkap" value={student.name} isPrivacyMode={isPrivacyMode} icon={UserCheck} />
                            <InfoRow label="NISN" value={student.nisn} isPrivacyMode={isPrivacyMode} icon={IdentificationCard} />
                            <InfoRow label="Jenis Kelamin" value={genderInfo?.label} isPrivacyMode={isPrivacyMode} icon={genderInfo?.icon} />
                            <InfoRow label="Tanggal Lahir" value={student.birth_date ? formatDate(student.birth_date) : null} hint={age ? `${age} tahun` : undefined} isPrivacyMode={isPrivacyMode} icon={Calendar} />
                        </div>
                    </SectionCard>

                    <SectionCard icon={ChatCircle} iconBg="text-emerald-500" accent="bg-emerald-500" title="Kontak & Alamat">
                        <div className="grid grid-cols-2 gap-4">
                            <InfoRow label="No. WhatsApp" value={student.phone} isPrivacyMode={isPrivacyMode} icon={ChatCircle} />
                            <InfoRow label="Alamat" value={student.address} isPrivacyMode={isPrivacyMode} icon={MapPin} />
                        </div>
                    </SectionCard>

                    <SectionCard icon={GraduationCap} iconBg="text-violet-500" accent="bg-violet-500" title="Akademik">
                        <div className="grid grid-cols-2 gap-4">
                            <InfoRow label="Kelas" value={className} isPrivacyMode={isPrivacyMode} icon={GraduationCap} />
                            <InfoRow label="Status" value={statusInfo.label} isPrivacyMode={isPrivacyMode} icon={CheckCircle} />
                            <InfoRow label="Dibuat" value={formatDate(student.created_at)} isPrivacyMode={isPrivacyMode} icon={Calendar} />
                            <InfoRow label="Diupdate" value={formatDate(student.updated_at)} isPrivacyMode={isPrivacyMode} icon={ClockCounterClockwise} />
                        </div>
                    </SectionCard>

                    <SectionCard icon={Tag} iconBg="text-amber-500" accent="bg-amber-500" title="Label & Info">
                        <div className="grid grid-cols-2 gap-4">
                            <InfoRow label="Tags" value={Array.isArray(student.tags) ? student.tags.join(', ') : student.tags || null} isPrivacyMode={isPrivacyMode} icon={Tag} />
                            <InfoRow label="Foto" value={student.foto ? 'Ada' : null} hint="Belum ada foto" isPrivacyMode={isPrivacyMode} icon={SealCheck} />
                        </div>
                    </SectionCard>
                </div>

                <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                    <div className="flex items-center gap-2.5 pt-1 mb-4">
                        <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                        <ClockCounterClockwise className="text-indigo-500 w-3 h-3 opacity-70" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Riwayat Aktivitas</span>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--color-border)] to-transparent opacity-40" />
                    </div>
                    <AuditTimeline tableName="students" recordId={student.id} />
                </div>

                {isAdmin && (
                    <div className="flex justify-end">
                        <button onClick={() => setIsDeleteOpen(true)} className="h-8 px-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 text-[10px] font-black flex items-center gap-1.5 transition-all hover:bg-red-500 hover:text-white active:scale-95">
                            <Archive className="w-3 h-3" /> Arsipkan Siswa
                        </button>
                    </div>
                )}
            </div>

            {isFormOpen && (
                <StudentFormModal
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    onSubmit={handleSubmitEdit}
                    initialData={student}
                    classesList={classesList}
                    isEdit
                />
            )}

            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Arsipkan Siswa?"
                description={`Siswa "${student.name}" akan diarsipkan. Data tetap aman dan dapat dipulihkan.`}
                icon={Archive}
                iconBg="bg-amber-500/10"
                iconColor="text-amber-600"
                confirmText="Arsipkan"
                confirmIcon={Archive}
                confirmColor="amber"
                submitting={deleting}
            />
        </div>
    )
}
