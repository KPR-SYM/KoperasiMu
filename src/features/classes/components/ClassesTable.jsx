import React, { memo } from 'react'
import { createPortal } from 'react-dom'
import { Buildings, MagnifyingGlass, Plus } from '@phosphor-icons/react'
import { ClassRow, ClassMobileCard } from '@features/classes/components/ClassRow'
import { EmptyState } from '@shared/components/DataDisplay'
import Checkbox from '@shared/components/Checkbox'
import Pagination from '@shared/components/Pagination'

const COL_LABELS = {
    level: 'Level',
    program: 'Program',
    gender: 'Gender',
    teacher: 'Wali Kelas',
    students: 'Siswa',
    year: 'Akademik',
}

const ClassesTable = memo(function ClassesTable({
    paged, totalFilteredRows, selectedIds, toggleSelect, visibleCols,
    allSelected, someSelected, toggleSelectAll,
    handleEdit, handleView, handleDuplicate, handleArchive, onHistory, setItemToDelete, setIsDeleteModalOpen, isPrivacyMode,
    canEdit, loading, searchQuery, filterLevel, filterProgram,
    filterNoTeacher, filterCrowded, resetAllFilters, handleAdd,
    page, pageSize, setPage, setPageSize, jumpPage, setJumpPage,
    pinnedIds, togglePin,
    // Column menu props
    colMenuRef, isColMenuOpen, setIsColMenuOpen, setColMenuPos, colMenuPortalRef, colMenuPos, setVisibleCols,
}) {
    if (loading) {
        return (
            <div className="p-6 space-y-4">
                <div className="hidden md:block">
                    <table className="w-full text-sm">
                        <thead className="bg-[var(--color-surface-alt)] sticky top-0 z-10">
                            <tr className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                                <th className="px-6 py-4 w-12 text-center"><div className="w-4 h-4 bg-[var(--color-border)] rounded-lg mx-auto animate-pulse" /></th>
                                <th className="px-6 py-4"><div className="w-20 h-3 bg-[var(--color-border)] rounded animate-pulse" /></th>
                                <th className="px-6 py-4"><div className="w-14 h-3 bg-[var(--color-border)] rounded animate-pulse" /></th>
                                <th className="px-6 py-4"><div className="w-18 h-3 bg-[var(--color-border)] rounded animate-pulse" /></th>
                                <th className="px-6 py-4"><div className="w-12 h-3 bg-[var(--color-border)] rounded animate-pulse" /></th>
                                <th className="px-6 py-4"><div className="w-16 h-3 bg-[var(--color-border)] rounded animate-pulse" /></th>
                                <th className="px-6 py-4"><div className="w-14 h-3 bg-[var(--color-border)] rounded animate-pulse" /></th>
                                <th className="px-6 py-4 text-center w-32"><div className="w-10 h-3 bg-[var(--color-border)] rounded animate-pulse mx-auto" /></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]/50">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse border-b border-[var(--color-border)]/50">
                                    <td className="px-6 py-4 text-center"><div className="w-4 h-4 bg-[var(--color-surface-alt)] rounded-lg mx-auto" /></td>
                                    <td className="px-6 py-4"><div className="w-28 h-3.5 bg-[var(--color-surface-alt)] rounded-md" /></td>
                                    <td className="px-6 py-4"><div className="w-14 h-4 bg-[var(--color-surface-alt)] rounded-full" /></td>
                                    <td className="px-6 py-4"><div className="w-20 h-3.5 bg-[var(--color-surface-alt)] rounded-md" /></td>
                                    <td className="px-6 py-4"><div className="w-18 h-4 bg-[var(--color-surface-alt)] rounded-full" /></td>
                                    <td className="px-6 py-4"><div className="w-20 h-3.5 bg-[var(--color-surface-alt)] rounded-md" /></td>
                                    <td className="px-6 py-4"><div className="w-14 h-4 bg-[var(--color-surface-alt)] rounded-full" /></td>
                                    <td className="px-6 py-4 text-center w-32"><div className="flex gap-1 justify-center"><div className="w-6 h-6 bg-[var(--color-surface-alt)] rounded-lg" /><div className="w-6 h-6 bg-[var(--color-surface-alt)] rounded-lg" /></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    const hasActiveFilters = !!(searchQuery || filterLevel || filterProgram || filterNoTeacher || filterCrowded)
    const isEmpty = totalFilteredRows === 0

    const emptyAction = hasActiveFilters ? (
        <button onClick={resetAllFilters} className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] transition">
            Reset Semua Filter
        </button>
    ) : canEdit ? (
        <button onClick={handleAdd} className="h-9 px-5 rounded-xl bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--color-primary)]/20 hover:brightness-110 transition-all flex items-center gap-2">
            <Plus />
            Tambah Kelas
        </button>
    ) : null

    const handleColMenuToggle = (e) => {
        if (!setIsColMenuOpen || !setColMenuPos) return
        const rect = e.currentTarget.getBoundingClientRect()
        const menuHeight = 260
        const spaceBelow = window.innerHeight - rect.bottom
        const showUp = spaceBelow < menuHeight && rect.top > menuHeight
        setColMenuPos({
            top: showUp ? rect.top + window.scrollY - menuHeight - 8 : rect.bottom + window.scrollY + 8,
            right: window.innerWidth - rect.right - window.scrollX,
            showUp,
        })
        setIsColMenuOpen(p => !p)
    }

    const toggleCol = (key) => {
        if (!setVisibleCols) return
        setVisibleCols(prev => ({ ...prev, [key]: !prev[key] }))
    }

    return (
        <>
            <div className="overflow-x-auto whitespace-nowrap hidden md:block">
                <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-[var(--color-surface-alt)] sticky top-0 z-10 border-b border-[var(--color-border)]">
                        <tr className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                            <th className="px-6 py-4 w-12 text-center">
                                <Checkbox checked={allSelected} indeterminate={someSelected && !allSelected} onChange={toggleSelectAll} />
                            </th>
                            <th className="px-6 py-4">Identitas Kelas</th>
                            {visibleCols.level && <th className="px-6 py-4 text-center">Level</th>}
                            {visibleCols.program && <th className="px-6 py-4 text-center">Program</th>}
                            {visibleCols.gender && <th className="px-6 py-4 text-center">Gender</th>}
                            {visibleCols.teacher && <th className="px-6 py-4">Wali Kelas</th>}
                            {visibleCols.students && <th className="px-6 py-4 text-center">Siswa</th>}
                            {visibleCols.year && <th className="px-6 py-4 text-center">Akademik</th>}
                            {/* Aksi header with column menu toggle */}
                            <th className="px-6 py-4 text-center pr-6 w-32 relative">
                                <span>Aksi</span>
                                {setIsColMenuOpen && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <button
                                            ref={colMenuRef}
                                            onClick={handleColMenuToggle}
                                            title="Atur tampilan kolom"
                                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${isColMenuOpen
                                                ? 'bg-[var(--color-primary)] text-white'
                                                : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                                                }`}
                                        >
                                            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
                                                <rect x="0" y="0" width="5" height="5" rx="1" />
                                                <rect x="7" y="0" width="5" height="5" rx="1" />
                                                <rect x="0" y="7" width="5" height="5" rx="1" />
                                                <rect x="7" y="7" width="5" height="5" rx="1" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {isEmpty ? (
                            <tr>
                                <td colSpan={10} className="p-0">
                                    <EmptyState
                                        icon={hasActiveFilters ? MagnifyingGlass : Buildings}
                                        title={hasActiveFilters ? 'Tidak Ada Hasil' : 'Belum Ada Data Kelas'}
                                        description={hasActiveFilters
                                            ? 'Tidak ditemukan kelas yang cocok dengan filter yang dipilih. Coba ubah kata kunci atau filter lainnya.'
                                            : 'Mulai dengan menambah kelas baru atau import data dari file CSV/Excel.'}
                                        action={emptyAction}
                                        variant="plain"
                                    />
                                </td>
                            </tr>
                        ) : paged.map(cls => (
                            <ClassRow key={cls.id} cls={cls} selectedIds={selectedIds} toggleSelect={toggleSelect} visibleCols={visibleCols} handleEdit={canEdit ? handleEdit : null} handleView={handleView} handleDuplicate={handleDuplicate} handleArchive={handleArchive} onHistory={onHistory} setItemToDelete={canEdit ? setItemToDelete : null} setIsDeleteModalOpen={canEdit ? setIsDeleteModalOpen : null} isPrivacyMode={isPrivacyMode} pinnedIds={pinnedIds} togglePin={togglePin} />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Column Toggle Dropdown Portal */}
            {isColMenuOpen && setVisibleCols && colMenuPos && createPortal(
                <div
                    ref={colMenuPortalRef || undefined}
                    style={{
                        position: 'absolute',
                        top: colMenuPos.top,
                        right: colMenuPos.right,
                        zIndex: 9999,
                    }}
                    className="w-52 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden"
                >
                    <div className="px-3.5 py-2.5 border-b border-[var(--color-border)]/60">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Atur Kolom</p>
                    </div>
                    <div className="py-1.5">
                        {Object.entries(COL_LABELS).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => toggleCol(key)}
                                className="w-full flex items-center justify-between px-3.5 py-2 text-[11px] font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-colors"
                            >
                                <span>{label}</span>
                                <span className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded-md flex items-center justify-center transition-all ${visibleCols[key]
                                    ? 'bg-[var(--color-primary)] text-white'
                                    : 'bg-[var(--color-surface-alt)] border border-[var(--color-border)]'
                                    }`}>
                                    {visibleCols[key] && (
                                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="1.5,5 4,7.5 8.5,2" />
                                        </svg>
                                    )}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>,
                document.body
            )}

            <div className="md:hidden divide-y divide-[var(--color-border)]">
                {isEmpty ? (
                    <EmptyState
                        icon={hasActiveFilters ? MagnifyingGlass : Buildings}
                        title={hasActiveFilters ? 'Tidak Ada Hasil' : 'Belum Ada Data Kelas'}
                        description={hasActiveFilters
                            ? 'Tidak ditemukan kelas yang cocok dengan filter yang dipilih. Coba ubah kata kunci atau filter lainnya.'
                            : 'Mulai dengan menambah kelas baru atau import data dari file CSV/Excel.'}
                        action={emptyAction}
                        variant="plain"
                    />
                ) : paged.map(cls => (
                    <ClassMobileCard key={cls.id} cls={cls} selectedIds={selectedIds} toggleSelect={toggleSelect} handleEdit={canEdit ? handleEdit : null} handleView={handleView} handleDuplicate={handleDuplicate} handleArchive={handleArchive} setItemToDelete={canEdit ? setItemToDelete : null} setIsDeleteModalOpen={canEdit ? setIsDeleteModalOpen : null} />
                ))}
            </div>
            <Pagination
                totalRows={totalFilteredRows}
                page={page}
                pageSize={pageSize}
                setPage={setPage}
                setPageSize={setPageSize}
                label="kelas"
                jumpPage={jumpPage}
                setJumpPage={setJumpPage}
            />
        </>
    )
})

export default ClassesTable
