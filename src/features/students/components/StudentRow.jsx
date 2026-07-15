import React, { memo, useState, useRef, useEffect } from 'react'
import { Archive, Check, CaretDown, ChatCircle, IdentificationCard, GenderMale, Pencil, Plus, Tag, ClockCounterClockwise, UserCheck, GenderFemale, X, MapPin } from '@phosphor-icons/react'
import { createPortal } from 'react-dom'


import useLongPress from '@hooks/useLongPress'
import { getTagColor, calculateCompleteness } from '@features/students/utils/studentsConstants'

// Singleton portal manager to prevent 'removeChild' errors in concurrent mode or Android/GlobeHemisphereWest Translate
const _portalContainers = {}
function getPortalContainer(id) {
    if (typeof document === 'undefined') return null
    if (!_portalContainers[id]) {
        let el = document.getElementById(id)
        if (!el) {
            el = document.createElement('div')
            el.id = id
            document.body.appendChild(el)
        }
        _portalContainers[id] = el
    }
    return _portalContainers[id]
}

// ─── Inline Pen: Name ───────────────────────────────────────────────────────
const InlineEditName = ({ value, onSave, onCancel }) => {
    const [val, setVal] = useState(value)
    const inputRef = useRef(null)
    useEffect(() => { inputRef.current?.focus(); inputRef.current?.select() }, [])
    return (
        <div className="flex items-center gap-1.5">
            <input
                ref={inputRef}
                value={val}
                onChange={e => setVal(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter') onSave(val.trim())
                    if (e.key === 'Escape') onCancel()
                }}
                className="input-field h-7 px-2 rounded-lg border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-extrabold w-36 focus:border-[var(--color-primary)] outline-none"
            />
            <button onClick={() => onSave(val.trim())} className="w-7 h-7 rounded-md bg-emerald-500 text-white flex items-center justify-center text-[10px] hover:brightness-110 transition-all shadow-sm">
                <Check />
            </button>
            <button onClick={onCancel} className="w-7 h-7 rounded-md bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-muted)] flex items-center justify-center text-[10px] hover:bg-[var(--color-border)] transition-all">
                <X />
            </button>
        </div>
    )
}

// ─── Inline Pen: Gender ─────────────────────────────────────────────────────
const InlineEditGender = ({ value, onSave, onCancel }) => (
    <div className="flex items-center gap-1.5">
        {['L', 'P'].map(g => (
            <button
                key={g}
                onClick={() => onSave(g)}
                className={`w-8 h-8 rounded-lg text-xs font-black border-2 transition-all
                    ${value === g
                        ? (g === 'L' ? 'bg-blue-500 text-white border-blue-500' : 'bg-pink-500 text-white border-pink-500')
                        : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] bg-[var(--color-surface)]'
                    }`}
            >
                {g === 'L' ? <GenderMale /> : <GenderFemale />}
            </button>
        ))}
        <button onClick={onCancel} className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)] transition-all text-[10px]">
            <X />
        </button>
    </div>
)

