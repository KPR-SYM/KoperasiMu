import React, { useState, useRef, useEffect, useCallback, memo } from 'react'
import { User, Camera, Spinner, FloppyDisk, CheckCircle, Pencil, Plus, GraduationCap, ChatCircle, GenderMale, GenderFemale, Warning } from '@phosphor-icons/react'
import { supabase } from '@lib/supabase'
import Modal from '@shared/components/Modal'
import RichSelect from '@shared/components/RichSelect'

const StudentFormModal = memo(function StudentFormModal({

    isOpen, onClose, selectedStudent, classesList,
    onSubmit, submitting, onPhotoUpload, uploadingPhoto,
}) {
    const INIT = {
        name: '', gender: 'L', class_id: '', phone: '', photo_url: '', status: 'aktif', tags: []
    }

    const [form, setForm] = useState(INIT)
    const [touched, setTouched] = useState({})
    const [attemptedSubmit, setAttemptedSubmit] = useState(false)
    const [duplicateWarning, setDuplicateWarning] = useState(null)
    const [avatarPreview, setAvatarPreview] = useState(null)

    const [avatarFile, setAvatarFile] = useState(null)
    const [photoError, setPhotoError] = useState(false)
    const dupTimerRef = useRef(null)
    const photoRef = useRef(null)

    const getStatus = (field, isRequired = false) => {
        const value = form[field]
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
        if (file) {
            setAvatarFile(file)
            setAvatarPreview(URL.createObjectURL(file))
        }
    }, [])

    useEffect(() => {
        return () => {
            if (avatarPreview && avatarPreview.startsWith('blob:')) {
                URL.revokeObjectURL(avatarPreview)
            }
        }
    }, [avatarPreview])

    useEffect(() => {
        if (!isOpen) return
        if (selectedStudent) {
            setForm({
                name: selectedStudent.name || '',
                gender: selectedStudent.gender || 'L',
                class_id: selectedStudent.class_id || '',
                phone: selectedStudent.phone || '',
                photo_url: selectedStudent.photo_url || '',
                status: selectedStudent.status || 'aktif',
                tags: selectedStudent.tags || [],
            })
        } else {
            setForm(INIT)
        }
        setTouched({})
        setAttemptedSubmit(false)
        setDuplicateWarning(null)
        setPhotoError(false)
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

    const setField = useCallback((key, value) => {
        setForm(prev => ({ ...prev, [key]: value }))
    }, [])

    const handleSubmit = (e) => {
        e.preventDefault()
        setAttemptedSubmit(true)
        if (!form.name.trim() || !form.class_id) return
        onSubmit({ ...form, metadata: {} })
    }

    if (!isOpen) return null

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={selectedStudent ? 'Edit Siswa' : 'Tambah Siswa'}
            icon={selectedStudent ? Pencil : Plus}
            iconBg="bg-[var(--color-primary)]/10"
            iconColor="text-[var(--color-primary)]"
            size="md"
            footer={
                <div className="flex items-center w-full gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-10 px-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] text-[10px] font-black uppercase tracking-widest transition-all shrink-0"
                    >
                        Batal
                    </button>
                    <div className="flex-1" />
                    <button
                        type="submit"
                        form="student-form-modal"
                        disabled={submitting}
                        className="h-10 px-6 rounded-xl bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 shrink-0"
                    >
                        {submitting ? (
                            <><Spinner className="fa-spin" /><span>Menyimpan...</span></>
                        ) : (
                            <><FloppyDisk className="w-3 h-3 opacity-80 shrink-0" /><span>{selectedStudent ? 'Simpan' : 'Daftarkan'}</span></>
                        )}
                    </button>
                </div>
            }
        >
            <form id="student-form-modal" onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative group shrink-0 mx-auto sm:mx-0">
                        <div
                            className={`w-[70px] h-[70px] rounded-2xl bg-[var(--color-surface-alt)] border flex items-center justify-center overflow-hidden transition-all cursor-pointer ${form.photo_url || avatarPreview ? 'border-emerald-500/50' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'}`}
                            onClick={() => photoRef.current?.click()}
                        >
                            {(avatarPreview || (form.photo_url && !photoError)) ? (
                                <img
                                    src={avatarPreview || form.photo_url}
                                    alt="Preview"
                                    className="w-full h-full object-cover animate-in fade-in zoom-in duration-300"
                                    onError={() => setPhotoError(true)}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-1.5 opacity-40 group-hover:opacity-100 group-hover:text-[var(--color-primary)] transition-all">
                                    <Camera className="text-xl" />
                                    <span className="text-[8px] font-bold uppercase tracking-wider">Foto</span>
                                </div>
                            )}
                        </div>
                        <input type="file" ref={photoRef} onChange={async (e) => {
                            handleFileChange(e)
                            const file = e.target.files[0]
                            if (file) {
                                const url = await onPhotoUpload(file)
                                if (url) setField('photo_url', url)
                            }
                        }} className="hidden" accept="image/*" />
                        {uploadingPhoto && (
                            <div className="absolute inset-0 rounded-2xl bg-[var(--color-surface)]/80 flex items-center justify-center backdrop-blur-sm z-20 border border-[var(--color-border)]">
                                <Spinner className="fa-spin text-[var(--color-primary)] w-4 h-4" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 w-full space-y-3">
                        <div className="relative group">
                            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider ml-1 mb-1 block opacity-50">
                                Nama Lengkap <span className="text-rose-500">*</span>
                            </label>
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
                                    className={`w-full pl-9 pr-3 h-11 rounded-xl border bg-[var(--color-surface)] outline-none transition-all text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] placeholder:opacity-40 
                                    ${getStatus('name', true) === 'error' ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/5' :
                                            getStatus('name', true) === 'success' ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-emerald-50/5' :
                                                'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]'}`}
                                    autoFocus
                                />
                                <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 transition-colors 
                                ${getStatus('name', true) === 'error' ? 'text-rose-500' :
                                        getStatus('name', true) === 'success' ? 'text-emerald-500' :
                                            'text-[var(--color-text-muted)] opacity-50 group-focus-within:text-[var(--color-primary)]'}`} />
                                {getStatus('name', true) === 'success' && (
                                    <CheckCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 w-3 h-3 animate-in zoom-in" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                    <div className="w-1 h-4 bg-[var(--color-primary)] rounded-full" />
                    <User className="text-[var(--color-primary)] w-3 h-3 opacity-70" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Data Pokok</span>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--color-border)] to-transparent opacity-40" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider ml-1 opacity-50">
                            Jenis Kelamin
                        </label>
                        <div className="flex p-1 bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-xl h-11">
                            {[
                                ['L', 'Putra', 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20'],
                                ['P', 'Putri', 'bg-rose-500 text-white shadow-lg shadow-rose-500/20']
                            ].map(([val, label, activeCls]) => (
                                <button key={val} type="button" onClick={() => setField('gender', val)}
                                    className={`flex-1 rounded-lg text-[11px] font-bold tracking-wider transition-all duration-200 ${form.gender === val ? activeCls : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider ml-1 opacity-50">Status</label>
                        <div className="flex p-1 bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-xl h-11">
                            {[
                                { key: 'aktif', label: 'Aktif', activeCls: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' },
                                { key: 'lulus', label: 'Lulus', activeCls: 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' },
                                { key: 'keluar', label: 'Keluar', activeCls: 'bg-slate-700 text-white shadow-lg shadow-slate-700/20' },
                            ].map((opt) => (
                                <button key={opt.key} type="button" onClick={() => setField('status', opt.key)}
                                    className={`flex-1 rounded-lg text-[11px] font-bold tracking-wider transition-all duration-200 ${form.status === opt.key ? opt.activeCls : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative group">
                        <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider ml-1 mb-1 block opacity-50">
                            Kelas Akademik <span className="text-rose-500">*</span>
                        </label>
                        <RichSelect
                            value={form.class_id}
                            onChange={(val) => {
                                setField('class_id', val)
                                handleDupCheck(form.name, val)
                                setFieldTouched('class_id')
                            }}
                            options={classesList}
                            placeholder="Pilih Kelas"
                            icon={GraduationCap}
                            status={getStatus('class_id', true)}
                            searchable
                        />
                        {duplicateWarning && (
                            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-500/5 text-amber-700 dark:text-amber-400 animate-in slide-in-from-top-2 flex gap-3">
                                <Warning className="text-amber-500 w-4 h-4 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1">Potensi Duplikasi</p>
                                    <div className="space-y-0.5">
                                        {duplicateWarning.map(d => (
                                            <p key={d.id} className="text-[11px]">{d.name} <span className="opacity-50">[{d.registration_code}]</span></p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="relative group">
                        <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider ml-1 mb-1 block opacity-50">
                            No. HP Wali <span className="text-emerald-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={form.phone}
                                onChange={(e) => setField('phone', e.target.value.replace(/\D/g, '').slice(0, 15))}
                                onBlur={() => setFieldTouched('phone')}
                                placeholder="08xxxxxxxxxx"
                                className={`w-full pl-9 pr-3 h-11 rounded-xl border bg-[var(--color-surface)] outline-none transition-all text-[13px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] placeholder:opacity-40 
                                    ${getStatus('phone') === 'warning' ? 'border-amber-500 bg-amber-50/10' : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]'}`}
                            />
                            <ChatCircle className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 transition-colors ${getStatus('phone') === 'warning' ? 'text-amber-500' : 'text-emerald-500 opacity-70'}`} />
                        </div>
                        {getStatus('phone') === 'warning' && <p className="text-[9px] text-amber-600 mt-1 ml-1">Format HP tidak valid (08... min 10 digit)</p>}
                    </div>
                </div>
            </form>
        </Modal>
    )
})

export default StudentFormModal