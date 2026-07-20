import React, { useState, useRef, useEffect, useCallback, memo } from 'react'
import {
    User, Camera, Spinner, FloppyDisk, CheckCircle, Pencil, Plus,
    GraduationCap, ChatCircle, Warning, XCircle, GenderMale, GenderFemale,
    Student, ArrowRight, SignOut,
} from '@phosphor-icons/react'
import { supabase } from '@lib/supabase'
import Modal from '@shared/components/Modal'
import Select from '@shared/components/Select'

/* ─── constants ─────────────────────────────────────────────── */
const GENDER_OPTIONS = [
    {
        val: 'L', label: 'Putra', icon: GenderMale,
        active: 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/30 border-transparent',
        dot: 'bg-white/70',
    },
    {
        val: 'P', label: 'Putri', icon: GenderFemale,
        active: 'bg-rose-500 text-white shadow-md shadow-rose-500/30 border-transparent',
        dot: 'bg-white/70',
    },
]

const STATUS_OPTIONS = [
    {
        key: 'aktif', label: 'Aktif', icon: CheckCircle,
        active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35',
        dot: 'bg-emerald-400',
    },
    {
        key: 'lulus', label: 'Lulus', icon: GraduationCap,
        active: 'bg-blue-500/15 text-blue-400 border-blue-500/35',
        dot: 'bg-blue-400',
    },
    {
        key: 'keluar', label: 'Keluar', icon: SignOut,
        active: 'bg-orange-500/15 text-orange-400 border-orange-500/35',
        dot: 'bg-orange-400',
    },
]

/* ─── tiny helper components ───────────────────────────────── */
function FieldLabel({ children, required, optional }) {
    return (
        <label className="flex items-center gap-1 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest ml-0.5 mb-1.5">
            {children}
            {required && <span className="text-rose-400 ml-0.5">*</span>}
            {optional && (
                <span className="text-[var(--color-text-muted)] opacity-35 normal-case font-normal tracking-normal ml-1">
                    (opsional)
                </span>
            )}
        </label>
    )
}

function FieldWrapper({ children, status, helperText }) {
    return (
        <div>
            {children}
            {status === 'error' && helperText && (
                <p className="flex items-center gap-1 mt-1.5 ml-0.5 text-[10px] text-rose-400 animate-in slide-in-from-top-1 duration-200">
                    <XCircle className="w-3 h-3 shrink-0" />
                    {helperText}
                </p>
            )}
            {status === 'warning' && helperText && (
                <p className="flex items-center gap-1 mt-1.5 ml-0.5 text-[10px] text-amber-400 animate-in slide-in-from-top-1 duration-200">
                    <Warning className="w-3 h-3 shrink-0" />
                    {helperText}
                </p>
            )}
        </div>
    )
}

function inputCls(status) {
    const base = 'w-full pl-9 pr-9 h-11 rounded-xl border bg-[var(--color-surface)] outline-none transition-all duration-200 text-[13px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] placeholder:opacity-30'
    if (status === 'error')   return `${base} border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 bg-rose-50/[0.03]`
    if (status === 'success') return `${base} border-emerald-500/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30`
    if (status === 'warning') return `${base} border-amber-500/50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 bg-amber-50/[0.03]`
    return `${base} border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/30`
}

