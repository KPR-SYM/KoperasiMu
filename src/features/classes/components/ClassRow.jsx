import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Bed, Buildings, Calendar, CaretRight, DotsThree, Eye, EyeSlash, GenderMale, Pencil, PushPin, Trash, Users, GenderFemale, Building, Copy, Lock, ClockCounterClockwise } from '@phosphor-icons/react'
import Checkbox from '@shared/components/Checkbox'


export const ClassRow = React.memo(({
    cls,
    selectedIds,
    toggleSelect,
    visibleCols,
    handleEdit,
    handleView,
    handleDuplicate,
    handleArchive,
    onHistory,
    setItemToDelete,
    setIsDeleteModalOpen,
    isPrivacyMode,
    pinnedIds,
    togglePin,
}) => {
    const isSelected = selectedIds.includes(cls.id)
    const isPinned = pinnedIds?.includes(cls.id)
    const isNoTeacher = !cls.homeroom_teacher_id || cls.teacherName === 'â€"'
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
        ...(handleArchive ? [{ icon: Lock, label: 'Arsipkan', onClick: () => { handleArchive(cls); setMenuOpen(false) } }] : []),
        ...(setItemToDelete && setIsDeleteModalOpen ? [{ divider: true }, { icon: Trash, label: 'Hapus', onClick: () => { setItemToDelete(cls); setIsDeleteModalOpen(true); setMenuOpen(false) }, danger: true }] : []),
    ]

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
                title={handleEdit ? `Pen ${cls.name}` : undefined}
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
                            <span className="font-extrabold text-sm text-[var(--color-text)] truncate">{cls.name}</span>
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

            {/* Level */}
            {visibleCols.level && (
                <td className="px-6 py-4 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[9px] font-black uppercase tracking-widest border border-[var(--color-primary)]/20">
                        Lvl {cls.grade_level || '—'}
                    </span>
                </td>
            )}

            {/* Program */}
            {visibleCols.program && (
                <td className="px-6 py-4 text-center">
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
            )}

            {/* Gender */}
            {visibleCols.gender && (
                <td className="px-6 py-4 text-center">
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
                        ) : '—'}
                    </span>
                </td>
            )}

            {/* Teacher */}
            {visibleCols.teacher && (
                <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="font-bold text-xs text-[var(--color-text)] truncate max-w-[150px]">
                            {isPrivacyMode ? (
                                <span className="inline-flex items-center gap-2">
                                    <EyeSlash className="w-3 h-3 opacity-50" />
                                    {maskInfo(cls.teacherName, 4)}
                                </span>
                            ) : (cls.teacherName || 'â€”')}
                        </span>
                        <span className="text-[8px] font-black text-[var(--color-text-muted)] uppercase tracking-widest opacity-50">Wali Kelas</span>
                    </div>
                </td>
            )}

            {/* Students Count */}
            {visibleCols.students && (
                <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-2 bg-[var(--color-surface-alt)]/50 px-2.5 py-1 rounded-md text-[10px] font-black text-[var(--color-text)] border border-[var(--color-border)]">
                        <Users className="text-[var(--color-primary)] w-3 h-3" />
                        {cls.students || 0}
                    </div>
                    {isCrowded && (
                        <div className="mt-1 text-[8px] font-black uppercase tracking-widest text-rose-600 opacity-80">
                            Padat &gt; 35
                        </div>
                    )}
                </td>
            )}

            {/* Academic Year */}
            {visibleCols.year && (
                <td className="px-6 py-4 text-center">
                    <span className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest opacity-70">
                        {cls.periodName || 'â€”'}
                    </span>
                </td>
            )}

            {/* Actions */}
            <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-1 transition-opacity">
                    {handleView && (
                        <button
                            onClick={() => handleView(cls)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all text-sm"
                            title="Lihat Detail"
                            aria-label={`Lihat detail kelas ${cls.name}`}
                        >
                            <Eye />
                        </button>
                    )}
                    {handleEdit && (
                        <button
                            onClick={() => handleEdit(cls)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all text-sm"
                            title="Edit"
                            aria-label={`Edit kelas ${cls.name}`}
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
                            aria-label={`Menu lainnya untuk kelas ${cls.name}`}
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
    setItemToDelete,
    setIsDeleteModalOpen
}) => {
    const isSelected = selectedIds.includes(cls.id)
    const isNoTeacher = !cls.homeroom_teacher_id || cls.teacherName === 'â€"'
    const isCrowded = (cls.students || 0) > 35
    return (
        <div className={`p-4 transition-all duration-300 border-l-4 ${isSelected ? 'bg-[var(--color-primary)]/[0.03] border-[var(--color-primary)]' : 'bg-[var(--color-surface)] border-transparent active:bg-[var(--color-surface-alt)]/30'}`}>
            <div className="flex items-start gap-3">
                <div className="mt-1 shrink-0">
                    <Checkbox
                        checked={isSelected}
                        onChange={() => toggleSelect(cls.id)}
                        onClick={(e) => e.stopPropagation()}
                        small
                    />
                </div>

                {/* Identity */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-primary)] text-sm font-black shrink-0 border border-[var(--color-primary)]/20 shadow-inner">
                    {cls.grade_level}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className="font-extrabold text-sm text-[var(--color-text)] truncate">{cls.name}</h3>
                            <div className="flex items-center gap-1.5 mt-1">
                                {isNoTeacher && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-500 text-[8px] font-black uppercase tracking-widest border border-amber-500/10">Tanpa Wali</span>
                                )}
                                {isCrowded && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 text-[8px] font-black uppercase tracking-widest border border-rose-500/10">Padat</span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                            {handleView && <button onClick={() => handleView(cls)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] bg-[var(--color-surface-alt)]/50 text-xs transition-all" title="Lihat Detail"><Eye /></button>}
                            {handleEdit && <button onClick={() => handleEdit(cls)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] bg-[var(--color-surface-alt)]/50 text-xs transition-all" title="Edit"><Pencil /></button>}
                            {setItemToDelete && setIsDeleteModalOpen && <button onClick={() => { setItemToDelete(cls); setIsDeleteModalOpen(true) }} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-500 bg-[var(--color-surface-alt)]/50 text-xs transition-all" title="Hapus"><Trash /></button>}
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="space-y-0.5">
                            <p className="text-[8px] font-black text-[var(--color-text-muted)] uppercase tracking-widest opacity-60">Wali Kelas</p>
                            <p className="font-bold text-[11px] text-[var(--color-text)] truncate">{cls.teacherName || 'â€”'}</p>
                        </div>
                        <div className="space-y-0.5 text-right">
                            <p className="text-[8px] font-black text-[var(--color-text-muted)] uppercase tracking-widest opacity-60">Siswa</p>
                            <p className="font-bold text-[11px] text-[var(--color-text)]">
                                <Users className="text-[var(--color-primary)] mr-1.5 w-3 h-3" />
                                {cls.students || 0}
                            </p>
                            {isCrowded && (
                                <p className="text-[8px] font-black uppercase tracking-widest text-rose-600 opacity-80">Padat &gt; 35</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-dashed border-[var(--color-border)] flex items-center justify-between text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">
                        <span>Lvl {cls.grade_level}</span>
                        <span>{cls.periodName || 'â€”'}</span>
                    </div>
                </div>
            </div>
        </div>
    )
})

ClassRow.displayName = 'ClassRow'
ClassMobileCard.displayName = 'ClassMobileCard'