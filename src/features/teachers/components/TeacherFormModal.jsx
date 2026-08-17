import React, { useState, useEffect, useCallback, memo } from 'react'
import { Warning, Book, Spinner, Pencil, Plus, FloppyDisk, Briefcase } from '@phosphor-icons/react'

import { Modal, Select } from '@shared/components'

const TYPE_OPTIONS = [
    { id: 'guru', name: 'Guru' },
    { id: 'karyawan', name: 'Karyawan' },
    { id: 'kepsek', name: 'Kepala Sekolah' },
    { id: 'tu', name: 'Tata Usaha' },
    { id: 'security', name: 'Security' },
    { id: 'cleaning', name: 'Cleaning Service' },
]

const EMPTY_FORM = {
    name: '', subject: '', gender: 'L', phone: '',
    status: 'active', type: [],
}

const TeacherFormModal = memo(function TeacherFormModal({
    isOpen, onClose, selectedItem, subjectsList,
    onSubmit, submitting, onPhotoUpload, uploadingPhoto
}) {
    const [form, setForm] = useState(EMPTY_FORM)
    const [formError, setFormError] = useState('')
    const [touched, setTouched] = useState({})
    const [attemptedSubmit, setAttemptedSubmit] = useState(false)

    useEffect(() => {
        if (!isOpen) return
        if (selectedItem) {
            const rawType = selectedItem.type
            const types = Array.isArray(rawType) ? rawType : rawType ? [rawType] : []
            setForm({
                name: selectedItem.name || '',
                subject: selectedItem.subject || '',
                gender: selectedItem.gender || 'L',
                phone: selectedItem.phone || '',
                status: selectedItem.status || 'active',
                type: types,
            })
        } else {
            setForm(EMPTY_FORM)
        }
        setFormError('')
        setTouched({})
        setAttemptedSubmit(false)
    }, [isOpen, selectedItem])

    const setField = useCallback((key, value) => {
        setForm(prev => ({ ...prev, [key]: value }))
    }, [])

    const setFieldTouched = (field) => setTouched(prev => ({ ...prev, [field]: true }))

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

    const handleSubmit = async (e) => {
        e?.preventDefault()
        setAttemptedSubmit(true)
        const name = (form.name || '').trim()
        const phone = (form.phone || '').trim()
        if (!name) { setFormError('Nama lengkap wajib diisi.'); return }
        if (!phone) { setFormError('No. Handphone wajib diisi.'); return }
        setFormError('')
        const payload = {
            name,
            subject: (form.subject || '').trim() || null,
            gender: form.gender || null,
            phone: (form.phone || '').trim() || null,
            status: form.status || 'active',
            type: form.type.length > 0 ? form.type : ['guru'],
        }
        const result = await onSubmit(payload)
        if (result?.error) {
            if (result.code === '23505') setFormError('NBM sudah terdaftar.')
            else setFormError(result.message || 'Gagal menyimpan data.')
        }
    }

    const overallProgress = (() => {
        const fields = ['name', 'subject', 'phone']
        const filled = fields.filter(f => {
            const v = form[f]
            return v && (typeof v === 'string' ? v.trim() : true)
        }).length
        return Math.round((filled / fields.length) * 100)
    })()

    if (!isOpen) return null

    const inputCls = (field, required = false) => {
        const s = getStatus(field, required)
        return `w-full px-4 h-11 rounded-xl border bg-[var(--color-surface)] outline-none transition-all text-[13px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] placeholder:opacity-40 ${s === 'error' ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/5' :
            s === 'warning' ? 'border-amber-500 bg-amber-50/10 focus:border-amber-500 focus:ring-1 focus:ring-amber-500' :
                s === 'success' ? 'border-emerald-500/30 bg-emerald-50/5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500' :
                    'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]'
            }`
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={selectedItem ? `Edit Data Guru` : `Tambah Guru Baru`}
            description={
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 bg-[var(--color-border)] rounded-full overflow-hidden shrink-0">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${overallProgress}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-black text-emerald-600">{overallProgress}% Lengkap</span>
                </div>
            }
            icon={selectedItem ? Pencil : Plus}
            iconBg={selectedItem ? 'bg-[var(--color-primary)]/10' : 'bg-emerald-500/10'}
            iconColor={selectedItem ? 'text-[var(--color-primary)]' : 'text-emerald-600'}
            size="md"
            mobileVariant="bottom-sheet"
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
                        form="teacher-form-modal"
                        disabled={submitting || uploadingPhoto}
                        className="h-10 px-6 sm:px-8 rounded-xl bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 shrink-0"
                    >
                        {submitting ? (
                            <>
                                <Spinner className="fa-spin" />
                                <span>Menyimpan...</span>
                            </>
                        ) : uploadingPhoto ? (
                            <>
                                <Spinner className="fa-spin" />
                                <span>Mengunggah...</span>
                            </>
                        ) : (
                            <>
                                <FloppyDisk className="w-3 h-3 opacity-80 shrink-0" />
                                <span>{selectedItem ? 'Simpan Perubahan' : 'Simpan Data'}</span>
                            </>
                        )}
                    </button>
                </div>
            }
        >
            <form id="teacher-form-modal" onSubmit={handleSubmit} className="space-y-5">
                {/* Nama */}
                <div>
                    <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider ml-1 mb-1 block opacity-50">Nama Lengkap <span className="text-rose-500">*</span></label>
                    <input type="text" value={form.name} onChange={e => setField('name', e.target.value)} onBlur={() => setFieldTouched('name')} placeholder="Nama lengkap dengan gelar..." className={inputCls('name', true)} />
                </div>

                {/* Jenis Kelamin + Jabatan */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider ml-1 mb-1 block opacity-50">Jenis Kelamin</label>
                        <div className="flex p-1 bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-xl h-11">
                            {[
                                { key: 'L', label: 'Laki-laki', activeCls: 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20' },
                                { key: 'P', label: 'Perempuan', activeCls: 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' }
                            ].map(o => (
                                <button key={o.key} type="button" onClick={() => setField('gender', o.key)} className={`flex-1 rounded-lg text-[10px] font-bold transition-all duration-200 ${form.gender === o.key ? o.activeCls : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}>{o.label}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider ml-1 mb-1 block opacity-50">Jabatan</label>
                        <Select
                            value={form.type}
                            onChange={val => setField('type', val)}
                            options={TYPE_OPTIONS}
                            placeholder="Pilih atau ketik jabatan..."
                            icon={Briefcase}
                            multi
                            searchable
                            allowCustom
                        />
                    </div>
                </div>

                {/* Mata Pelajaran + Status */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider ml-1 mb-1 block opacity-50">Mata Pelajaran</label>
                        <Select
                            value={form.subject}
                            onChange={val => setField('subject', val)}
                            options={(subjectsList || []).map(s => ({ id: s, name: s }))}
                            placeholder="e.g. Matematika"
                            icon={Book}
                            searchable
                            allowCustom
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider ml-1 mb-1 block opacity-50">Status</label>
                        <div className="flex p-1 bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-xl h-11">
                            {[
                                { key: 'active', label: 'Aktif', activeCls: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' },
                                { key: 'inactive', label: 'Nonaktif', activeCls: 'bg-slate-700 text-white shadow-lg shadow-slate-700/20' },
                            ].map((opt) => (
                                <button key={opt.key} type="button" onClick={() => setField('status', opt.key)} className={`flex-1 rounded-lg text-[10px] font-bold transition-all duration-200 ${form.status === opt.key ? opt.activeCls : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}>{opt.label}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* No. Handphone */}
                <div>
                    <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider ml-1 mb-1 block opacity-50">No. Handphone <span className="text-rose-500">*</span></label>
                    <input type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} onBlur={() => setFieldTouched('phone')} placeholder="08xxxxxxxxxx" className={inputCls('phone', true)} />
                </div>

                {formError && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 animate-in fade-in">
                        <Warning className="text-red-500 shrink-0" />
                        <p className="text-[11px] font-bold text-red-600">{formError}</p>
                    </div>
                )}
            </form>
        </Modal>
    )
})

export default TeacherFormModal
