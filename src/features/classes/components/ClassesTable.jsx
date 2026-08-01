import React, { memo } from 'react'
import { MagnifyingGlass, Plus, X } from '@phosphor-icons/react'
import { ClassRow, ClassMobileCard } from '@features/classes/components/ClassRow'
import Pagination from '@shared/components/Pagination'

const ClassesTable = memo(function ClassesTable({
    paged, totalFilteredRows, selectedIds, toggleSelect, visibleCols,
    allSelected, someSelected, toggleSelectAll,
    handleEdit, setItemToDelete, setIsDeleteModalOpen, isPrivacyMode,
    canEdit, loading, searchQuery, filterLevel, filterProgram,
    filterNoTeacher, filterCrowded, resetAllFilters, handleAdd,
    page, pageSize, setPage, setPageSize, jumpPage, setJumpPage,
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

    const emptyState = totalFilteredRows === 0

    return (
        <>
            <div className="overflow-x-auto whitespace-nowrap hidden md:block">
                <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-[var(--color-surface-alt)] sticky top-0 z-10 border-b border-[var(--color-border)]">
                        <tr className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                            <th className="px-6 py-4 w-12 text-center">
                                <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected }} onChange={toggleSelectAll} className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] accent-[var(--color-primary)] cursor-pointer" />
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
                        {emptyState ? (
                            <tr>
                                <td colSpan={10} className="px-6 py-28 text-center align-middle">
                                    <div className="w-full h-full flex flex-col items-center justify-center text-center mx-auto animate-in fade-in zoom-in-95 duration-700">
                                        <div className="relative mb-6">
                                            <div className="absolute inset-0 bg-[var(--color-primary)]/10 blur-3xl rounded-full scale-150 animate-pulse" />
                                            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-alt)] border border-[var(--color-border)] shadow-xl flex items-center justify-center">
                                                <MagnifyingGlass className="text-4xl text-[var(--color-primary)]/30" />
                                                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-[var(--color-surface)] shadow-lg flex items-center justify-center border border-[var(--color-border)]">
                                                    <X className="text-red-500 w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                        <h3 className="w-5 h-5 font-black text-[var(--color-text)] mb-2">Pencarian Tidak Ditemukan</h3>
                                        <p className="text-xs font-bold text-[var(--color-text-muted)] max-w-sm leading-relaxed mb-6">
                                            Tidak ditemukan kelas yang cocok dengan filter atau database masih kosong.
                                        </p>
                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-4">
                                            {searchQuery || filterLevel || filterProgram || filterNoTeacher || filterCrowded ? (
                                                <button onClick={resetAllFilters} className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] transition">
                                                    Reset Semua Filter
                                                </button>
                                            ) : (
                                                <button onClick={handleAdd} disabled={!canEdit} className="h-9 px-5 rounded-xl bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--color-primary)]/20 hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                                                    <Plus />
                                                    Tambah Kelas Pertama
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : paged.map(cls => (
                            <ClassRow key={cls.id} cls={cls} selectedIds={selectedIds} toggleSelect={toggleSelect} visibleCols={visibleCols} handleEdit={canEdit ? handleEdit : null} setItemToDelete={canEdit ? setItemToDelete : null} setIsDeleteModalOpen={canEdit ? setIsDeleteModalOpen : null} isPrivacyMode={isPrivacyMode} />
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="md:hidden divide-y divide-[var(--color-border)]">
                {emptyState ? (
                    <div className="py-24 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-700">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-[var(--color-primary)]/10 blur-3xl rounded-full scale-150 animate-pulse" />
                            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-alt)] border border-[var(--color-border)] shadow-xl flex items-center justify-center">
                                <MagnifyingGlass className="text-4xl text-[var(--color-primary)]/30" />
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-[var(--color-surface)] shadow-lg flex items-center justify-center border border-[var(--color-border)]">
                                    <X className="text-red-500 w-4 h-4" />
                                </div>
                            </div>
                        </div>
                        <h3 className="w-5 h-5 font-black text-[var(--color-text)] mb-2">Pencarian Tidak Ditemukan</h3>
                        <p className="text-xs font-bold text-[var(--color-text-muted)] max-w-[280px] leading-relaxed mb-6">
                            Tidak ditemukan kelas yang cocok dengan filter atau database masih kosong.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-4">
                            {searchQuery || filterLevel || filterProgram || filterNoTeacher || filterCrowded ? (
                                <button onClick={resetAllFilters} className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] transition">
                                    Reset Semua Filter
                                </button>
                            ) : (
                                <button onClick={handleAdd} disabled={!canEdit} className="h-9 px-5 rounded-xl bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--color-primary)]/20 hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                                    <Plus />
                                    Tambah Kelas Pertama
                                </button>
                            )}
                        </div>
                    </div>
                ) : paged.map(cls => (
                    <ClassMobileCard key={cls.id} cls={cls} selectedIds={selectedIds} toggleSelect={toggleSelect} handleEdit={canEdit ? handleEdit : null} setItemToDelete={canEdit ? setItemToDelete : null} setIsDeleteModalOpen={canEdit ? setIsDeleteModalOpen : null} />
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
