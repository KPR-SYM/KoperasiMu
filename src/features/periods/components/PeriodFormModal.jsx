import React, { useState, useEffect, memo } from 'react'
import { Warning, Calendar, CheckCircle, Spinner, Pencil, PlusCircle } from '@phosphor-icons/react'

import { Modal } from '@shared/components'

const PeriodFormModal = memo(function PeriodFormModal({
    isOpen,
    onClose,
    selectedItem,
    years,
    onSubmit,
    submitting
}) {
    const [formData, setFormData] = useState({
        name: '',
        semester: 'Ganjil',
        startDate: '',
        endDate: '',
        registrationStart: '',
        registrationEnd: '',
        makeActive: false
    })
    const [formErrors, setFormErrors] = useState({})
    const [isDuplicateName, setIsDuplicateName] = useState(false)
    const [isOverlapping, setIsOverlapping] = useState(null)

    useEffect(() => {
        if (isOpen) {
            if (selectedItem) {
                setFormData({
                    name: selectedItem.academic_year || '',
                    semester: selectedItem.semester || 'Ganjil',
                    startDate: selectedItem.start_date || '',
                    endDate: selectedItem.end_date || '',
                    registrationStart: selectedItem.registration_start || '',
                    registrationEnd: selectedItem.registration_end || '',
                    makeActive: selectedItem.is_active || false
                })
            } else {
                setFormData({
                    name: '',
                    semester: 'Ganjil',
                    startDate: '',
                    endDate: '',
                    registrationStart: '',
                    registrationEnd: '',
                    makeActive: false
                })
            }
            setFormErrors({})
            setIsDuplicateName(false)
            setIsOverlapping(null)
        }
    }, [isOpen, selectedItem])

    useEffect(() => {
        if (!isOpen || !formData.startDate || !formData.endDate) {
            setIsOverlapping(null)
            return
        }

        const s = new Date(formData.startDate)
        const e = new Date(formData.endDate)
        if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e <= s) {
            setIsOverlapping(null)
            return
        }

        const overlap = (years || []).find(y => {
            if (selectedItem?.id && y.id === selectedItem.id) return false
            const ys = new Date(y.start_date)
            const ye = new Date(y.end_date)
            return (s >= ys && s <= ye) || (e >= ys && e <= ye) || (s <= ys && e >= ye)
        })

        setIsOverlapping(overlap || null)
    }, [formData.startDate, formData.endDate, years, selectedItem, isOpen])

    const getDuration = (start, end) => {
        if (!start || !end) return '-'
        const s = new Date(start)
        const e = new Date(end)
        if (e < s) {
            if (e.getFullYear() > 3000) return 'Format Tanggal Salah'
            return '-'
        }
        const months = (e.getFullYear() - s.getFullYear()) * 12 + e.getMonth() - s.getMonth()
        const days = Math.round((e - s) / (1000 * 60 * 60 * 24))
        return `${months} bulan (${days} hari)`
    }

    const checkDuplicate = (name, semester) => {
        const trimmed = name.trim()
        if (!trimmed) return false
        return (years || []).some(y =>
            y.academic_year === trimmed &&
            y.semester === semester &&
            (!selectedItem?.id || y.id !== selectedItem.id)
        )
    }

    const handlePredictDates = () => {
        const match = formData.name.match(/(\d{4})[/\-\s](\d{4})/)
        if (!match) return

        const startYear = match[1]
        const endYear = match[2]

        if (formData.semester === 'Ganjil') {
            handleChange('startDate', `${startYear}-07-14`)
            handleChange('endDate', `${startYear}-12-22`)
        } else {
            handleChange('startDate', `${endYear}-01-05`)
            handleChange('endDate', `${endYear}-06-20`)
        }
    }

    const handleChange = (key, value) => {
        setFormData(prev => {
            const nextData = { ...prev, [key]: value }
            if (key === 'name' || key === 'semester') {
                setIsDuplicateName(checkDuplicate(nextData.name, nextData.semester))
            }
            // Validasi live Periode Pendaftaran (opsional, tapi jika diisi harus lengkap & dalam rentang)
            if (['registrationStart', 'registrationEnd', 'startDate', 'endDate'].includes(key)) {
                const rs = nextData.registrationStart
                const re = nextData.registrationEnd
                const newErrors = {}
                if (rs || re) {
                    if (!rs || !re) {
                        if (!rs) newErrors.registrationStart = 'Mulai & selesai pendaftaran wajib diisi bersama'
                        if (!re) newErrors.registrationEnd = 'Mulai & selesai pendaftaran wajib diisi bersama'
                    } else if (re <= rs) {
                        newErrors.registrationEnd = 'Selesai pendaftaran harus setelah mulai pendaftaran'
                    } else if (nextData.startDate && nextData.endDate) {
                        if (rs < nextData.startDate || re > nextData.endDate) {
                            newErrors.registrationEnd = 'Periode pendaftaran harus berada dalam rentang periode akademik'
                        }
                    }
                }
                setFormErrors(prevE => ({ ...prevE, registrationStart: newErrors.registrationStart || '', registrationEnd: newErrors.registrationEnd || '' }))
            }
            return nextData
        })
        setFormErrors(prev => ({ ...prev, [key]: '' }))
    }

    const handleFormSubmit = (e) => {
        if (e) e.preventDefault()
        onSubmit(formData, setFormErrors)
    }

    const handleClose = () => {
        setFormErrors({})
        setIsDuplicateName(false)
        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={selectedItem?.id ? 'Update Tahun Pelajaran' : 'Tahun Pelajaran Baru'}
            description={selectedItem?.id ? 'Perbarui detail tahun pelajaran ini.' : 'Buat periode tahun pelajaran baru.'}
            icon={selectedItem?.id ? Pencil : PlusCircle}
            iconBg={'bg-[var(--color-primary)]/10'}
            iconColor={'text-[var(--color-primary)]'}
            size="lg"
            mobileVariant="bottom-sheet"
            footer={
                <div className="flex items-center w-full gap-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="h-10 px-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] text-[10px] font-black uppercase tracking-widest transition-all shrink-0 flex items-center justify-center"
                    >
                        Batal
                    </button>
                    <div className="flex-1" />
                    <button
                        type="button"
                        onClick={handleFormSubmit}
                        disabled={submitting || isDuplicateName || !formData.name || !formData.startDate || !formData.endDate || formErrors.registrationStart || formErrors.registrationEnd}
                        className="h-10 px-6 sm:px-8 rounded-xl bg-[var(--color-primary)] text-white text-[10px] font-bold uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[var(--color-primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 shrink-0"
                    >
                        {submitting ? (
                            <>
                                <Spinner className="animate-spin w-3 h-3" />
                                <span>Menyimpan...</span>
                            </>
                        ) : (
                            <>
                                {selectedItem?.id ? <CheckCircle className="w-3 h-3 opacity-80 shrink-0" /> : <PlusCircle className="w-3 h-3 opacity-80 shrink-0" />}
                                <span className="truncate hidden sm:inline">{selectedItem?.id ? 'Update Data' : 'Simpan Tahun'}</span>
                                <span className="truncate sm:hidden">Simpan</span>
                            </>
                        )}
                    </button>
                </div>
            }
        >
            <div className="space-y-5">
                <div className="space-y-4">
                    <div className="flex items-center gap-2.5 pt-1">
                        <div className="w-1 h-4 bg-yellow-500 rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Identitas & Periode</span>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--color-border)] to-transparent opacity-40" />
                    </div>

                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-12 sm:col-span-7">
                            <label className="block text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-1.5 ml-1 opacity-60">
                                Tahun Pelajaran <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => handleChange('name', e.target.value)}
                                    placeholder="2024/2025"
                                    maxLength={9}
                                    className={`w-full px-3.5 h-9 rounded-xl border bg-[var(--color-surface-alt)]/20 focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] outline-none transition-all text-sm font-bold placeholder:opacity-30 ${formErrors.name ? 'border-red-500' : isDuplicateName ? 'border-amber-400' : 'border-[var(--color-border)]'}`}
                                />
                            </div>

                            {formData.name.match(/\d{4}.*\d{4}/) && (!formData.startDate || !formData.endDate) && (
                                <button
                                    type="button"
                                    onClick={handlePredictDates}
                                    className="mt-2 ml-1 text-[10px] font-black text-[var(--color-primary)] hover:text-[var(--color-primary-600)] transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/10 animate-in fade-in slide-in-from-top-1"
                                >
                                    <Calendar className="w-3 h-3" />
                                    Gunakan tanggal standar ({formData.semester === 'Ganjil' ? '14 Jul – 22 Des' : '5 Jan – 20 Jun'})
                                </button>
                            )}
                            {formErrors.name && (
                                <p className="mt-1 ml-1 text-[9px] font-bold text-red-500 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                                    <Warning className="w-2 h-2" />{formErrors.name}
                                </p>
                            )}
                        </div>

                        <div className="col-span-12 sm:col-span-5">
                            <label className="block text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-1.5 ml-1 opacity-60">Semester</label>
                            <div className="flex p-0.5 bg-[var(--color-surface-alt)] rounded-xl border border-[var(--color-border)] h-9">
                                {['Ganjil', 'Genap'].map(s => (
                                    <button key={s} type="button"
                                        onClick={() => handleChange('semester', s)}
                                        className={`flex-1 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${formData.semester === s ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {isDuplicateName && !formErrors.name && (
                        <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-700 flex gap-2.5 animate-in fade-in slide-in-from-top-1">
                            <Warning className="text-amber-500 w-3 h-3 mt-0.5" />
                            <p className="text-[10px] font-bold leading-tight">Nama & semester ini sudah ada dalam sistem.</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-1.5 ml-1 opacity-60">Mulai <span className="text-red-500">*</span></label>
                            <div className={`relative rounded-xl border transition-all ${formErrors.startDate ? 'border-red-500 ring-2 ring-red-500/10' : 'border-[var(--color-border)] focus-within:border-[var(--color-primary)] focus-within:ring-4 focus-within:ring-[var(--color-primary)]/10 bg-[var(--color-surface-alt)]/20'}`}>
                                <div className={`absolute inset-0 flex items-center px-3.5 pointer-events-none text-sm ${formData.startDate ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)] opacity-30'}`}>
                                    {formData.startDate ? (() => {
                                        const [y, m, d] = formData.startDate.split('-')
                                        return `${d}/${m}/${y}`
                                    })() : 'dd/mm/yyyy'}
                                </div>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={e => handleChange('startDate', e.target.value)}
                                    className="w-full px-3.5 h-9 opacity-0 cursor-pointer outline-none bg-transparent date-input-hidden z-10"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                    <Calendar className="w-3 h-3" />
                                </div>
                            </div>
                            {formErrors.startDate && <p className="mt-1 text-[9px] font-bold text-red-500 flex items-center gap-1 animate-in fade-in slide-in-from-top-1"><Warning className="w-2 h-2" />{formErrors.startDate}</p>}
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-1.5 ml-1 opacity-60">Selesai <span className="text-red-500">*</span></label>
                            <div className={`relative rounded-xl border transition-all ${formErrors.endDate ? 'border-red-500 ring-2 ring-red-500/10' : 'border-[var(--color-border)] focus-within:border-[var(--color-primary)] focus-within:ring-4 focus-within:ring-[var(--color-primary)]/10 bg-[var(--color-surface-alt)]/20'}`}>
                                <div className={`absolute inset-0 flex items-center px-3.5 pointer-events-none text-sm ${formData.endDate ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)] opacity-30'}`}>
                                    {formData.endDate ? (() => {
                                        const [y, m, d] = formData.endDate.split('-')
                                        return `${d}/${m}/${y}`
                                    })() : 'dd/mm/yyyy'}
                                </div>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={e => handleChange('endDate', e.target.value)}
                                    className="w-full px-3.5 h-9 opacity-0 cursor-pointer outline-none bg-transparent date-input-hidden z-10"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                    <Calendar className="w-3 h-3" />
                                </div>
                            </div>
                            {formErrors.endDate && !formErrors.endDate.includes('tumpang tindih') && (
                                <p className="mt-1 text-[9px] font-bold text-red-500 flex items-center gap-1 animate-in fade-in slide-in-from-top-1"><Warning className="w-2 h-2" />{formErrors.endDate}</p>
                            )}
                        </div>
                    </div>

                    {((formData.startDate && formData.endDate) || isOverlapping) && (
                        <div className="space-y-2">
                            {isOverlapping && (
                                <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 animate-in zoom-in-95">
                                    <div className="w-5 h-5 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <Warning className="text-amber-600 w-3 h-3" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-amber-700 leading-tight">Konflik Jadwal Deteksi!</p>
                                        <p className="text-[9px] font-bold text-amber-600/80 leading-snug mt-0.5">
                                            Periode ini tumpang tindih dengan <span className="text-amber-700 font-extrabold">{isOverlapping.academic_year} {isOverlapping.semester}</span>.
                                            Ubah tanggal atau nonaktifkan tahun lain.
                                        </p>
                                    </div>
                                </div>
                            )}
                            {formData.startDate && formData.endDate && formData.endDate > formData.startDate && !isOverlapping && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/15">
                                    <Calendar className="text-[var(--color-primary)] w-3 h-3 opacity-60" />
                                    <p className="text-[10px] font-bold text-[var(--color-text-muted)]">
                                        Estimasi Durasi: <span className="font-black text-[var(--color-primary)]">{getDuration(formData.startDate, formData.endDate)}</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-4 pt-2 border-t border-[var(--color-border)]">
                    <div className="flex items-center gap-2.5 pt-1">
                        <div className="w-1 h-4 bg-sky-500 rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Periode Pendaftaran</span>
                        <span className="text-[9px] font-bold text-[var(--color-text-muted)] opacity-50 uppercase tracking-tight">Opsional</span>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--color-border)] to-transparent opacity-40" />
                    </div>

                    <p className="text-[9px] font-bold text-[var(--color-text-muted)] opacity-60 -mt-1 leading-snug">
                        Tentukan jendela waktu pendaftaran siswa. Jika diisi, harus berada dalam rentang periode akademik.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-1.5 ml-1 opacity-60">Pendaftaran Mulai</label>
                            <div className={`relative rounded-xl border transition-all ${formErrors.registrationStart ? 'border-red-500 ring-2 ring-red-500/10' : 'border-[var(--color-border)] focus-within:border-[var(--color-primary)] focus-within:ring-4 focus-within:ring-[var(--color-primary)]/10 bg-[var(--color-surface-alt)]/20'}`}>
                                <div className={`absolute inset-0 flex items-center px-3.5 pointer-events-none text-sm ${formData.registrationStart ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)] opacity-30'}`}>
                                    {formData.registrationStart ? (() => {
                                        const [y, m, d] = formData.registrationStart.split('-')
                                        return `${d}/${m}/${y}`
                                    })() : 'dd/mm/yyyy'}
                                </div>
                                <input
                                    type="date"
                                    value={formData.registrationStart}
                                    onChange={e => handleChange('registrationStart', e.target.value)}
                                    className="w-full px-3.5 h-9 opacity-0 cursor-pointer outline-none bg-transparent date-input-hidden z-10"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                    <Calendar className="w-3 h-3" />
                                </div>
                            </div>
                            {formErrors.registrationStart && <p className="mt-1 text-[9px] font-bold text-red-500 flex items-center gap-1 animate-in fade-in slide-in-from-top-1"><Warning className="w-2 h-2" />{formErrors.registrationStart}</p>}
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-1.5 ml-1 opacity-60">Pendaftaran Selesai</label>
                            <div className={`relative rounded-xl border transition-all ${formErrors.registrationEnd ? 'border-red-500 ring-2 ring-red-500/10' : 'border-[var(--color-border)] focus-within:border-[var(--color-primary)] focus-within:ring-4 focus-within:ring-[var(--color-primary)]/10 bg-[var(--color-surface-alt)]/20'}`}>
                                <div className={`absolute inset-0 flex items-center px-3.5 pointer-events-none text-sm ${formData.registrationEnd ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)] opacity-30'}`}>
                                    {formData.registrationEnd ? (() => {
                                        const [y, m, d] = formData.registrationEnd.split('-')
                                        return `${d}/${m}/${y}`
                                    })() : 'dd/mm/yyyy'}
                                </div>
                                <input
                                    type="date"
                                    value={formData.registrationEnd}
                                    onChange={e => handleChange('registrationEnd', e.target.value)}
                                    className="w-full px-3.5 h-9 opacity-0 cursor-pointer outline-none bg-transparent date-input-hidden z-10"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                    <Calendar className="w-3 h-3" />
                                </div>
                            </div>
                            {formErrors.registrationEnd && <p className="mt-1 text-[9px] font-bold text-red-500 flex items-center gap-1 animate-in fade-in slide-in-from-top-1"><Warning className="w-2 h-2" />{formErrors.registrationEnd}</p>}
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-2 border-t border-[var(--color-border)]">
                    <div className="flex items-center gap-2.5 pt-1">
                        <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Pengaturan Sistem</span>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--color-border)] to-transparent opacity-40" />
                    </div>

                    <button
                        type="button"
                        onClick={() => handleChange('makeActive', !formData.makeActive)}
                        className={`w-full text-left group flex items-center justify-between px-3.5 py-2.5 rounded-2xl border transition-all cursor-pointer select-none focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10 ${formData.makeActive ? 'bg-emerald-500/8 border-emerald-500/30' : 'bg-[var(--color-surface-alt)]/40 border-[var(--color-border)] hover:border-[var(--color-primary)]/30'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${formData.makeActive ? 'bg-emerald-500/20 text-emerald-600' : 'bg-[var(--color-border)] text-[var(--color-text-muted)]'}`}>
                                <CheckCircle className="w-3 h-3" />
                            </div>
                            <div>
                                <p className={`text-[12px] font-black ${formData.makeActive ? 'text-emerald-700' : 'text-[var(--color-text)]'}`}>Jadikan Tahun Aktif</p>
                                <p className="text-[9px] font-bold text-[var(--color-text-muted)] opacity-60 mt-0.5 uppercase tracking-tight">Otomatis menonaktifkan tahun lain</p>
                            </div>
                        </div>
                        <div className={`relative w-8 h-4.5 rounded-full transition-all shrink-0 ${formData.makeActive ? 'bg-emerald-500' : 'bg-[var(--color-border)]'}`}>
                            <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all duration-200 ${formData.makeActive ? 'left-[16px]' : 'left-0.5'}`} />
                        </div>
                    </button>
                </div>
            </div>
        </Modal>
    )
})

export default PeriodFormModal
