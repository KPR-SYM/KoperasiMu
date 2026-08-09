import React, { useEffect, useRef, memo, useMemo, useCallback } from 'react'
import { Warning, Bed, Buildings, Calendar, CheckCircle, CaretDown, CaretRight, Spinner, GenderMale, Pencil, Plus, UserCheck, GenderFemale, Building, ChalkboardTeacher, Hash, ArrowsClockwise, Trash } from '@phosphor-icons/react'

import { Modal, Select, ConfirmDialog } from '@shared/components'
import { useClassForm } from '../hooks/useClassForm'
import { LEVEL_OPTIONS, PROGRAMS, GENDERS, getInitials } from '../config/classFormConfig'

const ClassFormModal = memo(function ClassFormModal({
    isOpen,
    onClose,
    selectedItem,
    teachersList,
    periodsList,
    onSubmit,
    submitting
}) {
    const nameInputRef = useRef(null)

    const {
        form,
        setField,
        setFieldTouched,
        touched,
        attemptedSubmit,
        fieldErrors,
        formError,
        saveState,
        sectionsOpen,
        toggleSection,
        progress,
        hasChanges,
        hasTeachers,
        nameStatus,
        handleSubmit,
        handleCloseWithCallback,
        showDiscardConfirm,
        handleDiscardConfirm,
        handleDiscardCancel,
    } = useClassForm({ isOpen, selectedItem, teachersList, periodsList, onSubmit })

    // Keyboard shortcut: Escape to close
    useEffect(() => {
        if (!isOpen) return
        const handler = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault()
                e.stopPropagation()
                handleCloseWithCallback(onClose)
            }
        }
        window.addEventListener('keydown', handler, true)
        return () => window.removeEventListener('keydown', handler, true)
    }, [isOpen, handleCloseWithCallback, onClose])

    // Focus first input on open
    useEffect(() => {
        if (isOpen && nameInputRef.current) {
            setTimeout(() => nameInputRef.current?.focus(), 100)
        }
    }, [isOpen])

    const handleCloseClick = () => {
        handleCloseWithCallback(onClose)
    }

    const getFieldError = (field) => {
        if (fieldErrors[field]) return fieldErrors[field]
        if (attemptedSubmit && touched[field] && !form[field]) return 'Field ini wajib diisi'
        return null
    }

    const getFieldStatus = (field, isRequired = false) => {
        const value = form[field]
        const isTouched = touched[field] || attemptedSubmit
        const error = getFieldError(field)

        if (error && isTouched) return 'error'
        if (isRequired) {
            if (isTouched && !value) return 'error'
            if (value) return 'success'
        } else {
            if (value) return 'success'
        }
        return 'normal'
    }

    const inputCls = useCallback((field, required = false) => {
        const s = getFieldStatus(field, required)
        return `w-full px-4 h-11 rounded-xl border bg-[var(--color-surface)] outline-none transition-all text-[13px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] placeholder:opacity-40 ${
            s === 'error' ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/5' :
            s === 'success' ? 'border-emerald-500/30 bg-emerald-50/5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500' :
            'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]'
        }`
    }, [touched, attemptedSubmit, fieldErrors])

    const nameInputCls = useMemo(() => {
        const base = inputCls('name', true)
        if (nameStatus === 'checking') return base + ' border-amber-500/30'
        if (nameStatus === 'valid') return base
        if (nameStatus === 'invalid') return base
        return base
    }, [nameStatus, inputCls])

    const avatarInitials = useMemo(() => getInitials(form.name), [form.name])

    const footerContent = (
        <div className="flex items-center w-full gap-3">
            <button
                type="button"
                onClick={handleCloseClick}
                className="h-10 px-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] text-[10px] font-black uppercase tracking-widest transition-all shrink-0 flex items-center justify-center"
            >
                Batal
            </button>
            <div className="flex-1" />

            {saveState === 'saved' && (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 animate-in fade-in slide-in-from-right-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-[10px] font-bold">Tersimpan!</span>
                </div>
            )}

            <button
                type="submit"
                form="class-form-modal"
                disabled={submitting || !hasTeachers || saveState === 'saved'}
                className="h-10 px-6 sm:px-8 rounded-xl bg-[var(--color-primary)] text-white text-[10px] font-bold uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[var(--color-primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 shrink-0"
            >
                {submitting || saveState === 'saving' ? (
                    <>
                        <Spinner className="animate-spin" />
                        <span>Menyimpan...</span>
                    </>
                ) : (
                    <>
                        <CheckCircle className="w-3 h-3 opacity-80 shrink-0" />
                        <span className="truncate hidden sm:inline">{selectedItem ? 'Simpan Perubahan' : 'Simpan Data'}</span>
                        <span className="truncate sm:hidden">Simpan</span>
                    </>
                )}
            </button>
        </div>
    )

    const titleContent = selectedItem ? 'Edit Data Kelas' : 'Tambah Kelas Baru'

    const descriptionContent = (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-[var(--color-primary)] to-emerald-500 transition-all duration-500 ease-out rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <span className="text-[10px] font-black text-[var(--color-primary)] whitespace-nowrap">{progress}% Lengkap</span>
            </div>
            {hasChanges && (
                <span className="text-[9px] font-bold text-amber-500 flex items-center gap-1">
                    <ArrowsClockwise className="w-3 h-3" />
                    Belum disimpan
                </span>
            )}
        </div>
    )

    if (!isOpen) return null

    return (
        <>
        <Modal
            isOpen={isOpen}
            onClose={handleCloseClick}
            title={titleContent}
            description={descriptionContent}
            icon={selectedItem ? Pencil : Plus}
            iconBg="bg-[var(--color-primary)]/10"
            iconColor="text-[var(--color-primary)]"
            size="lg"
            mobileVariant="bottom-sheet"
            footer={footerContent}
        >
            <form
                id="class-form-modal"
                onSubmit={handleSubmit}
                className="space-y-5"
                noValidate
            >
                {/* ── Section: Identitas Kelas ── */}
                <div className="space-y-4">
                    <button
                        type="button"
                        onClick={() => toggleSection('identity')}
                        className="flex items-center gap-2.5 pt-2 w-full group cursor-pointer"
                        aria-expanded={sectionsOpen.identity}
                        aria-controls="section-identity"
                    >
                        <div className="w-1 h-4 bg-[var(--color-primary)] rounded-full" />
                        <Hash className="text-[var(--color-primary)] w-3.5 h-3.5 opacity-70" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Identitas Kelas</span>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--color-border)] to-transparent opacity-40" />
                        <div className="transition-transform duration-200" style={{ transform: sectionsOpen.identity ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                            <CaretRight className="w-3 h-3 text-[var(--color-text-muted)]" />
                        </div>
                    </button>

                    <div
                        id="section-identity"
                        className="overflow-hidden transition-all duration-300 ease-out"
                        style={{
                            maxHeight: sectionsOpen.identity ? '500px' : '0px',
                            opacity: sectionsOpen.identity ? 1 : 0,
                        }}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Avatar Preview + Nama Kelas */}
                            <div className="relative group">
                                <label
                                    htmlFor="class-name"
                                    className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider ml-1 mb-1 block opacity-50"
                                >
                                    Nama Kelas <span className="text-rose-500">*</span>
                                </label>
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 flex items-center justify-center shrink-0 transition-all duration-300">
                                        <span className="text-[11px] font-black text-[var(--color-primary)]">{avatarInitials}</span>
                                    </div>
                                    <div className="flex-1 relative">
                                        <input
                                            ref={nameInputRef}
                                            id="class-name"
                                            type="text"
                                            required
                                            value={form.name}
                                            onChange={e => setField('name', e.target.value)}
                                            onBlur={() => setFieldTouched('name')}
                                            placeholder="e.g. 7A, 8B, 9C"
                                            className={nameInputCls}
                                            aria-invalid={getFieldStatus('name', true) === 'error'}
                                            aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                                            autoComplete="off"
                                        />
                                        {nameStatus === 'checking' && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Spinner className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                                            </div>
                                        )}
                                        {nameStatus === 'valid' && form.name && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {fieldErrors.name ? (
                                    <p id="name-error" className="mt-1 ml-14 text-[10px] font-bold text-rose-500 flex items-center gap-1" role="alert">
                                        <Warning className="w-3 h-3" />
                                        {fieldErrors.name}
                                    </p>
                                ) : (
                                    <p className="mt-1 ml-14 text-[10px] font-bold text-[var(--color-text-muted)] opacity-60">
                                        Format singkat: 7A, 8B, 9C
                                    </p>
                                )}
                            </div>

                            {/* Gender Segment */}
                            <div className="relative group">
                                <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider ml-1 mb-1 block opacity-50">Segmen Gender</label>
                                <div className="flex p-1 bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-xl h-11" role="radiogroup" aria-label="Gender">
                                    {GENDERS.map(g => (
                                        <button
                                            key={g}
                                            type="button"
                                            role="radio"
                                            aria-checked={form.gender_type === g}
                                            onClick={() => setField('gender_type', g)}
                                            className={`flex-1 rounded-lg text-[10px] font-bold tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${form.gender_type === g
                                                ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20'
                                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]'}`}
                                        >
                                            {g === 'Putra' ? <GenderMale className="w-3 h-3" /> : <GenderFemale className="w-3 h-3" />}
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tingkat */}
                            <div className="relative group">
                                <label
                                    htmlFor="class-level"
                                    className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider ml-1 mb-1 block opacity-50"
                                >
                                    Tingkat / Grade
                                </label>
                                <Select
                                    id="class-level"
                                    value={form.level}
                                    onChange={val => setField('level', val)}
                                    options={LEVEL_OPTIONS}
                                    placeholder="Pilih Tingkat"
                                    icon={Buildings}
                                    status={getFieldStatus('level')}
                                />
                            </div>

                            {/* Program */}
                            <div className="relative group">
                                <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider ml-1 mb-1 block opacity-50">Program</label>
                                <div className="flex p-1 bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-xl h-11" role="radiogroup" aria-label="Program">
                                    {PROGRAMS.map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            role="radio"
                                            aria-checked={form.program === p}
                                            onClick={() => setField('program', p)}
                                            title={p === 'Boarding' ? 'Asrama / Pesantren' : 'Reguler / Non-asrama'}
                                            className={`flex-1 rounded-lg text-[10px] font-bold tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${form.program === p
                                                ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20'
                                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]'}`}
                                        >
                                            {p === 'Boarding' ? <Bed className="w-3 h-3" /> : <Building className="w-3 h-3" />}
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Divider ── */}
                <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent" />

                {/* ── Section: Penanggung Jawab & Periode ── */}
                <div className="space-y-4 pb-2">
                    <button
                        type="button"
                        onClick={() => toggleSection('details')}
                        className="flex items-center gap-2.5 pt-1 w-full group cursor-pointer"
                        aria-expanded={sectionsOpen.details}
                        aria-controls="section-details"
                    >
                        <div className="w-1 h-4 bg-[var(--color-primary)] rounded-full" />
                        <ChalkboardTeacher className="text-[var(--color-primary)] w-3.5 h-3.5 opacity-70" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Penanggung Jawab & Periode</span>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--color-border)] to-transparent opacity-40" />
                        <div className="transition-transform duration-200" style={{ transform: sectionsOpen.details ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                            <CaretRight className="w-3 h-3 text-[var(--color-text-muted)]" />
                        </div>
                    </button>

                    <div
                        id="section-details"
                        className="overflow-hidden transition-all duration-300 ease-out"
                        style={{
                            maxHeight: sectionsOpen.details ? '500px' : '0px',
                            opacity: sectionsOpen.details ? 1 : 0,
                        }}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Wali Kelas */}
                            <div className="relative group">
                                <label
                                    htmlFor="class-teacher"
                                    className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider ml-1 mb-1 block opacity-50"
                                >
                                    Wali Kelas (Homeroom Teacher)
                                </label>
                                <Select
                                    id="class-teacher"
                                    value={form.homeroom_teacher_id || ''}
                                    onChange={val => setField('homeroom_teacher_id', val)}
                                    options={teachersList.map(t => ({ id: t.id, name: t.name }))}
                                    extraOption={{ id: '', name: 'Tanpa Wali Kelas' }}
                                    placeholder={hasTeachers ? 'Pilih Wali Kelas' : 'Tidak ada data guru'}
                                    icon={UserCheck}
                                    searchable
                                    disabled={!hasTeachers}
                                    status={getFieldStatus('homeroom_teacher_id')}
                                    aria-invalid={getFieldStatus('homeroom_teacher_id') === 'error'}
                                />
                                {!hasTeachers && (
                                    <div className="mt-2 ml-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2" role="alert">
                                        <Warning className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                                            Tambah Guru di <span className="font-black">Master Data → Guru</span>
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Tahun Akademik */}
                            <div className="relative group">
                                <label
                                    htmlFor="class-year"
                                    className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider ml-1 mb-1 block opacity-50"
                                >
                                    Tahun Akademik <span className="text-rose-500">*</span>
                                </label>
                                <Select
                                    id="class-year"
                                    value={form.academic_year}
                                    onChange={val => setField('academic_year', val)}
                                    options={periodsList.map(y => ({ id: y.academic_year, name: y.label }))}
                                    placeholder="Pilih Tahun Akademik"
                                    icon={Calendar}
                                    status={getFieldStatus('academic_year', true)}
                                    aria-invalid={getFieldStatus('academic_year', true) === 'error'}
                                />
                                {fieldErrors.academic_year && (
                                    <p className="mt-1 ml-1 text-[10px] font-bold text-rose-500 flex items-center gap-1" role="alert">
                                        <Warning className="w-3 h-3" />
                                        {fieldErrors.academic_year}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Form Error ── */}
                {formError && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 animate-in fade-in" role="alert" aria-live="assertive">
                        <Warning className="w-4 h-4 text-red-500 shrink-0" />
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">{formError}</p>
                    </div>
                )}
            </form>
        </Modal>

        <ConfirmDialog
            isOpen={showDiscardConfirm}
            onClose={handleDiscardCancel}
            onConfirm={handleDiscardConfirm}
            title="Buang Perubahan?"
            description="Tindakan ini tidak dapat dibatalkan."
            icon={Warning}
            iconBg="bg-amber-500/10"
            iconColor="text-amber-500"
            confirmText="Buang & Tutup"
            confirmIcon={Trash}
            confirmColor="amber"
            size="sm"
        >
            <p className="text-[11px] font-bold text-[var(--color-text-muted)] leading-relaxed">
                Semua perubahan yang belum tersimpan pada data kelas akan hilang sepenuhnya dan tidak dapat dikembalikan.
            </p>
        </ConfirmDialog>
    </>
    )
})

export default ClassFormModal
