import React, { memo } from 'react'
import { Buildings, MagnifyingGlass, Plus } from '@phosphor-icons/react'
import { ClassRow, ClassMobileCard } from '@features/classes/components/ClassRow'
import { EmptyState } from '@shared/components/DataDisplay'
import Checkbox from '@shared/components/Checkbox'
import Pagination from '@shared/components/Pagination'

const ClassesTable = memo(function ClassesTable({
    paged, totalFilteredRows, selectedIds, toggleSelect, visibleCols,
    allSelected, someSelected, toggleSelectAll,
    handleEdit, handleView, handleDuplicate, handleArchive, setItemToDelete, setIsDeleteModalOpen, isPrivacyMode,
    canEdit, loading, searchQuery, filterLevel, filterProgram,
    filterNoTeacher, filterCrowded, resetAllFilters, handleAdd,
    page, pageSize, setPage, setPageSize, jumpPage, setJumpPage,
    pinnedIds, togglePin,
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
                            <th className="px-6 py-4 text-center pr-6 w-32">Aksi</th>
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
                            <ClassRow key={cls.id} cls={cls} selectedIds={selectedIds} toggleSelect={toggleSelect} visibleCols={visibleCols} handleEdit={canEdit ? handleEdit : null} handleView={handleView} handleDuplicate={handleDuplicate} handleArchive={handleArchive} setItemToDelete={canEdit ? setItemToDelete : null} setIsDeleteModalOpen={canEdit ? setIsDeleteModalOpen : null} isPrivacyMode={isPrivacyMode} pinnedIds={pinnedIds} togglePin={togglePin} />
                        ))}
                    </tbody>
                </table>
            </div>
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