function InputIcon({ icon: Icon, status }) {
    const color =
        status === 'error'   ? 'text-rose-400' :
        status === 'success' ? 'text-emerald-400' :
        status === 'warning' ? 'text-amber-400' :
        'text-[var(--color-text-muted)] opacity-40'
    return <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors duration-200 ${color}`} />
}

function StatusIcon({ status }) {
    if (status === 'success') return <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-400 animate-in zoom-in duration-200" />
    if (status === 'error')   return <XCircle    className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-rose-400" />
    return null
}

function SectionDivider({ icon: Icon, label }) {
    return (
        <div className="flex items-center gap-2.5 py-1">
            <div className="w-[3px] h-3.5 bg-[var(--color-primary)] rounded-full shrink-0" />
            <Icon className="text-[var(--color-primary)] w-3 h-3 opacity-80 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">{label}</span>
            <div className="h-px flex-1 bg-gradient-to-r from-[var(--color-border)] to-transparent opacity-30" />
        </div>
    )
}

/* ─── PhotoUploader ─────────────────────────────────────────── */
function PhotoUploader({ preview, photoUrl, photoError, uploading, onClick, onError }) {
    const hasPhoto = preview || (photoUrl && !photoError)
    return (
        <div className="flex flex-col items-center gap-2 shrink-0">
            <button
                type="button"
                onClick={onClick}
                title="Upload foto siswa"
                className={`relative w-[76px] h-[76px] rounded-2xl overflow-hidden transition-all duration-300 group
                    ${hasPhoto
                        ? 'ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-[var(--color-surface)]'
                        : 'border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 bg-[var(--color-surface-alt)]'
                    }`}
            >
                {hasPhoto ? (
                    <img
                        src={preview || photoUrl}
                        alt="Foto siswa"
                        className="w-full h-full object-cover"
                        onError={onError}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                        <Camera className="w-5 h-5 text-[var(--color-text-muted)] opacity-40 group-hover:opacity-100 group-hover:text-[var(--color-primary)] transition-all duration-200" />
                        <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] opacity-40 group-hover:opacity-80 transition-all">
                            Foto
                        </span>
                    </div>
                )}

                {/* Hover overlay when has photo */}
                {hasPhoto && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <Camera className="w-5 h-5 text-white" />
                    </div>
                )}

                {/* Upload spinner */}
                {uploading && (
                    <div className="absolute inset-0 bg-[var(--color-surface)]/80 backdrop-blur-sm flex items-center justify-center z-10">
                        <Spinner className="fa-spin text-[var(--color-primary)] w-5 h-5" />
                    </div>
                )}
            </button>
            <span className="text-[9px] text-[var(--color-text-muted)] opacity-35 leading-tight text-center">
                JPG/PNG<br />max 2MB
            </span>
        </div>
    )
}

/* ─── GenderToggle ──────────────────────────────────────────── */
function GenderToggle({ value, onChange }) {
    return (
        <div className="flex gap-2 h-11">
            {GENDER_OPTIONS.map(({ val, label, icon: Icon, active }) => {
                const isActive = value === val
                return (
                    <button
                        key={val}
                        type="button"
                        onClick={() => onChange(val)}
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border text-[11px] font-bold tracking-wide transition-all duration-200
                            ${isActive
                                ? active
                                : 'bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-text-muted)]/30'
                            }`}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                    </button>
                )
            })}
        </div>
    )
}

