import React, { memo } from 'react'
import { MagnifyingGlass, Plus, User } from '@phosphor-icons/react'
import { Pagination, EmptyState } from '@shared/components'
import { TeacherRow, TeacherMobileCard } from '@features/teachers/components/TeacherRow'

const TeachersTable = memo(function TeachersTable({
    teachers, totalRows, selectedIds, toggleSelect, visibleCols,
    allSelected, someSelected, toggleSelectAll,
    canEdit, handleEdit, handleTogglePin, handleQuickStatus,
    setTeacherToAction, setIsArchiveModalOpen,
    quickStatusId, setQuickStatusId, quickStatusRef,
    isPrivacyMode, disp, openProfile,
    loading, searchQuery, filterGender, filterSubject, filterType, filterMissing, filterStatus,
    resetAllFilters, handleAdd,
    page, pageSize, setPage, setPageSize,
    jumpPage, setJumpPage,
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

    const hasActiveFilters = !!(searchQuery || filterGender || filterSubject || filterType || filterMissing || (filterStatus && filterStatus !== 'active'))
    const isEmpty = totalRows === 0

    const emptyAction = hasActiveFilters ? (
        <button onClick={resetAllFilters} className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] transition">
            Reset Semua Filter
        </button>
    ) : canEdit ? (
        <button onClick={handleAdd} className="h-9 px-5 rounded-xl bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--color-primary)]/20 hover:brightness-110 transition-all flex items-center gap-2">
            <Plus />
            Tambah Guru
        </button>
    ) : null

    return (
        <>
            {/* Desktop */}
            <div className="overflow-x-auto whitespace-nowrap hidden md:block">
                <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-[var(--color-surface-alt)] sticky top-0 z-10 border-b border-[var(--color-border)]">
                        <tr className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                            <th className="px-6 py-4 w-12 text-center">
                                <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected }} onChange={toggleSelectAll} className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] accent-[var(--color-primary)] cursor-pointer" />
                            </th>
                            <th className="px-6 py-4">Guru</th>
                            {visibleCols.nbm && <th className="px-6 py-4">NBM</th>}
                            {visibleCols.subject && <th className="px-6 py-4">Mata Pelajaran</th>}
                            {visibleCols.gender && <th className="px-6 py-4 text-center">Gender</th>}
                            {visibleCols.contact && <th className="px-6 py-4">Kontak</th>}
                            {visibleCols.status && <th className="px-6 py-4">Status</th>}
                            {visibleCols.join && <th className="px-6 py-4">Bergabung</th>}
                            <th className="px-6 py-4 text-center pr-6 w-32">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isEmpty ? (
                            <tr>
                                <td colSpan={10} className="p-0">
                                    <EmptyState
                                        icon={hasActiveFilters ? MagnifyingGlass : User}
                                        title={hasActiveFilters ? 'Tidak Ada Hasil' : 'Belum Ada Data Guru'}
                                        description={hasActiveFilters
                                            ? 'Tidak ditemukan guru yang cocok dengan filter yang dipilih. Coba ubah kata kunci atau filter lainnya.'
                                            : 'Mulai dengan menambah guru baru atau import data dari file CSV/Excel.'}
                                        action={emptyAction}
                                        variant="plain"
                                    />
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
                {isEmpty ? (
                    <EmptyState
                        icon={hasActiveFilters ? MagnifyingGlass : User}
                        title={hasActiveFilters ? 'Tidak Ada Hasil' : 'Belum Ada Data Guru'}
                        description={hasActiveFilters
                            ? 'Tidak ditemukan guru yang cocok dengan filter yang dipilih. Coba ubah kata kunci atau filter lainnya.'
                            : 'Mulai dengan menambah guru baru atau import data dari file CSV/Excel.'}
                        action={emptyAction}
                        variant="plain"
                    />
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
        </>
    )
})

export default TeachersTable
