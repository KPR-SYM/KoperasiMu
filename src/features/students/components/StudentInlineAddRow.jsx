import React, { useState, useEffect, useRef } from 'react'
import { Check, Spinner, X } from '@phosphor-icons/react'

import RichSelect from '@shared/components/RichSelect'

export default function StudentInlineAddRow({
    classesList,
    onSubmit,
    onCancel,
    submitting,
    initialClassId,
    canEdit,
    visibleColumns = {}
}) {
    const vc = {
        gender: true,
        kelas: true,
        status: true,
        profil: true,
        tags: true,
        aksi: true,
        ...visibleColumns
    }

    const nameInputRef = useRef(null)
    const [localForm, setLocalForm] = useState({
        name: '',
        gender: 'L',
        class_id: initialClassId || '',
        phone: ''
    })

    useEffect(() => {
        if (nameInputRef.current) {
            nameInputRef.current.focus()
        }
    }, [])

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleSubmit()
        } else if (e.key === 'Escape') {
            e.preventDefault()
            onCancel()
        }
    }

    const handleSubmit = async () => {
        if (!localForm.name || !localForm.class_id || !canEdit) return
        await onSubmit(localForm)
        setLocalForm(prev => ({ ...prev, name: '', phone: '' }))
    }

    return (
        <tr className="border-t-2 border-[var(--color-primary)]/30 bg-[var(--color-primary)]/[0.01] transition-all duration-300">
            <td className="px-4 py-3 w-12">
                <div className="w-4 h-4 rounded border border-[var(--color-border)] opacity-20 mx-auto" />
            </td>

            <td className="px-4 py-3 min-w-[250px]">
                <input
                    ref={nameInputRef}
                    type="text"
                    value={localForm.name}
                    onChange={e => setLocalForm(p => ({ ...p, name: e.target.value }))}
                    onKeyDown={handleKeyDown}
                    placeholder="Nama Siswa"
                    className="input-field text-xs h-9 px-3 rounded-xl border-[var(--color-border)] focus:border-[var(--color-primary)] bg-[var(--color-surface)] w-full"
                />
            </td>

            {vc.gender && (
                <td className="px-4 py-3 text-center w-20">
                    <div className="flex gap-1 justify-center">
                        {['L', 'P'].map(g => (
                            <button key={g} type="button" onClick={() => setLocalForm(p => ({ ...p, gender: g }))}
                                className={`w-8 h-8 rounded-lg text-[10px] font-black border transition-all ${localForm.gender === g ? (g === 'L' ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-pink-500 text-white border-pink-500 shadow-lg shadow-pink-500/20') : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] bg-[var(--color-surface)]'}`}
                            >{g}</button>
                        ))}
                    </div>
                </td>
            )}

            {vc.kelas && (
                <td className="px-4 py-3 text-center w-44">
                    <RichSelect
                        small
                        value={localForm.class_id}
                        onChange={val => setLocalForm(p => ({ ...p, class_id: val }))}
                        options={classesList}
                        placeholder="Pilih Kelas"
                        className="w-full"
                    />
                </td>
            )}

            {/* Status column: reused as phone/WA number entry for the quick-add row */}
            {vc.status && (
                <td className="px-4 py-3 text-center w-32">
                    <input
                        type="text"
                        value={localForm.phone}
                        onChange={e => setLocalForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
                        onKeyDown={handleKeyDown}
                        placeholder="No. Whatsapp"
                        className="input-field text-[10px] h-9 px-2 rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] w-full text-center"
                    />
                </td>
            )}

            {/* Profil column: no equivalent input while adding, keep empty placeholder
                so this row stays aligned with the table header/body columns */}
            {vc.profil && <td className="px-4 py-3 w-32" />}

            {vc.tags && <td className="px-4 py-3 w-28" />}

            {vc.aksi && (
                <td className="px-4 py-3 text-center w-[280px]">
                    <div className="flex items-center justify-center gap-1.5">
                        <button onClick={handleSubmit} disabled={submitting || !canEdit || !localForm.name || !localForm.class_id}
                            className="h-9 px-3 rounded-xl bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-[var(--color-primary)]/20 transition-all disabled:opacity-50 flex items-center gap-1.5">
                            {submitting ? <Spinner className="fa-spin" /> : <><Check /> Simpan</>}
                        </button>
                        <button onClick={onCancel}
                            className="h-9 w-9 rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-red-500 hover:text-white hover:border-red-500 transition-all flex items-center justify-center">
                            <X />
                        </button>
                    </div>
                </td>
            )}
        </tr>
    )
}