// ─── Inline Pen: Kelas ──────────────────────────────────────────────────────
const InlineEditKelas = ({ value, classesList, onSave, onCancel }) => {
    const [val, setVal] = useState(value)
    return (
        <div className="flex items-center gap-1">
            <select
                value={val}
                onChange={e => setVal(e.target.value)}
                autoFocus
                className="select-field h-8 px-2 rounded-lg border-[var(--color-border)] bg-[var(--color-surface)] text-[10px] font-black outline-none focus:border-[var(--color-primary)] w-32"
            >
                <option value="">Pilih kelas</option>
                {classesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={() => onSave(val)} disabled={!val} className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-[10px] hover:brightness-110 disabled:opacity-40 transition-all">
                <Check />
            </button>
            <button onClick={onCancel} className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--color-border)] text-[var(--color-text-muted)] bg-[var(--color-surface-alt)] hover:bg-[var(--color-border)] transition-all text-[10px]">
                <X />
            </button>
        </div>
    )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export const StudentRow = memo(({
    student,
    isSelected = false,
    onEdit,
    onViewProfile,
    onViewQR,
    onViewPrint,
    onViewTags,
    onViewClassHistory,
    onConfirmDelete,
    onClassBreakdown,
    onPhotoZoom,
    onToggleSelect,
    onInlineUpdate,
    onTogglePin,
    isPrivacyMode,
    visibleColumns = {},
    classesList = [],
    buildWAMessage,
    openWAForStudent,
    waTemplate
}) => {
    const vc = {
        gender: true,
        kelas: true,
        profil: true,
        tags: true,
        aksi: true,
        ...visibleColumns
    }
    const maskInfo = (str, visibleLen = 3) => {
        if (!str) return '---'
        if (str.length <= visibleLen) return str[0] + '*'.repeat(str.length - 1)
        return str.substring(0, visibleLen) + '***'
    }

    const [showQuickViewPopover, setShowQuickViewPopover] = useState(false)
    const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 })
    const nameRef = useRef(null)

    const hoverTimerRef = useRef(null)
    const closeTimerRef = useRef(null)

    const handleMouseEnter = () => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
        if (showQuickViewPopover) return

        hoverTimerRef.current = setTimeout(() => {
            if (!nameRef.current) return
            const rect = nameRef.current.getBoundingClientRect()
            setPopoverPos({
                top: rect.top - 12,
                left: rect.left
            })
            setShowQuickViewPopover(true)
        }, 400) // Enterprise delay for stability
    }

    const handleMouseLeave = () => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
        closeTimerRef.current = setTimeout(() => {
            setShowQuickViewPopover(false)
        }, 300) // Buffer to move mouse into the card
    }

    const handlePopoverEnter = () => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }

    // ── Inline edit state ──────────────────────────────────────────────────
    const [editingField, setEditingField] = useState(null) // 'name' | 'gender' | 'kelas'

    const handleInlineSave = async (field, value) => {
        await onInlineUpdate(student.id, field, value, student)
        setEditingField(null)
    }

    const cancelEdit = () => setEditingField(null)

    return (
        <tr className={`border-t border-[var(--color-border)] transition-colors group/row table-row-lazy
            hover:bg-[var(--color-surface-alt)]/40
            ${editingField ? 'bg-[var(--color-primary)]/[0.02]' : ''}
            ${student.is_pinned ? 'bg-amber-500/[0.04] border-l-2 border-l-amber-400' : ''}
        `}>

            {/* Checkbox + MapPin */}
            <td className="px-4 py-4 w-12">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(student.id)}
                        className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] accent-[var(--color-primary)] cursor-pointer shrink-0"
                    />
                    <button
                        onClick={() => onTogglePin(student)}
                        title={student.is_pinned ? 'Unpin siswa' : 'MapPin ke atas'}
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all
                            ${student.is_pinned
                                ? 'text-amber-500 opacity-100'
                                : 'text-[var(--color-text-muted)] opacity-0 group-hover/row:opacity-100 hover:text-amber-500'
                            }`}
                    >
                        <MapPin
                            className={`w-2.5 h-2.5 transition-transform ${student.is_pinned ? 'rotate-0' : 'rotate-45'}`}
                        />
                    </button>
                </div>
            </td>

            {/* ── Siswa (Nama) ─────────────────────────────────────────── */}
            <td className="px-4 py-4 min-w-[250px]">
                <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shadow-sm overflow-hidden relative cursor-pointer transition-transform hover:scale-110
                                bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 text-[var(--color-primary)]
                                ${isPrivacyMode ? 'blur-sm grayscale opacity-60' : ''}`}
                            onClick={() => { if (isPrivacyMode) return; student.photo_url && onPhotoZoom({ url: student.photo_url, name: student.name, registrationCode: student.registration_code, className: student.className }) }}
                            title={student.photo_url && !isPrivacyMode ? 'Klik untuk zoom foto' : ''}
                        >
                            {student.photo_url
                                ? <img src={student.photo_url} alt="" className="w-full h-full object-cover relative z-10" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = '') }} />
                                : null
                            }
                            <span className="relative z-10" style={student.photo_url ? { display: 'none' } : {}}>{isPrivacyMode ? '*' : (student.name || 'S').charAt(0)}</span>
                        </div>

                    </div>

                    {/* Name + badges area */}
                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 group/name relative">
                            {editingField === 'name' ? (
                                <InlineEditName
                                    value={student.name}
                                    onSave={val => handleInlineSave('name', val)}
                                    onCancel={cancelEdit}
                                />
                            ) : (
                                <div className="flex items-center gap-1.5 min-w-0 max-w-full relative">
                                    <div
                                        ref={nameRef}
                                        className="relative flex items-center gap-1.5"
                                        onMouseEnter={handleMouseEnter}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        <button
                                            onClick={() => onViewProfile(student)}
                                            className="font-extrabold text-sm text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors text-left truncate"
                                        >
                                            {isPrivacyMode ? maskInfo(student.name, 4) : student.name}
                                        </button>

                                        {/* Premium Quick View Popover - PORTALED to avoid clipping */}
                                        {showQuickViewPopover && !isPrivacyMode && createPortal(
                                            <div
                                                onMouseEnter={handlePopoverEnter}
                                                onMouseLeave={handleMouseLeave}
                                                className="fixed z-[9999] w-72 p-5 rounded-[2rem] glass shadow-2xl border border-[var(--color-primary)]/20 animate-in fade-in slide-in-from-bottom-3 duration-300 pointer-events-auto"
                                                style={{
                                                    top: popoverPos.top,
                                                    left: popoverPos.left,
                                                    transform: 'translateY(-100%)'
                                                }}
                                            >
                                                {/* Header Profile Rows */}
                                                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-[var(--color-border)]/50">
                                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black shadow-inner relative group/pop-img
                                                        bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 text-[var(--color-primary)]">
                                                        {student.photo_url ? (
                                                            <img src={student.photo_url} className="w-full h-full object-cover rounded-2xl" onError={(e) => { e.target.onerror = null; e.target.parentElement.innerHTML = `<span>${(student.name || 'S').charAt(0)}</span>` }} />
                                                        ) : (
                                                            <span>{(student.name || 'S').charAt(0)}</span>
                                                        )}
                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/pop-img:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                                                            <Plus className="text-white w-3 h-3" />
                                                        </div>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="w-4 h-4 font-black text-[var(--color-text)] truncate mb-0.5">{student.name}</p>
                                                        <p className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-[0.2em]">{student.className || 'Tanpa Kelas'}</p>
                                                        <p className="text-[9px] font-bold text-[var(--color-text-muted)] opacity-40 uppercase tracking-widest mt-1">{student.registration_code || student.code || 'NO ID'}</p>
                                                    </div>
                                                </div>

                                                {/* Quick Stat: Kelengkapan Profil */}
                                                <div className="mb-4">
                                                    <div className="p-3 rounded-2xl bg-[var(--color-surface-alt)]/50 border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 transition-colors">
                                                        <p className="text-[8px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-1 opacity-60">Kelengkapan Profil</p>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-1 rounded-full bg-[var(--color-border)] overflow-hidden">
                                                                <div className="h-full bg-[var(--color-primary)]" style={{ width: `${calculateCompleteness(student)}%` }} />
                                                            </div>
                                                            <p className="w-3 h-3 font-black text-[var(--color-primary)]">{calculateCompleteness(student)}%</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Interactive Action Area */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onViewProfile(student) }}
                                                        className="flex-1 h-10 rounded-xl bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[var(--color-primary)]/20"
                                                    >
                                                        Lihat Profil
                                                    </button>
                                                    {student.phone && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const msg = buildWAMessage?.(student, 'intro') || `Halo ${student.name}, saya dari sekolah...`;
                                                                openWAForStudent?.(student, msg);
                                                            }}
                                                            className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
                                                            title="Chat WhatsApp"
                                                        >
                                                            <ChatCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Tooltip Arrow */}
                                                <div className="absolute bottom-[-6px] left-8 w-3 h-3 bg-[var(--color-surface)] border-r border-b border-[var(--color-primary)]/20 rotate-45"></div>

                                                {/* Invisible Bridge (Safe Area) — Menghubungkan nama dengan popover agar hover tidak putus */}
                                                <div className="absolute -bottom-4 left-0 right-0 h-4 bg-transparent" />
                                            </div>,
                                            getPortalContainer('portal-quick-view')
                                        )}
                                    </div>

                                    {!isPrivacyMode && (
                                        <button
                                            onClick={() => setEditingField('name')}
                                            className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all opacity-0 group-hover/name:opacity-100"
                                            title="Pen nama"
                                        >
                                            <Pencil className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Identification line */}
                        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                            <span className="text-[10px] font-bold text-[var(--color-text-muted)] opacity-60 uppercase tracking-wider truncate">
                                {isPrivacyMode ? maskInfo(student.registration_code || student.code, 2) : (student.registration_code || student.code)}
                            </span>
                        </div>
                    </div>
                </div>
            </td>

            {/* ── Gender ───────────────────────────────────────────────── */}
            {vc.gender && (
                <td className="px-4 py-4 text-center whitespace-nowrap w-20">
                    {editingField === 'gender' ? (
                        <InlineEditGender
                            value={student.gender}
                            onSave={val => handleInlineSave('gender', val)}
                            onCancel={cancelEdit}
                        />
                    ) : (
                        <div className="flex items-center justify-start group/gender">
                            <div className="relative">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shadow-inner transition-all
                                    ${student.gender === 'L' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-pink-500/10 text-pink-500 border border-pink-500/20'}`}>
                                    {student.gender === 'L' ? <GenderMale /> : <GenderFemale />}
                                </div>
                                <button
                                    onClick={() => setEditingField('gender')}
                                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all opacity-0 group-hover/gender:opacity-100 shadow-sm"
                                    title="Pen gender"
                                >
                                    <Pencil className="w-2 h-2" />
                                </button>
                            </div>
                        </div>
                    )}
                </td>
            )}

            {/* ── Kelas ────────────────────────────────────────────────── */}
            {vc.kelas && (
                <td className="px-4 py-4 text-center whitespace-nowrap w-44">
                    {editingField === 'kelas' ? (
                        <InlineEditKelas
                            value={student.class_id}
                            classesList={classesList}
                            onSave={val => handleInlineSave('kelas', val)}
                            onCancel={cancelEdit}
                        />
                    ) : (
                        <div className="flex items-center justify-start group/kelas">
                            <div className="relative">
                                <button
                                    onClick={() => onClassBreakdown(student.class_id, student.className)}
                                    className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 uppercase tracking-widest leading-none hover:bg-[var(--color-primary)]/20 transition-colors"
                                >
                                    {student.className}
                                </button>
                                <button
                                    onClick={() => setEditingField('kelas')}
                                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all opacity-0 group-hover/kelas:opacity-100 shadow-sm"
                                    title="Pen kelas"
                                >
                                    <Pencil className="w-2 h-2" />
                                </button>
                            </div>
                        </div>
                    )}
                </td>
            )}

            {/* ── Status ────────────────────────────────────────────────── */}
            {vc.status && (
                <td className="px-4 py-4 text-center whitespace-nowrap w-32">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider
                        ${student.status === 'aktif' ? 'bg-emerald-500/10 text-emerald-600' :
                            student.status === 'lulus' ? 'bg-blue-500/10 text-blue-600' :
                                'bg-slate-500/10 text-slate-500'}`}>
                        {student.status || 'aktif'}
                    </span>
                </td>
            )}

            {/* ── Kelengkapan Profil ──────────────────────────────────────── */}
            {vc.profil && (
                <td className="px-4 py-4 text-center whitespace-nowrap w-32">
                    <div className="flex items-center gap-2">
                        {(() => {
                            const score = calculateCompleteness(student);
                            return (
                                <>
                                    <div className="w-10 h-1.5 rounded-full bg-[var(--color-surface-alt)] overflow-hidden shrink-0 border border-[var(--color-border)]/50">
                                        <div
                                            className={`h-full transition-all duration-1000 ${score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                            style={{ width: `${score}%` }}
                                        />
                                    </div>
                                    <span className={`text-[10px] font-black ${score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                        {score}%
                                    </span>
                                </>
                            );
                        })()}
                    </div>
                </td>
            )}

            {/* ── Label/Tag ─────────────────────────────────────────────── */}
            {vc.tags && (
                <td className="px-4 py-4 text-center whitespace-nowrap w-28">
                    <div className="flex flex-wrap items-center gap-1 max-w-[120px]">
                        {(student.tags || []).length > 0 ? (
                            student.tags.map(tag => (
                                <span key={tag} className={`text-[8px] font-black px-1.5 py-0.5 rounded-md border uppercase tracking-wider whitespace-nowrap transition-all hover:scale-105 cursor-default ${getTagColor(tag)}`}>
                                    {tag}
                                </span>
                            ))
                        ) : (
                            <span className="text-[9px] font-bold text-[var(--color-text-muted)] opacity-30 italic">No Label</span>
                        )}
                    </div>
                </td>
            )}

            {/* ── Aksi ─────────────────────────────────────────────────── */}
            {vc.aksi && (
                <td className="px-4 py-3 text-center w-[280px] whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                        <button onClick={() => onViewProfile(student)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-emerald-500 hover:bg-emerald-500/10 transition-all text-sm" title="Lihat Profil">
                            <UserCheck />
                        </button>

                        <button
                            disabled={!student.phone}
                            onClick={() => openWAForStudent(student, buildWAMessage(student, 'general'))}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all text-sm
                                ${student.phone
                                    ? 'text-[var(--color-text-muted)] hover:text-emerald-600 hover:bg-emerald-500/10'
                                    : 'text-slate-400 opacity-60 grayscale cursor-not-allowed'}`}
                            title={student.phone ? "Hubungi via WhatsApp" : "Nomer WA belum diatur"}
                        >
                            <ChatCircle />
                        </button>
                        {onEdit && (
                            <button onClick={() => onEdit(student)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-blue-500 hover:bg-blue-500/10 transition-all text-sm" title="Pen">
                                <Pencil />
                            </button>
                        )}
                        <button onClick={() => onViewPrint(student)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-amber-500 hover:bg-amber-500/10 transition-all text-sm" title="ID Card">
                            <IdentificationCard />
                        </button>
                        <button onClick={() => onViewTags(student)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-violet-500 hover:bg-violet-500/10 transition-all text-sm" title="Label">
                            <Tag />
                        </button>
                        <button onClick={() => onViewClassHistory(student)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-purple-500 hover:bg-purple-500/10 transition-all text-sm" title="Riwayat Kelas">
                            <ClockCounterClockwise />
                        </button>

                        {onConfirmDelete && (
                            <button onClick={() => onConfirmDelete(student)} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-all text-sm" title="Arsipkan">
                                <Archive />
                            </button>
                        )}
                    </div>
                </td>
            )}
        </tr>
    )
})

StudentRow.displayName = 'StudentRow'

// ─── Mobile Card ─────────────────────────────────────────────────────────────
export const StudentMobileCard = memo(({
    student,
    isSelected = false,
    onToggleSelect,
    hasSelection = false,
    onViewProfile,
    onEdit,
    onConfirmDelete,
    onTogglePin,
    isPrivacyMode,
    buildWAMessage,
    openWAForStudent,
    waTemplate
}) => {
    const longPressProps = useLongPress(() => {
        onToggleSelect(student.id)
    }, {
        delay: 600,
        onClick: () => {
            if (hasSelection) {
                onToggleSelect(student.id)
            } else {
                onViewProfile(student)
            }
        }
    })

    const handleActionAreaClick = (e) => {
        e.stopPropagation();
    };
    const stopTouch = (e) => {
        e.stopPropagation();
    };

    const maskInfo = (str, visibleLen = 3) => {
        if (!str) return '---'
        if (str.length <= visibleLen) return str[0] + '*'.repeat(str.length - 1)
        return str.substring(0, visibleLen) + '***'
    }

    return (
        <div
            {...longPressProps}
            className={`group relative p-1.5 rounded-3xl border transition-all duration-300 ease-out select-none
                ${isSelected
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/[0.04] shadow-xl shadow-[var(--color-primary)]/10 ring-1 ring-[var(--color-primary)]/20'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] shadow-md shadow-black/[0.02]'}
                ${student.is_pinned ? 'border-amber-400/40' : ''}
                ${hasSelection ? 'cursor-pointer' : ''}
            `}
        >
            {/* Minimalist Bottom Progress Bar (Clipped by card boundary) */}
            <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl pointer-events-none">
                <div className="absolute bottom-0 left-0 right-0 h-1 px-[2px]">
                    <div className="w-full h-full bg-[var(--color-border)]/10">
                        <div
                            className={`h-full transition-all duration-1000 ${calculateCompleteness(student) >= 80 ? 'bg-emerald-500/60' : calculateCompleteness(student) >= 50 ? 'bg-amber-500/60' : 'bg-red-400/60'}`}
                            style={{ width: `${calculateCompleteness(student)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* PIN INDICATOR (Visual Only) */}
            {student.is_pinned && (
                <div className="absolute top-2.5 right-4 flex items-center gap-1">
                    <div className="text-[8px] font-black text-amber-500 uppercase tracking-widest opacity-60">Pinned</div>
                    <MapPin className="w-3 h-3 text-amber-500" />
                </div>
            )}

            <div className="p-2.5">
                {/* IDENTITY AREA */}
                <div className="flex items-center gap-3">
                    {/* AVATAR SECTION */}
                    <div className="relative pointer-events-none">
                        <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black shadow-inner border-2 transition-all overflow-hidden
                                ${isSelected ? 'border-[var(--color-primary)] scale-110' : 'border-white dark:border-gray-800'}
                                bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-primary)]/90 to-[var(--color-accent)] text-white
                                ${isPrivacyMode ? 'blur-md grayscale opacity-60' : ''}`}
                        >
                            {student.photo_url
                                ? <img src={student.photo_url} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = '') }} />
                                : null
                            }
                            <span style={student.photo_url ? { display: 'none' } : {}}>{isPrivacyMode ? '*' : (student.name || 'S').charAt(0)}</span>

                            {/* Selection Checkmark SealCheck - Top Left of Avatar */}
                            {isSelected && (
                                <div className="absolute -top-1 -left-1 w-5.5 h-5.5 rounded-full bg-[var(--color-primary)] border-2 border-white dark:border-gray-800 flex items-center justify-center shadow-md z-30 animate-in zoom-in-50 duration-200">
                                    <Check className="text-white w-2 h-2" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* NAME & IDENTITY */}
                    <div className="flex-1 min-w-0 pr-4 pointer-events-none">
                        <div className="flex flex-col">
                            <h3 className="font-extrabold text-[15px] text-[var(--color-text)] leading-tight tracking-tight mb-0.5 line-clamp-2 break-words">
                                {isPrivacyMode ? maskInfo(student.name, 4) : student.name}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-[var(--color-text-muted)] opacity-40 uppercase tracking-[0.1em]">
                                    {isPrivacyMode ? maskInfo(student.registration_code || student.code, 2) : (student.registration_code || student.code)}
                                </span>
                                <div className="w-1 h-1 rounded-full bg-[var(--color-text-muted)] opacity-20" />
                                <span className={`text-[10px] font-bold ${student.gender === 'L' ? 'text-blue-500/60' : 'text-pink-500/60'}`}>
                                    {student.gender === 'L' ? 'Putra' : 'Putri'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* INFO PILLS */}
                <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--color-surface-alt)]/80 border border-[var(--color-border)]/40 min-w-0">
                            <UserCheck className="w-3 h-3 text-[var(--color-text-muted)] shrink-0" />
                            <span className="text-[10px] font-black text-[var(--color-text)] uppercase tracking-tight truncate">
                                {student.className}
                            </span>
                        </div>
                    </div>

                    {/* WA Shortcut Button */}
                    <div className="flex items-center shrink-0">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                if (!student.phone) return
                                if (openWAForStudent && buildWAMessage) {
                                    openWAForStudent(student, buildWAMessage(student, 'general'))
                                } else {
                                    const phone = student.phone.replace(/[^0-9]/g, '').replace(/^0/, '62')
                                    const text = encodeURIComponent(`Assalamualaikum Wr. Wb.\n\nBapak/Ibu Wali dari Ananda *${student.name}*.\n\n`)
                                    window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
                                }
                            }}
                            onMouseDown={stopTouch}
                            onMouseUp={stopTouch}
                            onTouchStart={stopTouch}
                            onTouchEnd={stopTouch}
                            disabled={!student.phone}
                            title={student.phone ? `Hubungi WA: ${student.phone}` : 'Belum ada nomor WA'}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all
                                ${student.phone
                                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white hover:shadow-lg hover:shadow-emerald-500/20 active:scale-90'
                                    : 'border-[var(--color-border)]/40 bg-[var(--color-surface-alt)]/80 text-[var(--color-text-muted)] opacity-40 cursor-not-allowed'}`}
                        >
                            <ChatCircle className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* Label Tags */}
                {(student.tags || []).length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                        {(student.tags || []).slice(0, 3).map(tag => (
                            <span key={tag} className={`text-[8px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider ${getTagColor(tag)}`}>
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* ACTION FOOTER - Isolated from Card Clicks */}
                <div
                    onClick={handleActionAreaClick}
                    onMouseDown={stopTouch}
                    onMouseUp={stopTouch}
                    onTouchStart={stopTouch}
                    onTouchEnd={stopTouch}
                    className="mt-3 bg-[var(--color-surface-alt)] rounded-2xl p-1 flex items-center justify-between border border-[var(--color-border)] shadow-sm relative z-10"
                >
                    {/* Profil */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onViewProfile(student) }}
                        className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl text-[var(--color-text-muted)] hover:text-emerald-500 hover:bg-[var(--color-surface)] active:scale-95 transition-all"
                    >
                        <IdentificationCard className="w-3 h-3" />
                        <span className="text-[8px] font-black uppercase tracking-wider leading-none">Profil</span>
                    </button>

                    {/* Pen */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(student) }}
                        className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl text-[var(--color-text-muted)] hover:text-indigo-500 hover:bg-[var(--color-surface)] active:scale-95 transition-all"
                    >
                        <Pencil className="w-3 h-3" />
                        <span className="text-[8px] font-black uppercase tracking-wider leading-none">Pen</span>
                    </button>

                    {/* MapPin */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onTogglePin(student) }}
                        className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl transition-all active:scale-95
                            ${student.is_pinned ? 'text-amber-500 bg-[var(--color-surface)] shadow-sm border border-[var(--color-border)]/50' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] border border-transparent'}`}
                    >
                        <MapPin className={`w-3 h-3 ${student.is_pinned ? 'rotate-0' : 'rotate-45'}`} />
                        <span className="text-[8px] font-black uppercase tracking-wider leading-none">
                            {student.is_pinned ? 'Unpin' : 'MapPin'}
                        </span>
                    </button>

                    {/* Arsip */}
                    {onConfirmDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onConfirmDelete(student) }}
                            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl text-red-400/50 hover:text-red-500 hover:bg-red-500/10 active:scale-95 transition-all"
                        >
                            <Archive className="w-3 h-3" />
                            <span className="text-[8px] font-black uppercase tracking-wider leading-none">Arsip</span>
                        </button>
                    )}
                </div>

            </div>
        </div>
    )
})

