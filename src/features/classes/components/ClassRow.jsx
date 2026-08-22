import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Bed, Buildings, Calendar, CaretRight, Clock, DotsThree, MagnifyingGlass, EyeSlash, GenderMale, Pencil, PushPin, Trash, Users, User, GenderFemale, Building, Copy, Lock, ClockCounterClockwise, Prohibit, CheckCircle } from '@phosphor-icons/react'
import Checkbox from '@shared/components/Checkbox'
import { PrivacyMask } from '@shared/components'

function renderColCell(key, { cls, visibleCols, isPrivacyMode, isPinned, isNoTeacher, isCrowded, maskInfo, maskValue }) {
    if (!visibleCols[key]) return null
    if (key === 'level') {
        return (
            <td key={key} className="px-6 py-4 text-center">
                <span className="px-2 py-0.5 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[9px] font-black uppercase tracking-widest border border-[var(--color-primary)]/20">
                    Lvl {cls.grade_level || '\u2014'}
                </span>
            </td>
        )
    }
    if (key === 'program') {
        return (
            <td key={key} className="px-6 py-4 text-center">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase border tracking-widest ${
                    cls.name?.toLowerCase().includes('boarding')
                        ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                }`}>
                    {cls.name?.toLowerCase().includes('boarding') ? (
                        <><Bed className="w-2.5 h-2.5" /> Boarding</>
                    ) : (
                        <><Buildings className="w-2.5 h-2.5" /> Reguler</>
                    )}
                </span>
            </td>
        )
    }
    if (key === 'gender') {
        return (
            <td key={key} className="px-6 py-4 text-center">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase border tracking-widest ${
                    cls.name?.toLowerCase().includes('putra')
                        ? 'bg-sky-500/10 text-sky-600 border-sky-500/20'
                        : cls.name?.toLowerCase().includes('putri')
                        ? 'bg-pink-500/10 text-pink-600 border-pink-500/20'
                        : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] border-[var(--color-border)]'
                }`}>
                    {cls.name?.toLowerCase().includes('putra') ? (
                        <><GenderMale className="w-2.5 h-2.5" /> Putra</>
                    ) : cls.name?.toLowerCase().includes('putri') ? (
                        <><GenderFemale className="w-2.5 h-2.5" /> Putri</>
                    ) : '\u2014'}
                </span>
            </td>
        )
    }
    if (key === 'teacher') {
        return (
            <td key={key} className="px-6 py-4">
                <div className="flex flex-col">
                    <span className="font-bold text-xs text-[var(--color-text)] truncate max-w-[150px]">
                        <PrivacyMask active={isPrivacyMode}>
                            {cls.teacherName || '\u2014'}
                        </PrivacyMask>
                    </span>
                    <span className="text-[8px] font-black text-[var(--color-text-muted)] uppercase tracking-widest opacity-50">Wali Kelas</span>
                </div>
            </td>
        )
    }
    if (key === 'students') {
        return (
            <td key={key} className="px-6 py-4 text-center">
                <div className="inline-flex items-center gap-2 bg-[var(--color-surface-alt)]/50 px-2.5 py-1 rounded-md text-[10px] font-black text-[var(--color-text)] border border-[var(--color-border)]">
                    <Users className="text-[var(--color-primary)] w-3 h-3" />
                    <PrivacyMask active={isPrivacyMode}>
                        {cls.students || 0}
                    </PrivacyMask>
                </div>
                {isCrowded && (
                    <div className="mt-1 text-[8px] font-black uppercase tracking-widest text-rose-600 opacity-80">
                        Padat &gt; 35
                    </div>
                )}
            </td>
        )
    }
    if (key === 'year') {
        return (
            <td key={key} className="px-6 py-4 text-center">
                <span className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest opacity-70">
                    <PrivacyMask active={isPrivacyMode}>
                        {cls.periodName || '\u2014'}
                    </PrivacyMask>
                </span>
            </td>
        )
    }
    return null
}

