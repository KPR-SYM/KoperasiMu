import React, { memo } from 'react'
import { MagnifyingGlass, Plus, User } from '@phosphor-icons/react'
import { EmptyState } from '@shared/components/DataDisplay'
import Checkbox from '@shared/components/Checkbox'
import Pagination from '@shared/components/Pagination'
import { TeacherRow, TeacherMobileCard } from '@features/teachers/components/TeacherRow'

const COL_LABELS = {
    subject: "Mata Pelajaran",
    gender: "Gender",
    contact: "Kontak",
    status: "Status",
    join: "Bergabung",
}

const TeachersTable = memo(function TeachersTable({
    teachers, totalRows, selectedIds, toggleSelect, visibleCols, columnOrder,
    allSelected, someSelected, toggleSelectAll,
    canEdit, handleEdit, handleView, handleTogglePin, handleQuickStatus,
    onHistory, setTeacherToAction, setIsArchiveModalOpen,
    quickStatusId, setQuickStatusId, quickStatusRef,
    disp, isPrivacyMode,
    loading, searchQuery, filterGender, filterSubject, filterType, filterMissing, filterStatus,
    resetAllFilters, handleAdd,
    page, pageSize, setPage, setPageSize,
    jumpPage, setJumpPage,
    // Column menu props (menu itself rendered by shared ColumnMenuPortal in TeachersPage)
    colMenuRef, isColMenuOpen, setIsColMenuOpen, setColMenuPos,
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
                                <th className="px-6 py-4"><div className="flex items-center justify-center"><div className="w-10 h-3 bg-[var(--color-border)] rounded animate-pulse" /></div></th>
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
                                    <td className="px-6 py-4"><div className="flex items-center justify-center gap-1"><div className="w-6 h-6 bg-[var(--color-surface-alt)] rounded-lg" /><div className="w-6 h-6 bg-[var(--color-surface-alt)] rounded-lg" /></div></td>
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

    const handleColMenuToggle = (e) => {
        if (!setIsColMenuOpen || !setColMenuPos) return
        const rect = e.currentTarget.getBoundingClientRect()
        const menuHeight = 240
        const spaceBelow = window.innerHeight - rect.bottom
        const showUp = spaceBelow < menuHeight && rect.top > menuHeight
        setColMenuPos({
            top: showUp ? rect.top + window.scrollY - menuHeight - 8 : rect.bottom + window.scrollY + 8,
            right: window.innerWidth - rect.right - window.scrollX,
            showUp,
        })
        setIsColMenuOpen(p => !p)
    }

    return (
        <>
            {/* Desktop */}
            <div className="overflow-x-auto whitespace-nowrap hidden md:block">
                <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-[var(--color-surface-alt)] sticky top-0 z-10 border-b border-[var(--color-border)]">
                        <tr className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                            <th className="px-6 py-4 w-12 text-center">
                                <Checkbox checked={allSelected} indeterminate={someSelected && !allSelected} onChange={toggleSelectAll} />
                            </th>
                            <th className="px-6 py-4">Guru</th>
                            {(columnOrder || Object.keys(COL_LABELS)).filter(k => visibleCols[k] && COL_LABELS[k]).map(key => (
                                <th key={key} className={`px-6 py-4 ${key === 'subject' || key === 'contact' || key === 'status' || key === 'join' ? '' : 'text-center'}`}>{COL_LABELS[key]}</th>
                            ))}
                            {/* Aksi header with column menu toggle */}
                            <th className="px-6 py-4 relative">
                                <div className="flex items-center justify-center">
                                    <span>Aksi</span>
                                </div>
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
                                columnOrder={columnOrder}
                                disp={disp}
                                handleView={handleView}
                                handleEdit={canEdit ? handleEdit : null}
                                handleTogglePin={handleTogglePin}
                                handleQuickStatus={handleQuickStatus}
                                onHistory={onHistory}
                                setTeacherToAction={canEdit ? setTeacherToAction : null}
                                setIsArchiveModalOpen={canEdit ? setIsArchiveModalOpen : null}
                                quickStatusId={quickStatusId}
                                setQuickStatusId={setQuickStatusId}
                                quickStatusRef={quickStatusRef}
                                isPrivacyMode={isPrivacyMode}
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
                        handleView={handleView}
                        handleEdit={canEdit ? handleEdit : null}
                        handleTogglePin={handleTogglePin}
                        onHistory={onHistory}
                        setTeacherToAction={canEdit ? setTeacherToAction : null}
                        setIsArchiveModalOpen={canEdit ? setIsArchiveModalOpen : null}
                        isPrivacyMode={isPrivacyMode}
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