StudentMobileCard.displayName = 'StudentMobileCard'

export const StudentSkeletonRow = () => (
    <tr className="animate-pulse border-b border-[var(--color-border)]/50">
        <td className="py-4 px-4 w-12 text-center">
            <div className="w-5 h-5 bg-[var(--color-surface-alt)] rounded-lg mx-auto" />
        </td>
        <td className="py-4 px-4 min-w-[250px]">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-surface-alt)] shrink-0" />
                <div className="flex flex-col gap-1.5">
                    <div className="w-40 h-4 bg-[var(--color-surface-alt)] rounded-md" />
                    <div className="w-24 h-3 bg-[var(--color-surface-alt)]/60 rounded-md" />
                </div>
            </div>
        </td>
        <td className="py-4 px-4 text-center w-20">
            <div className="w-8 h-8 bg-[var(--color-surface-alt)] rounded-lg mx-auto" />
        </td>
        <td className="py-4 px-4 text-center w-44">
            <div className="w-20 h-5 bg-[var(--color-surface-alt)] rounded-md mx-auto" />
        </td>
        <td className="py-4 px-4 text-center w-32">
            <div className="w-16 h-5 bg-[var(--color-surface-alt)] rounded-full mx-auto" />
        </td>
        <td className="py-4 px-4 text-center w-28">
            <div className="w-14 h-4 bg-[var(--color-surface-alt)] rounded-md mx-auto" />
        </td>
        <td className="py-4 px-4 text-center w-[280px]">
            <div className="flex gap-2 justify-center">
                <div className="w-8 h-8 bg-[var(--color-surface-alt)] rounded-lg" />
                <div className="w-8 h-8 bg-[var(--color-surface-alt)] rounded-lg" />
                <div className="w-8 h-8 bg-[var(--color-surface-alt)] rounded-lg" />
            </div>
        </td>
    </tr>
)