function formatDate(dateStr) {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const ClassRow = React.memo(({
    cls,
    selectedIds,
    toggleSelect,
    visibleCols,
    columnOrder,
    handleEdit,
    handleView,
    handleDuplicate,
    handleArchive,
    onQuickToggleActive,
    onHistory,
    setItemToDelete,
    setIsDeleteModalOpen,
    isPrivacyMode,
    maskValue,
    pinnedIds,
    togglePin,
}) => {
    const isSelected = selectedIds.includes(cls.id)
    const isPinned = pinnedIds?.includes(cls.id)
    const isNoTeacher = !cls.homeroom_teacher_id || cls.teacherName === '\u2014'
    const isCrowded = (cls.students || 0) > 35

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

    const maskInfo = (str, visibleLen = 3) => {
        if (!str) return '---'
        if (str.length <= visibleLen) return str[0] + '*'.repeat(str.length - 1)
        return str.substring(0, visibleLen) + '***'
    }

    const menuItems = [
        ...(togglePin ? [{ icon: PushPin, label: isPinned ? 'Lepas Pin' : 'Pin ke atas', onClick: () => { togglePin(cls.id); setMenuOpen(false) }, danger: false, weight: isPinned ? 'fill' : 'regular' }] : []),
        ...(handleDuplicate ? [{ icon: Copy, label: 'Duplikat', onClick: () => { handleDuplicate(cls); setMenuOpen(false) } }] : []),
        ...(onHistory ? [{ icon: ClockCounterClockwise, label: 'Riwayat', onClick: () => { onHistory(cls); setMenuOpen(false) } }] : []),
        ...(onQuickToggleActive ? [{ icon: cls.is_active ? Prohibit : CheckCircle, label: cls.is_active ? 'Nonaktifkan' : 'Aktifkan', onClick: () => { onQuickToggleActive(cls); setMenuOpen(false) }, divider: true }] : []),
        ...(handleArchive ? [{ icon: Lock, label: 'Arsipkan', onClick: () => { handleArchive(cls); setMenuOpen(false) } }] : []),
        ...(setItemToDelete && setIsDeleteModalOpen ? [{ divider: true }, { icon: Trash, label: 'Hapus', onClick: () => { setItemToDelete(cls); setIsDeleteModalOpen(true); setMenuOpen(false) }, danger: true }] : []),
    ]

    const orderedCols = (columnOrder || ['level', 'program', 'gender', 'teacher', 'students', 'year'])
    const colCellArgs = { cls, visibleCols, isPrivacyMode, isPinned, isNoTeacher, isCrowded, maskInfo, maskValue }

    return (
        <tr className={`border-t border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]/40 transition-colors group/row ${isPinned ? 'bg-amber-500/[0.03] border-l-2 border-l-amber-500/40' : ''} ${isSelected ? 'bg-[var(--color-primary)]/[0.04]' : ''}`}>
            <td className="px-6 py-4 text-center">
                <Checkbox
                    checked={isSelected}
                    onChange={() => toggleSelect(cls.id)}
                    onClick={(e) => e.stopPropagation()}
                />
            </td>

            {/* Identity */}
            <td
                className={`px-6 py-4 ${handleEdit ? 'cursor-pointer' : ''}`}
                onClick={handleEdit ? () => handleEdit(cls) : undefined}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-primary)] text-sm font-black shadow-inner shrink-0 border border-[var(--color-primary)]/20 relative">
                        {cls.grade_level}
                        {isPinned && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center shadow-sm">
                                <PushPin className="w-2 h-2 text-white" weight="fill" />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="font-extrabold text-sm text-[var(--color-text)] truncate">
                                <PrivacyMask active={isPrivacyMode}>{cls.name}</PrivacyMask>
                            </span>
                            {isNoTeacher && (
                                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-500 text-[8px] font-black uppercase tracking-widest border border-amber-500/20">
                                    Tanpa Wali
                                </span>
                            )}
                            {isCrowded && (
                                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 text-[8px] font-black uppercase tracking-widest border border-rose-500/20">
                                    Padat
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </td>

            {/* Dynamic columns based on columnOrder */}
            {orderedCols.map(key => renderColCell(key, colCellArgs))}

            {/* Actions */}
            <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-1 transition-opacity">
                    {handleView && (
                        <button
                            onClick={() => handleView(cls)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all text-sm"
                            title="Lihat Detail"
                            aria-label={isPrivacyMode ? 'Lihat detail kelas' : `Lihat detail kelas ${cls.name}`}
                        >
                            <MagnifyingGlass />
                        </button>
                    )}
                    {handleEdit && (
                        <button
                            onClick={() => handleEdit(cls)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all text-sm"
                            title="Edit"
                            aria-label={isPrivacyMode ? 'Edit kelas' : `Edit kelas ${cls.name}`}
                        >
                            <Pencil />
                        </button>
                    )}
                    <div className="relative">
                        <button
                            ref={btnRef}
                            onClick={toggleMenu}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all text-sm ${menuOpen ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]'}`}
                            title="Lainnya"
                            aria-label={isPrivacyMode ? 'Menu lainnya' : `Menu lainnya untuk kelas ${cls.name}`}
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
                                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-colors text-left ${
                                                item.danger
                                                    ? 'text-red-500 hover:bg-red-500/10'
                                                    : item.disabled
                                                    ? 'text-[var(--color-text-muted)] opacity-40 cursor-not-allowed'
                                                    : 'text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]'
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
            </td>
        </tr>
    )
})

export const ClassMobileCard = React.memo(({
    cls,
    selectedIds,
    toggleSelect,
    handleEdit,
    handleView,
    handleDuplicate,
    handleArchive,
    onQuickToggleActive,
    onHistory,
    setItemToDelete,
    setIsDeleteModalOpen,
    isPrivacyMode,
    maskValue,
    pinnedIds,
    togglePin,
}) => {
    const isSelected = selectedIds.includes(cls.id)
    const isNoTeacher = !cls.homeroom_teacher_id || cls.teacherName === '\u2014'
    const isCrowded = (cls.students || 0) > 35
    const isPinned = pinnedIds?.includes(cls.id)

    const isBoarding = cls.name?.toLowerCase().includes('boarding')
    const isPutra = cls.name?.toLowerCase().includes('putra')
    const isPutri = cls.name?.toLowerCase().includes('putri')

    const [menuOpen, setMenuOpen] = useState(false)
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
    const menuRef = useRef(null)

    const closeMenu = useCallback(() => setMenuOpen(false), [])

    const toggleMenu = useCallback((e) => {
        e.stopPropagation()
        if (menuOpen) {
            closeMenu()
        } else {
            const rect = e.currentTarget.getBoundingClientRect()
            const menuHeight = 200
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
        }
    }, [menuOpen, closeMenu])

    useEffect(() => {
        if (!menuOpen) return
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) closeMenu()
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [menuOpen, closeMenu])

    const menuItems = [
        togglePin && { icon: PushPin, weight: isPinned ? 'fill' : 'regular', label: isPinned ? 'Lepas Pin' : 'Pin ke Atas', onClick: () => { togglePin(cls.id); closeMenu() } },
        handleDuplicate && { icon: Copy, label: 'Duplikasi', onClick: () => { handleDuplicate(cls); closeMenu() } },
        onHistory && { icon: ClockCounterClockwise, label: 'Riwayat', onClick: () => { onHistory(cls); closeMenu() } },
        onQuickToggleActive && { icon: cls.is_active ? Prohibit : CheckCircle, label: cls.is_active ? 'Nonaktifkan' : 'Aktifkan', onClick: () => { onQuickToggleActive(cls); closeMenu() } },
        handleArchive && !cls.is_locked && { icon: Lock, label: 'Kunci', onClick: () => { handleArchive(cls); closeMenu() } },
        handleArchive && cls.is_locked && { icon: Lock, label: 'Buka Kunci', onClick: () => { handleArchive(cls); closeMenu() } },
        setItemToDelete && setIsDeleteModalOpen && { icon: Trash, label: 'Hapus', danger: true, onClick: () => { setItemToDelete(cls); setIsDeleteModalOpen(true); closeMenu() } },
    ].filter(Boolean)

    return (
        <div className={`p-3 transition-all duration-300 ${isSelected ? 'bg-[var(--color-primary)]/[0.03]' : 'bg-[var(--color-surface)]'}`}>
            {/* Row 1: Checkbox + Avatar + Name + Menu */}
            <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div className="mt-0.5 shrink-0">
                    <Checkbox
                        checked={isSelected}
                        onChange={() => toggleSelect(cls.id)}
                        onClick={(e) => e.stopPropagation()}
                        small
                    />
                </div>

                {/* Avatar Level */}
                <div className="w-[38px] h-[38px] rounded-xl bg-gradient-to-br from-[var(--color-primary)]/15 to-[var(--color-accent)]/15 flex items-center justify-center text-[var(--color-primary)] text-sm font-black shrink-0 border border-[var(--color-primary)]/10">
                    {cls.grade_level}
                </div>

                {/* Name Column */}
                <div className="flex-1 min-w-0">
                    {/* Name */}
                    <h3 className="font-medium text-[15px] text-[var(--color-text)] truncate">
                        <PrivacyMask active={isPrivacyMode}>{cls.name}</PrivacyMask>
                    </h3>

                    {/* Badges Row */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[9px] font-bold uppercase">
                            Lvl {cls.grade_level}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${isBoarding ? 'bg-blue-500/10 text-blue-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                            {isBoarding ? 'Boarding' : 'Reguler'}
                        </span>
                        {isPutra && (
                            <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 text-[9px] font-bold uppercase">Putra</span>
                        )}
                        {isPutri && (
                            <span className="px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-600 text-[9px] font-bold uppercase">Putri</span>
                        )}
                        {isNoTeacher ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[9px] font-bold uppercase">Tanpa Wali</span>
                        ) : (
                            <span className="px-1.5 py-0.5 rounded bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] text-[9px] font-bold truncate max-w-[120px]">
                                <PrivacyMask active={isPrivacyMode}>{cls.teacherName}</PrivacyMask>
                            </span>
                        )}
                    </div>

                    {/* Info Row */}
                    <div className="flex items-center gap-2 mt-2 text-xs text-[var(--color-text-muted)]">
                        <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            <span className="font-medium">
                                <PrivacyMask active={isPrivacyMode}>{cls.students || 0}</PrivacyMask> siswa
                            </span>
                        </div>
                        <span className="opacity-40">·</span>
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="font-medium truncate">
                                <PrivacyMask active={isPrivacyMode}>{cls.periodName || '—'}</PrivacyMask>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer: created + actions */}
            <div className="mt-3 pt-3 border-t border-[var(--color-border)]/40 flex items-center justify-between gap-2 pl-[47px]">
                <div className="flex items-center gap-1.5 text-[9px] text-[var(--color-text-muted)] min-w-0">
                    {cls.created_at && (
                        <>
                            <Clock className="w-3 h-3 text-[var(--color-text-muted)]/40 shrink-0" />
                            <span className="truncate">Dibuat {formatDate(cls.created_at)}</span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                    <button
                        onClick={() => togglePin?.(cls.id)}
                        title={isPinned ? "Lepas pin" : "Pin ke atas"}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all active:scale-95 ${isPinned ? "text-amber-500 bg-amber-500/10 border-amber-500/20" : "text-[var(--color-text-muted)] hover:text-amber-500 hover:bg-amber-500/10 border-[var(--color-border)]"}`}
                    >
                        <PushPin weight={isPinned ? "fill" : "regular"} className="text-sm" />
                    </button>
                    {handleView && (
                        <button
                            onClick={() => handleView(cls)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 border border-[var(--color-border)] transition-all active:scale-95"
                            title="Lihat Detail"
                        >
                            <MagnifyingGlass className="text-sm" />
                        </button>
                    )}
                    {handleEdit && (
                        <button
                            onClick={() => handleEdit(cls)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:text-blue-500 hover:bg-blue-500/10 border border-[var(--color-border)] transition-all active:scale-95"
                            title="Edit"
                        >
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
                                            disabled={item.disabled}
                                            className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                                                item.danger
                                                    ? 'text-red-500 hover:bg-red-500/10'
                                                    : item.disabled
                                                    ? 'text-[var(--color-text-muted)] opacity-40 cursor-not-allowed'
                                                    : 'text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]'
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

ClassRow.displayName = 'ClassRow'
ClassMobileCard.displayName = 'ClassMobileCard'
