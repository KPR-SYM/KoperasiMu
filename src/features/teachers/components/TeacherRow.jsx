import React, { memo, useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Archive, ChatCircle, Clock, ClockCounterClockwise, DotsThree, MagnifyingGlass, GenderMale, MapPin, Pencil, PushPin, Trash, User, Prohibit, CheckCircle } from '@phosphor-icons/react'
import { Badge, PrivacyMask } from '@shared/components'
import Checkbox from '@shared/components/Checkbox'
import { STATUS_CONFIG, TYPE_LABELS } from '@features/teachers/constants/teacherConstants'

function formatDate(dateStr) {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Avatar — handles error state, no gradient bleed ──────────────────────────
function Avatar({ url, name, size = 'w-10 h-10', textSize = 'text-xs', rounded = 'rounded-full' }) {
    const [imgError, setImgError] = useState(false)
    const letter = name?.charAt(0)?.toUpperCase() || '?'
    const showImg = url && !imgError
    return (
        <div className={`${size} ${rounded} overflow-hidden shrink-0 flex items-center justify-center font-black shadow-sm relative cursor-pointer transition-transform hover:scale-110
            ${showImg ? 'bg-[var(--color-surface-alt)]' : 'bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 text-[var(--color-primary)]'}`}>
            {showImg
                ? <img src={url} alt={name} className="w-full h-full object-cover relative z-10" onError={() => setImgError(true)} />
                : <span className={`${textSize} relative z-10`}>{letter}</span>
            }
        </div>
    )
}

// ─── Cell renderer ────────────────────────────────────────────────────────────
function renderColCell(key, { teacher, visibleCols, disp, isPrivacyMode, quickStatusId, setQuickStatusId, quickStatusRef, handleQuickStatus }) {
    if (!visibleCols[key]) return null
    if (key === 'subject') {
        return (
            <td key={key} className="px-6 py-4">
                {teacher.subject
                    ? <span className="px-2.5 py-1 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 text-[10px] font-black uppercase tracking-widest"><PrivacyMask active={isPrivacyMode}>{teacher.subject}</PrivacyMask></span>
                    : <span className="w-3 h-3 text-[var(--color-text-muted)]">—</span>}
            </td>
        )
    }
    if (key === 'gender') {
        return (
            <td key={key} className="px-6 py-4 text-left">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-inner border transition-all ${teacher.gender === 'L' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : teacher.gender === 'P' ? 'bg-pink-500/10 text-pink-500 border-pink-500/20' : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] border-transparent'}`}>
                    {teacher.gender === 'L' ? <GenderMale /> : teacher.gender === 'P' ? <span className="text-sm">♀</span> : <User />}
                </span>
            </td>
        )
    }
    if (key === 'contact') {
        return (
            <td key={key} className="px-6 py-4 space-y-1">
                {teacher.phone && <a href={isPrivacyMode ? '#' : `https://wa.me/${teacher.phone.replace(/^0/, '62')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-bold w-fit"><ChatCircle className="text-sm" /><PrivacyMask active={isPrivacyMode}>{teacher.phone}</PrivacyMask></a>}
                {!teacher.phone && <span className="w-3 h-3 text-[var(--color-text-muted)]">—</span>}
            </td>
        )
    }
    if (key === 'status') {
        return (
            <td key={key} className="px-6 py-4 text-left">
                <div className="relative" ref={quickStatusId === teacher.id ? quickStatusRef : null}>
                    <button onClick={() => setQuickStatusId(quickStatusId === teacher.id ? null : teacher.id)}
                        className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider cursor-pointer hover:opacity-80 transition-all ${STATUS_CONFIG[teacher.status]?.color}`}>
                        {STATUS_CONFIG[teacher.status]?.label}
                    </button>
                    {quickStatusId === teacher.id && (
                        <div className="absolute top-8 left-0 z-30 w-36 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            {Object.entries(STATUS_CONFIG).filter(([k]) => k !== teacher.status).map(([k, v]) => (
                                <button key={k} onClick={() => handleQuickStatus(teacher, k)} className="w-full px-3 py-2 text-left text-[10px] font-black hover:bg-[var(--color-surface-alt)] transition-all flex items-center gap-2">
                                    <span className={v.color}>{v.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </td>
        )
    }
    if (key === 'join') {
        return (
            <td key={key} className="px-6 py-4 w-3 h-3 text-[var(--color-text-muted)]">{teacher.join_date ? new Date(teacher.join_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
        )
    }
    return null
}

// ─── Desktop Row ─────────────────────────────────────────────────────────────
const TeacherRow = memo(({
    teacher,
    selectedIds,
    toggleSelect,
    visibleCols,
    columnOrder,
    disp,
    handleView,
    handleEdit,
    handleTogglePin,
    handleQuickStatus,
    onHistory,
    setTeacherToAction,
    setIsArchiveModalOpen,
    quickStatusId,
    setQuickStatusId,
    quickStatusRef,
    isPrivacyMode }) => {
    const isSelected = selectedIds.includes(teacher.id)

    const [menuOpen, setMenuOpen] = useState(false)
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
    const menuRef = useRef(null)
    const btnRef = useRef(null)

    const toggleMenu = useCallback((e) => {
        e.stopPropagation()
        if (menuOpen) { setMenuOpen(false); return }
        const rect = btnRef.current?.getBoundingClientRect()
        if (rect) {
            setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
        }
        setMenuOpen(true)
    }, [menuOpen])

    useEffect(() => {
        if (!menuOpen) return
        const handleClickOutside = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [menuOpen])

    const menuItems = [
        ...(handleTogglePin ? [{ icon: MapPin, label: teacher.is_pinned ? 'Lepas Pin' : 'Pin ke atas', onClick: () => { handleTogglePin(teacher); setMenuOpen(false) }, weight: teacher.is_pinned ? 'fill' : 'regular' }] : []),
        ...(teacher.phone ? [{ icon: ChatCircle, label: 'Hubungi WhatsApp', onClick: () => { window.open(`https://wa.me/${teacher.phone.replace(/^0/, '62')}`, '_blank'); setMenuOpen(false) } }] : []),
        ...(onHistory ? [{ divider: true }, { icon: ClockCounterClockwise, label: 'Riwayat', onClick: () => { onHistory(teacher); setMenuOpen(false) } }] : []),
        ...(handleQuickStatus ? [{ icon: teacher.is_active ? Prohibit : CheckCircle, label: teacher.is_active ? 'Nonaktifkan' : 'Aktifkan', onClick: () => { handleQuickStatus(teacher, teacher.is_active ? 'inactive' : 'active'); setMenuOpen(false) } }] : []),
        ...(setIsArchiveModalOpen && setTeacherToAction ? [{ divider: true }, { icon: Archive, label: 'Arsipkan', onClick: () => { setTeacherToAction(teacher); setIsArchiveModalOpen(true); setMenuOpen(false) } }] : []),
    ]

    const orderedCols = (columnOrder || ['subject', 'gender', 'contact', 'status', 'join'])
    const colCellArgs = { teacher, visibleCols, disp, isPrivacyMode, quickStatusId, setQuickStatusId, quickStatusRef, handleQuickStatus }

    return (
        <tr className={`border-t border-[var(--color-border)] transition-colors group/row
            ${isSelected ? 'bg-[var(--color-primary)]/5' : 'hover:bg-[var(--color-surface-alt)]/40'}
            ${teacher.is_pinned ? 'bg-amber-500/[0.04] border-l-2 border-l-amber-400' : ''}
        `}>
            <td className="px-6 py-4 text-center">
                <Checkbox
                    checked={isSelected}
                    onChange={() => toggleSelect(teacher.id)}
                    onClick={(e) => e.stopPropagation()}
                />
            </td>
            <td className="px-6 py-4">
                <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                        <Avatar name={teacher.name} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                        <button onClick={() => handleView(teacher)} className="font-extrabold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors text-left leading-snug truncate">
                            <PrivacyMask active={isPrivacyMode}>{teacher.name}</PrivacyMask>
                        </button>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {(Array.isArray(teacher.type) ? teacher.type : teacher.type ? [teacher.type] : []).map(t => (
                                <span key={t} className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest border ${t === 'karyawan' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'}`}>
                                    {TYPE_LABELS[t] || t}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </td>
            {orderedCols.map(key => renderColCell(key, colCellArgs))}
            <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-1">
                    {handleView && (
                        <button onClick={() => handleView(teacher)} title="Lihat Detail" aria-label={`Lihat detail guru ${teacher.name}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all text-sm">
                            <MagnifyingGlass />
                        </button>
                    )}
                    {handleEdit && (
                        <button onClick={() => handleEdit(teacher)} title="Edit" aria-label={`Edit guru ${teacher.name}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all text-sm">
                            <Pencil />
                        </button>
                    )}
                    <div className="relative">
                        <button
                            ref={btnRef}
                            onClick={toggleMenu}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all text-sm ${menuOpen ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]'}`}
                            title="Lainnya"
                            aria-label={`Menu lainnya untuk guru ${teacher.name}`}
                            aria-expanded={menuOpen}
                        >
                            <DotsThree weight="bold" />
                        </button>
                        {menuOpen && createPortal(
                            <div ref={menuRef} style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 9999 }} className="w-48 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl shadow-black/10 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                                {menuItems.map((item, i) => (
                                    item.divider ? (
                                        <div key={i} className="my-1.5 border-t border-[var(--color-border)]" />
                                    ) : (
                                        <button
                                            key={i}
                                            onClick={item.onClick}
                                            disabled={item.disabled}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-colors text-left ${item.danger ? 'text-red-500 hover:bg-red-500/10' : 'text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]'}`}
                                        >
                                            <item.icon weight={item.weight || 'regular'} className="w-4 h-4 shrink-0" />
                                            {item.label}
                                        </button>
                                    )
                                ))}
                            </div>,
                            document.body
                        )}
                    </div>
                </div>
            </td>
        </tr>
    )
})

// ─── Mobile Card ─────────────────────────────────────────────────────────────
const TeacherMobileCard = memo(({
    teacher,
    selectedIds,
    toggleSelect,
    handleView,
    handleEdit,
    handleTogglePin,
    onHistory,
    setTeacherToAction,
    setIsArchiveModalOpen,
    isPrivacyMode }) => {
    const isSelected = selectedIds.includes(teacher.id)
    const types = Array.isArray(teacher.type) ? teacher.type : teacher.type ? [teacher.type] : []

    const [menuOpen, setMenuOpen] = useState(false)
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
    const menuRef = useRef(null)

    const closeMenu = useCallback(() => setMenuOpen(false), [])

    const toggleMenu = useCallback((e) => {
        e.stopPropagation()
        if (menuOpen) { closeMenu(); return }
        const rect = e.currentTarget.getBoundingClientRect()
        const menuHeight = 220
        const spaceBelow = window.innerHeight - rect.bottom
        const showUp = spaceBelow < menuHeight
        setMenuPos({
            ...(showUp
                ? { bottom: window.innerHeight - rect.top + 8 }
                : { top: rect.bottom + 8 }
            ),
            right: window.innerWidth - rect.right - 8,
        })
        setMenuOpen(true)
    }, [menuOpen, closeMenu])

    useEffect(() => {
        if (!menuOpen) return
        const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) closeMenu() }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [menuOpen, closeMenu])

    const menuItems = [
        handleTogglePin && { icon: MapPin, weight: teacher.is_pinned ? 'fill' : 'regular', label: teacher.is_pinned ? 'Lepas Pin' : 'Pin ke Atas', onClick: () => { handleTogglePin(teacher); closeMenu() } },
        teacher.phone && { icon: ChatCircle, label: 'WhatsApp', onClick: () => { window.open(`https://wa.me/${teacher.phone.replace(/^0/, '62')}`, '_blank'); closeMenu() } },
        onHistory && { icon: ClockCounterClockwise, label: 'Riwayat', onClick: () => { onHistory(teacher); closeMenu() } },
        handleEdit && { icon: Pencil, label: 'Edit', onClick: () => { handleEdit(teacher); closeMenu() } },
        setIsArchiveModalOpen && setTeacherToAction && { icon: Archive, label: 'Arsipkan', danger: true, onClick: () => { setTeacherToAction(teacher); setIsArchiveModalOpen(true); closeMenu() } },
    ].filter(Boolean)

    return (
        <div className={`p-3 transition-all duration-300 ${isSelected ? 'bg-[var(--color-primary)]/[0.03]' : 'bg-[var(--color-surface)]'}`}>
            {/* Row 1: Checkbox + Avatar + Name + Menu */}
            <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                    <Checkbox
                        checked={isSelected}
                        onChange={() => toggleSelect(teacher.id)}
                        onClick={(e) => e.stopPropagation()}
                        small
                    />
                </div>
                <div className="relative shrink-0">
                    <Avatar name={teacher.name} size="w-[38px] h-[38px]" textSize="text-sm" rounded="rounded-xl" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[15px] text-[var(--color-text)] truncate">
                        <PrivacyMask active={isPrivacyMode}>{teacher.name}</PrivacyMask>
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {teacher.subject && <span className="px-1.5 py-0.5 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[9px] font-bold uppercase"><PrivacyMask active={isPrivacyMode}>{teacher.subject}</PrivacyMask></span>}
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${STATUS_CONFIG[teacher.status]?.color}`}>{STATUS_CONFIG[teacher.status]?.label}</span>
                        {types.length > 0 && <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${types.includes('karyawan') ? 'bg-blue-500/10 text-blue-600' : 'bg-indigo-500/10 text-indigo-600'}`}>{types.includes('karyawan') ? 'Karyawan' : 'Guru'}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-[var(--color-text-muted)]">
                        {teacher.phone && <div className="flex items-center gap-1"><ChatCircle className="w-3.5 h-3.5" /><span className="font-medium"><PrivacyMask active={isPrivacyMode}>{teacher.phone}</PrivacyMask></span></div>}
                    </div>
                </div>
            </div>
            {/* Footer: created + actions */}
            <div className="mt-3 pt-3 border-t border-[var(--color-border)]/40 flex items-center justify-between gap-2 pl-[47px]">
                <div className="flex items-center gap-1.5 text-[9px] text-[var(--color-text-muted)] min-w-0">
                    {teacher.created_at && (
                        <>
                            <Clock className="w-3 h-3 text-[var(--color-text-muted)]/40 shrink-0" />
                            <span className="truncate">Dibuat {formatDate(teacher.created_at)}</span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                    <button
                        onClick={() => handleTogglePin?.(teacher)}
                        title={teacher.is_pinned ? "Lepas pin" : "Pin ke atas"}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all active:scale-95 ${teacher.is_pinned ? "text-amber-500 bg-amber-500/10 border-amber-500/20" : "text-[var(--color-text-muted)] hover:text-amber-500 hover:bg-amber-500/10 border-[var(--color-border)]"}`}
                    >
                        <PushPin weight={teacher.is_pinned ? "fill" : "regular"} className="text-sm" />
                    </button>
                    {handleView && (
                        <button onClick={() => handleView(teacher)} className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 border border-[var(--color-border)] transition-all active:scale-95" title="Lihat Detail">
                            <MagnifyingGlass className="text-sm" />
                        </button>
                    )}
                    {handleEdit && (
                        <button onClick={() => handleEdit(teacher)} className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:text-blue-500 hover:bg-blue-500/10 border border-[var(--color-border)] transition-all active:scale-95" title="Edit">
                            <Pencil className="text-sm" />
                        </button>
                    )}
                    <div className="relative">
                        <button
                            onClick={(e) => toggleMenu(e)}
                            title="Lainnya"
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] border border-[var(--color-border)] transition-all active:scale-95"
                        >
                            <DotsThree weight="bold" />
                        </button>
                        {menuOpen && createPortal(
                            <div ref={menuRef} style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 9999 }} className="w-48 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
                                {menuItems.map((item, i) => (
                                    item.divider ? (
                                        <div key={i} className="my-1.5 border-t border-[var(--color-border)]" />
                                    ) : (
                                        <button
                                            key={i}
                                            onClick={item.onClick}
                                            className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                                                item.danger ? 'text-red-500 hover:bg-red-500/10' : 'text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]'
                                            }`}
                                        >
                                            <item.icon weight={item.weight || 'regular'} className="w-4 h-4 shrink-0" />
                                            {item.label}
                                        </button>
                                    )
                                ))}
                            </div>,
                            document.body
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
})

export { TeacherRow, TeacherMobileCard }