export const StudentSkeletonCard = () => (
    <div className="animate-pulse rounded-[2.2rem] border border-[var(--color-border)]/50 p-2 bg-[var(--color-surface)] shadow-md shadow-black/[0.02] flex flex-col gap-1">
        <div className="p-3">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-alt)]" />
                <div className="flex-1 space-y-2.5">
                    <div className="w-3/4 h-5 bg-[var(--color-surface-alt)] rounded-lg" />
                    <div className="w-1/2 h-3 bg-[var(--color-surface-alt)]/60 rounded-md" />
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                    <div className="w-24 h-8 bg-[var(--color-surface-alt)]/80 rounded-2xl border border-[var(--color-border)]/40" />
                    <div className="w-16 h-8 bg-[var(--color-surface-alt)]/80 rounded-2xl border border-[var(--color-border)]/40" />
                </div>
                <div className="w-8 h-8 bg-[var(--color-surface-alt)]/80 rounded-xl border border-[var(--color-border)]/40" />
            </div>

            <div className="mt-4 h-11 bg-[var(--color-surface-alt)] rounded-[2.2rem] border border-[var(--color-border)] shadow-sm" />
        </div>
    </div>
)

// ─── Mobile List Row ─────────────────────────────────────────────────────────
export const StudentMobileListRow = memo(({
    student,
    isSelected = false,
    hasSelection = false,
    onToggleSelect,
    onViewProfile,
    onEdit,
    onTogglePin,
    isPrivacyMode,
    canEdit,
    onConfirmDelete,
    buildWAMessage,
    openWAForStudent,
    waTemplate
}) => {
    const [isExpanded, setIsExpanded] = useState(false)

    const maskInfo = (str, visibleLen = 3) => {
        if (!str) return '---'
        if (str.length <= visibleLen) return str[0] + '*'.repeat(str.length - 1)
        return str.substring(0, visibleLen) + '***'
    }

    const timerRef = useRef(null)
    const touchStartRef = useRef({ x: 0, y: 0, time: 0 })
    const isLongPressActive = useRef(false)
    const lastTouchTime = useRef(0)

    const startPress = (e, isTouch) => {
        const touch = isTouch ? e.touches[0] : e
        touchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
        }
        isLongPressActive.current = false

        if (timerRef.current) clearTimeout(timerRef.current)

        timerRef.current = setTimeout(() => {
            isLongPressActive.current = true
            onToggleSelect(student.id)
            if (navigator.vibrate) {
                try { navigator.vibrate(40) } catch (err) { }
            }
        }, 600)
    }

    const endPress = (e, isTouch) => {
        if (timerRef.current) clearTimeout(timerRef.current)

        const now = Date.now()
        if (!isTouch && now - lastTouchTime.current < 500) {
            return
        }
        if (isTouch) {
            lastTouchTime.current = now
        }

        if (isLongPressActive.current) {
            isLongPressActive.current = false
            return
        }

        const touch = isTouch ? e.changedTouches[0] : e
        const diffX = Math.abs(touch.clientX - touchStartRef.current.x)
        const diffY = Math.abs(touch.clientY - touchStartRef.current.y)
        const duration = now - touchStartRef.current.time

        if (diffX < 10 && diffY < 10 && duration < 600) {
            if (hasSelection) {
                onToggleSelect(student.id)
            } else {
                setIsExpanded(prev => !prev)
            }
        }
    }

    const cancelPress = () => {
        if (timerRef.current) clearTimeout(timerRef.current)
    }

    const handleActionAreaClick = (e) => {
        e.stopPropagation()
    }

    const stopTouch = (e) => {
        e.stopPropagation()
    }

    return (
        <div
            className={`w-full flex flex-col transition-all duration-300
                ${isSelected ? 'bg-[var(--color-primary)]/[0.04]' : 'bg-[var(--color-surface)]'}
                ${student.is_pinned ? 'border-l-[4px] border-l-amber-400' : ''}
                ${isExpanded ? 'shadow-md bg-[var(--color-surface-alt)]/[0.02]' : ''}
            `}
        >
            {/* Main Slim Clickable Header */}
            <div
                onTouchStart={(e) => startPress(e, true)}
                onTouchEnd={(e) => endPress(e, true)}
                onTouchMove={cancelPress}
                onMouseDown={(e) => startPress(e, false)}
                onMouseUp={(e) => endPress(e, false)}
                onMouseLeave={cancelPress}
                className="flex items-center gap-3 px-4 py-2.5 min-h-[50px] cursor-pointer select-none active:bg-[var(--color-surface-alt)]/50 transition-colors"
            >
                {/* Selection Checkbox */}
                {hasSelection && (
                    <div
                        className="flex items-center justify-center shrink-0 animate-in fade-in zoom-in duration-200"
                        onClick={(e) => { e.stopPropagation(); onToggleSelect(student.id) }}
                    >
                        <div className={`w-5.5 h-5.5 rounded-lg border-2 transition-all duration-300 flex items-center justify-center
                            ${isSelected
                                ? 'bg-[var(--color-primary)] border-[var(--color-primary)] scale-110 shadow-lg shadow-[var(--color-primary)]/10'
                                : 'border-[var(--color-border)] bg-[var(--color-surface-alt)]/50'}`}>
                            {isSelected && <Check className="text-white w-2 h-2" />}
                        </div>
                    </div>
                )}

                {/* Avatar (Slim) */}
                <div className="relative shrink-0 pointer-events-none">
                    <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shadow-inner border transition-all overflow-hidden
                            bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 text-[var(--color-primary)] border-[var(--color-border)]
                            ${isPrivacyMode ? 'blur-md grayscale opacity-60' : ''}`}
                    >
                        {student.photo_url && !isPrivacyMode ? (
                            <img src={student.photo_url} className="w-full h-full object-cover rounded-lg" alt="" onError={(e) => { e.target.onerror = null; e.target.parentElement.innerHTML = `<span class="text-[11px]">${(student.name || 'S').charAt(0)}</span>` }} />
                        ) : (
                            <span className="text-[11px]">{isPrivacyMode ? '*' : (student.name || 'S').charAt(0)}</span>
                        )}
                    </div>
                </div>

                {/* Name & Basic Info (Wrap up to 2 lines) */}
                <div className="flex-1 min-w-0 pointer-events-none">
                    <h3 className="font-extrabold text-[13px] text-[var(--color-text)] leading-snug line-clamp-2 break-words">
                        {isPrivacyMode ? maskInfo(student.name, 4) : student.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-black text-[var(--color-text-muted)] opacity-50 uppercase tracking-wider">
                            {student.className}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-[var(--color-text-muted)] opacity-20" />
                        <span className={`text-[9px] font-bold ${student.gender === 'L' ? 'text-blue-500/60' : 'text-pink-500/60'}`}>
                            {student.gender === 'L' ? 'L' : 'P'}
                        </span>
                    </div>
                </div>

                {/* Expanded State indicator (Chevron) */}
                {!hasSelection && (
                    <div className="shrink-0 pl-1 text-[var(--color-text-muted)] opacity-40">
                        <CaretDown
                            className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[var(--color-primary)] opacity-100' : ''}`}
                        />
                    </div>
                )}
            </div>

            {/* Accordion Action Area */}
            {isExpanded && !hasSelection && (
                <div
                    onClick={handleActionAreaClick}
                    onMouseDown={stopTouch}
                    onMouseUp={stopTouch}
                    onTouchStart={stopTouch}
                    onTouchEnd={stopTouch}
                    className="px-4 py-2 bg-[var(--color-surface-alt)]/60 border-t border-[var(--color-border)]/30 flex items-center justify-between gap-1.5 animate-in slide-in-from-top-2 duration-200 relative z-10"
                >
                    {/* Profil */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onViewProfile(student) }}
                        className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl text-[var(--color-text-muted)] hover:text-emerald-500 hover:bg-[var(--color-surface)] active:scale-95 transition-all animate-in fade-in duration-300"
                    >
                        <IdentificationCard className="w-3 h-3" />
                        <span className="text-[8px] font-black uppercase tracking-wider leading-none">Profil</span>
                    </button>

                    {/* Pen */}
                    {onEdit && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(student) }}
                            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl text-[var(--color-text-muted)] hover:text-indigo-500 hover:bg-[var(--color-surface)] active:scale-95 transition-all animate-in fade-in duration-300"
                        >
                            <Pencil className="w-3 h-3" />
                            <span className="text-[8px] font-black uppercase tracking-wider leading-none">Pen</span>
                        </button>
                    )}

                    {/* WhatsApp */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            if (!student.phone) return
                            if (openWAForStudent && buildWAMessage) {
                                openWAForStudent(student, buildWAMessage(student, 'general'))
                            } else {
                                const phone = student.phone.replace(/[^0-9]/g, '').replace(/^0/, '62')
                                const text = encodeURIComponent(`Assalamualaikum Wr. Wb.\n\nBapak/Ibu Wali dari Ananda *${student.name}*.\n\n`)
                                window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
                            }
                        }}
                        disabled={!student.phone}
                        className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl active:scale-95 transition-all animate-in fade-in duration-300
                            ${student.phone
                                ? 'text-emerald-600 hover:text-emerald-500 hover:bg-[var(--color-surface)]'
                                : 'text-[var(--color-text-muted)] opacity-35 cursor-not-allowed'}`}
                    >
                        <ChatCircle className="w-3 h-3" />
                        <span className="text-[8px] font-black uppercase tracking-wider leading-none">WA</span>
                    </button>

                    {/* MapPin */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onTogglePin(student) }}
                        className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl transition-all active:scale-95 animate-in fade-in duration-300
                            ${student.is_pinned ? 'text-amber-500 bg-[var(--color-surface)] shadow-sm border border-[var(--color-border)]/50' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] border border-transparent'}`}
                    >
                        <MapPin className={`w-3 h-3 ${student.is_pinned ? 'rotate-0' : 'rotate-45'}`} />
                        <span className="text-[8px] font-black uppercase tracking-wider leading-none">
                            {student.is_pinned ? 'Unpin' : 'MapPin'}
                        </span>
                    </button>

                    {/* Arsip */}
                    {onConfirmDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onConfirmDelete(student) }}
                            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl text-red-400/50 hover:text-red-500 hover:bg-red-500/10 active:scale-95 transition-all animate-in fade-in duration-300"
                        >
                            <Archive className="w-3 h-3" />
                            <span className="text-[8px] font-black uppercase tracking-wider leading-none">Arsip</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    )
})

StudentMobileListRow.displayName = 'StudentMobileListRow'

export default StudentRow