/* ─── StatusToggle ──────────────────────────────────────────── */
function StatusToggle({ value, onChange }) {
    return (
        <div className="flex gap-1.5 h-11">
            {STATUS_OPTIONS.map(({ key, label, icon: Icon, active }) => {
                const isActive = value === key
                return (
                    <button
                        key={key}
                        type="button"
                        onClick={() => onChange(key)}
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border text-[11px] font-bold tracking-wide transition-all duration-200
                            ${isActive
                                ? active
                                : 'bg-[var(--color-surface-alt)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-text-muted)]/30'
                            }`}
                    >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        {label}
                    </button>
                )
            })}
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                */
/* ═══════════════════════════════════════════════════════════════ */
const StudentFormModal = memo(function StudentFormModal({
    isOpen, onClose, selectedStudent, classesList,
    onSubmit, submitting, onPhotoUpload, uploadingPhoto,
}) {
    const INIT = {
        name: '', gender: 'L', class_id: '', phone: '', photo_url: '', status: 'aktif', tags: []
    }

    const [form, setForm]                   = useState(INIT)
    const [touched, setTouched]             = useState({})
    const [attemptedSubmit, setAttemptedSubmit] = useState(false)
    const [duplicateWarning, setDuplicateWarning] = useState(null)
    const [avatarPreview, setAvatarPreview] = useState(null)
    const [avatarFile, setAvatarFile]       = useState(null)
    const [photoError, setPhotoError]       = useState(false)
    const dupTimerRef = useRef(null)
    const photoRef    = useRef(null)

    const getStatus = (field, isRequired = false) => {
        const value    = form[field]
        const isTouched = touched[field] || attemptedSubmit
        if (field === 'phone' && value && (value.length < 10 || !value.startsWith('08'))) return 'warning'
        if (isRequired) {
            if (isTouched && (!value || (typeof value === 'string' && !value.trim()))) return 'error'
            if (value && (typeof value === 'string' ? value.trim() : true)) return 'success'
        } else {
            if (value && (typeof value === 'string' ? value.trim() : true)) return 'success'
        }
        return 'normal'
    }

    const setFieldTouched = (field) => setTouched(prev => ({ ...prev, [field]: true }))

    const handleFileChange = useCallback((e) => {
        const file = e.target.files[0]
        if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)) }
    }, [])

    useEffect(() => {
        return () => { if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview) }
    }, [avatarPreview])

    useEffect(() => {
        if (!isOpen) return
        if (selectedStudent) {
            setForm({
                name:      selectedStudent.name      || '',
                gender:    selectedStudent.gender    || 'L',
                class_id:  selectedStudent.class_id  || '',
                phone:     selectedStudent.phone     || '',
                photo_url: selectedStudent.photo_url || '',
                status:    selectedStudent.status    || 'aktif',
                tags:      selectedStudent.tags      || [],
            })
        } else {
            setForm(INIT)
        }
        setTouched({})
        setAttemptedSubmit(false)
        setDuplicateWarning(null)
        setPhotoError(false)
        setAvatarPreview(null)
        setAvatarFile(null)
    }, [isOpen, selectedStudent])

    const checkDuplicate = useCallback(async (name, classId) => {
        if (!name || name.trim().length < 3 || !classId) { setDuplicateWarning(null); return }
        try {
            const { data } = await supabase
                .from('students')
                .select('id, name, registration_code')
                .ilike('name', `%${name.trim()}%`)
                .eq('class_id', classId)
                .is('deleted_at', null)
                .limit(3)
            const filtered = (data || []).filter(d => !selectedStudent || d.id !== selectedStudent.id)
            setDuplicateWarning(filtered.length > 0 ? filtered : null)
        } catch { setDuplicateWarning(null) }
    }, [selectedStudent])

    const handleDupCheck = useCallback((name, classId) => {
        clearTimeout(dupTimerRef.current)
        dupTimerRef.current = setTimeout(() => checkDuplicate(name, classId), 600)
    }, [checkDuplicate])

    const setField = useCallback((key, value) => setForm(prev => ({ ...prev, [key]: value })), [])

    const handleSubmit = (e) => {
        e.preventDefault()
        setAttemptedSubmit(true)
        if (!form.name.trim() || !form.class_id) return
        onSubmit({ ...form, metadata: {} })
    }

    const isEditing   = Boolean(selectedStudent)
    const nameStatus  = getStatus('name', true)
    const phoneStatus = getStatus('phone')
    const classStatus = getStatus('class_id', true)

    if (!isOpen) return null

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Edit Siswa' : 'Tambah Siswa'}
            icon={isEditing ? Pencil : Plus}
            iconBg="bg-[var(--color-primary)]/10"
            iconColor="text-[var(--color-primary)]"
            description={isEditing
                ? `Perbarui data ${selectedStudent?.name || 'siswa'}`
                : 'Isi data untuk mendaftarkan siswa baru'}
            size="md"
            footer={
                <div className="flex items-center gap-3 w-full">
                    {/* Cancel — more visible border */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-10 px-5 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-text-muted)]/40 bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] text-[10px] font-black uppercase tracking-widest transition-all duration-200 shrink-0"
                    >
                        Batal
                    </button>

                    <div className="flex-1" />

                    {/* Submit — uses primary theme color */}
                    <button
                        type="submit"
                        form="student-form-modal"
                        disabled={submitting}
                        className="h-10 px-6 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 flex items-center gap-2 shrink-0
                            bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/25
                            hover:brightness-110 active:scale-[0.97]
                            disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        {submitting ? (
                            <><Spinner className="fa-spin w-3.5 h-3.5" /><span>Menyimpan...</span></>
                        ) : (
                            <><FloppyDisk className="w-3.5 h-3.5 opacity-80" /><span>{isEditing ? 'Simpan Perubahan' : 'Daftarkan'}</span></>
                        )}
                    </button>
                </div>
            }
        >
            <form id="student-form-modal" onSubmit={handleSubmit} className="space-y-5" noValidate>

                {/* ── Hero Row: Photo + Nama ── */}
                <div className="flex gap-4 items-start">
                    <PhotoUploader
                        preview={avatarPreview}
                        photoUrl={form.photo_url}
                        photoError={photoError}
                        uploading={uploadingPhoto}
                        onClick={() => photoRef.current?.click()}
                        onError={() => setPhotoError(true)}
                    />
                    <input
                        type="file"
                        ref={photoRef}
                        onChange={async (e) => {
                            handleFileChange(e)
                            const file = e.target.files[0]
                            if (file) {
                                const url = await onPhotoUpload(file)
                                if (url) setField('photo_url', url)
                            }
                        }}
                        className="hidden"
                        accept="image/*"
                    />

                    <div className="flex-1 min-w-0">
                        <FieldLabel required>Nama Lengkap</FieldLabel>
                        <FieldWrapper
                            status={nameStatus}
                            helperText={nameStatus === 'error' ? 'Nama siswa wajib diisi' : null}
                        >
                            <div className="relative">
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => {
                                        setField('name', e.target.value)
                                        handleDupCheck(e.target.value, form.class_id)
                                    }}
                                    onBlur={() => setFieldTouched('name')}
                                    placeholder="Nama lengkap siswa..."
                                    className={inputCls(nameStatus)}
                                    autoFocus
                                    autoComplete="off"
                                />
                                <InputIcon icon={User} status={nameStatus} />
                                <StatusIcon status={nameStatus} />
                            </div>
                        </FieldWrapper>
                    </div>
                </div>

                {/* ── Section Divider ── */}
                <SectionDivider icon={Student} label="Data Pokok" />

                {/* ── Gender + Status ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <FieldLabel>Jenis Kelamin</FieldLabel>
                        <GenderToggle value={form.gender} onChange={(v) => setField('gender', v)} />
                    </div>
                    <div>
                        <FieldLabel>Status</FieldLabel>
                        <StatusToggle value={form.status} onChange={(v) => setField('status', v)} />
                    </div>
                </div>

                {/* ── Kelas + No HP ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Kelas Akademik */}
                    <div>
                        <FieldLabel required>Kelas Akademik</FieldLabel>
                        <Select
                            value={form.class_id}
                            onChange={(val) => {
                                setField('class_id', val)
                                handleDupCheck(form.name, val)
                                setFieldTouched('class_id')
                            }}
                            options={classesList}
                            placeholder="Pilih Kelas"
                            icon={GraduationCap}
                            status={classStatus}
                            searchable
                        />
                        {classStatus === 'error' && (
                            <p className="flex items-center gap-1 mt-1.5 ml-0.5 text-[10px] text-rose-400 animate-in slide-in-from-top-1 duration-200">
                                <XCircle className="w-3 h-3 shrink-0" />
                                Kelas wajib dipilih
                            </p>
                        )}
                    </div>

                    {/* No. HP Wali */}
                    <div>
                        <FieldLabel optional>No. HP Wali</FieldLabel>
                        <FieldWrapper
                            status={phoneStatus}
                            helperText={phoneStatus === 'warning' ? 'Format: 08... minimal 10 digit' : null}
                        >
                            <div className="relative">
                                <input
                                    type="text"
                                    inputMode="tel"
                                    value={form.phone}
                                    onChange={(e) => setField('phone', e.target.value.replace(/\D/g, '').slice(0, 15))}
                                    onBlur={() => setFieldTouched('phone')}
                                    placeholder="08xxxxxxxxxx"
                                    className={inputCls(phoneStatus === 'warning' ? 'warning' : phoneStatus)}
                                />
                                <InputIcon icon={ChatCircle} status={phoneStatus} />
                                {phoneStatus === 'success' && <StatusIcon status="success" />}
                            </div>
                        </FieldWrapper>
                    </div>
                </div>

                {/* ── Duplicate Warning ── */}
                {duplicateWarning && (
                    <div className="flex gap-3 p-3.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] animate-in slide-in-from-top-2 duration-200">
                        <Warning className="text-amber-400 w-4 h-4 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-1.5">
                                Potensi Data Duplikat
                            </p>
                            <div className="space-y-1">
                                {duplicateWarning.map(d => (
                                    <p key={d.id} className="text-[11px] text-amber-300/80 flex items-center gap-1.5">
                                        <ArrowRight className="w-2.5 h-2.5 opacity-60 shrink-0" />
                                        {d.name}
                                        <span className="opacity-40 text-[10px] font-mono">[{d.registration_code}]</span>
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </form>
        </Modal>
    )
})

export default StudentFormModal