import React, { memo } from 'react'
import { createPortal } from 'react-dom'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { Pagination, EmptyState } from '@shared/components'
import { TeacherRow, TeacherMobileCard } from '@features/teachers/components/TeacherRow'

const TeachersTable = memo(function TeachersTable({
    teachers, totalRows, selectedIds, toggleSelect, visibleCols,
    allSelected, someSelected, toggleSelectAll,
    canEdit, handleEdit, handleTogglePin, handleQuickStatus,
    setTeacherToAction, setIsArchiveModalOpen,
    quickStatusId, setQuickStatusId, quickStatusRef,
    isPrivacyMode, disp, openProfile,
    loading, resetAllFilters,
    page, pageSize, setPage, setPageSize,
    jumpPage, setJumpPage,
    isColMenuOpen, setIsColMenuOpen, menuPos, setMenuPos,
    setVisibleCols,
}) {

    if (loading) {
        return (
            <div className="glass rounded-[1.5rem] border border-[var(--color-border)] overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-[var(--color-surface-alt)]">
                        <tr className="text-left text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                            <th className="px-6 py-4 w-10"></th><th className="px-6 py-4">Guru</th><th className="px-6 py-4">Mapel</th><th className="px-6 py-4">Kontak</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>{Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i} className="border-t border-[var(--color-border)]">
                            <td className="px-6 py-4"><div className="w-4 h-4 rounded bg-[var(--color-border)] animate-pulse" /></td>
                            <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-[var(--color-border)] animate-pulse shrink-0" /><div className="space-y-2"><div className="h-3 w-32 rounded bg-[var(--color-border)] animate-pulse" /><div className="h-2 w-20 rounded bg-[var(--color-border)] animate-pulse opacity-60" /></div></div></td>
                            <td className="px-6 py-4"><div className="h-5 w-24 rounded-lg bg-[var(--color-border)] animate-pulse" /></td>
                            <td className="px-6 py-4"><div className="h-3 w-28 rounded bg-[var(--color-border)] animate-pulse" /></td>
                            <td className="px-6 py-4"><div className="h-5 w-16 rounded-lg bg-[var(--color-border)] animate-pulse" /></td>
                            <td className="px-6 py-4"><div className="h-7 w-28 rounded-lg bg-[var(--color-border)] animate-pulse ml-auto" /></td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        )
    }

    return (
        <div className="glass rounded-[1.5rem] border border-[var(--color-border)] overflow-hidden">
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-[var(--color-surface-alt)] sticky top-0 z-10">
                        <tr className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                            <th className="px-6 py-4 text-center w-12">
                                <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected }} onChange={toggleSelectAll} className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] accent-[var(--color-primary)] cursor-pointer" />
                            </th>
                            <th className="px-6 py-4 text-left">Guru</th>
                            {visibleCols.nbm && <th className="px-6 py-4 text-left">NBM</th>}
                            {visibleCols.subject && <th className="px-6 py-4 text-left">Mata Pelajaran</th>}
                            {visibleCols.gender && <th className="px-6 py-4 text-center">Gender</th>}
                            {visibleCols.contact && <th className="px-6 py-4 text-left">Kontak</th>}
                            {visibleCols.status && <th className="px-6 py-4 text-left">Status</th>}
                            {visibleCols.join && <th className="px-6 py-4 text-left">Bergabung</th>}
                            <th className="px-6 py-4 text-center pr-6 w-32 relative">
                                <div className="flex items-center justify-center">
                                    <span>Aksi</span>
                                </div>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <button onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect()
                                        const menuHeight = 280
                                        const spaceBelow = window.innerHeight - rect.bottom
                                        const showUp = spaceBelow < menuHeight && rect.top > menuHeight
                                        setMenuPos({
                                            top: showUp ? (rect.top + window.scrollY - menuHeight - 8) : (rect.bottom + window.scrollY + 8),
                                            right: window.innerWidth - rect.right - window.scrollX,
                                            showUp
                                        })
                                        setIsColMenuOpen(p => !p)
                                    }} title="Atur tampilan kolom"
                                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${isColMenuOpen ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'}`}>
                                        <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><rect x="0" y="0" width="5" height="5" rx="1" /><rect x="7" y="0" width="5" height="5" rx="1" /><rect x="0" y="7" width="5" height="5" rx="1" /><rect x="7" y="7" width="5" height="5" rx="1" /></svg>
                                    </button>
                                    {isColMenuOpen && createPortal(
                                        <div className={`absolute z-[9999] w-48 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl shadow-black/10 p-2 space-y-0.5 animate-in fade-in zoom-in-95 ${menuPos.showUp ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2'}`}
                                            style={{ top: menuPos.top, right: menuPos.right }}>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] px-3 py-2">Atur Kolom</p>
                                            {[{ key: 'nbm', label: 'NBM' }, { key: 'subject', label: 'Mata Pelajaran' }, { key: 'gender', label: 'Jenis Kelamin' }, { key: 'contact', label: 'Kontak / HP' }, { key: 'status', label: 'Status Aktif' }, { key: 'join', label: 'Tgl Bergabung' }].map(({ key, label }) => (
                                                <button key={key} onClick={() => setVisibleCols(p => ({ ...p, [key]: !p[key] }))} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-alt)] transition-all group text-left">
                                                    <span className="text-[11px] font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{label}</span>
                                                    <div className={`w-8 h-4.5 rounded-full transition-all flex items-center px-0.5 ${visibleCols[key] ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}>
                                                        <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all ${visibleCols[key] ? 'translate-x-[14px]' : 'translate-x-0'}`} />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>,
                                        document.body
                                    )}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {teachers.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-6 py-28 text-center align-middle">
                                    <EmptyState icon={MagnifyingGlass} title="Pencarian Tidak Ditemukan" description="Tidak ada guru atau karyawan yang cocok dengan filter Anda." variant="glass" color="slate" action={<button onClick={resetAllFilters} className="h-9 px-5 rounded-xl bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-widest">Reset Semua Filter</button>} />
                                </td>
                            </tr>
                        ) : teachers.map(teacher => (
                            <TeacherRow
                                key={teacher.id}
                                teacher={teacher}
                                selectedIds={selectedIds}
                                toggleSelect={toggleSelect}
                                visibleCols={visibleCols}
                                isPrivacyMode={isPrivacyMode}
                                disp={disp}
                                openProfile={openProfile}
                                handleEdit={canEdit ? handleEdit : null}
                                handleTogglePin={handleTogglePin}
                                handleQuickStatus={handleQuickStatus}
                                setTeacherToAction={setTeacherToAction}
                                setIsArchiveModalOpen={canEdit ? setIsArchiveModalOpen : null}
                                quickStatusId={quickStatusId}
                                setQuickStatusId={setQuickStatusId}
                                quickStatusRef={quickStatusRef}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-[var(--color-border)]">
                {teachers.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-700">
                        <EmptyState icon={MagnifyingGlass} title="Pencarian Tidak Ditemukan" description="Tidak ada guru atau karyawan yang cocok dengan filter Anda." variant="glass" color="slate" action={<button onClick={resetAllFilters} className="h-9 px-5 rounded-xl bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-widest">Reset Semua Filter</button>} />
                    </div>
                ) : teachers.map(teacher => (
                    <TeacherMobileCard
                        key={teacher.id}
                        teacher={teacher}
                        selectedIds={selectedIds}
                        toggleSelect={toggleSelect}
                        isPrivacyMode={isPrivacyMode}
                        disp={disp}
                        openProfile={openProfile}
                        handleEdit={canEdit ? handleEdit : null}
                        handleTogglePin={handleTogglePin}
                        setTeacherToAction={setTeacherToAction}
                        setIsArchiveModalOpen={canEdit ? setIsArchiveModalOpen : null}
                    />
                ))}
            </div>

            <Pagination
                totalRows={totalRows}
                page={page}
                pageSize={pageSize}
                setPage={setPage}
                setPageSize={setPageSize}
                label="guru"
                jumpPage={jumpPage}
                setJumpPage={setJumpPage}
            />
        </div>
    )
})

export default TeachersTable
