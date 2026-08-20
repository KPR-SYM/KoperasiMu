import React, { memo } from 'react'
import { MagnifyingGlass, Plus, User } from '@phosphor-icons/react'
import { EmptyState } from '@shared/components/DataDisplay'
import Checkbox from '@shared/components/Checkbox'
import Pagination from '@shared/components/Pagination'
import StudentRow from '@features/students/components/StudentRow'

const StudentsTable = memo(function StudentsTable({
    paged,
    totalFilteredRows,
    selectedIds,
    toggleSelect,
    allSelected,
    someSelected,
    toggleSelectAll,
    canEdit,
    handleEdit,
    handleView,
    handleAdd,
    loading,
    searchQuery,
    isPrivacyMode,
    maskValue,
    page,
    pageSize,
    setPage,
    setPageSize,
    jumpPage,
    setJumpPage,
}) {
    if (loading) {
        return (
            <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4 p-4 border border-[var(--color-border)] rounded-xl">
                        <div className="w-4 h-4 bg-[var(--color-surface-alt)] rounded" />
                        <div className="w-10 h-10 bg-[var(--color-surface-alt)] rounded-full" />
                        <div className="flex-1 space-y-2">
                            <div className="w-32 h-3 bg-[var(--color-surface-alt)] rounded" />
                            <div className="w-20 h-2 bg-[var(--color-surface-alt)] rounded" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    const isEmpty = totalFilteredRows === 0

    return (
        <>
            <div className="overflow-x-auto">
                {isEmpty ? (
                    <EmptyState
                        icon={searchQuery ? MagnifyingGlass : User}
                        title={searchQuery ? 'Tidak Ada Hasil' : 'Belum Ada Siswa'}
                        description={searchQuery ? 'Tidak ditemukan siswa yang cocok.' : 'Mulai dengan menambah siswa baru.'}
                        action={canEdit && !searchQuery ? (
                            <button onClick={handleAdd} className="h-9 px-4 rounded-xl bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <Plus className="w-3.5 h-3.5" /> Tambah Siswa
                            </button>
                        ) : null}
                        variant="plain"
                    />
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-[var(--color-surface-alt)] sticky top-0 z-10">
                            <tr className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                                <th className="px-6 py-4 w-12 text-center">
                                    <Checkbox checked={allSelected} indeterminate={someSelected && !allSelected} onChange={toggleSelectAll} />
                                </th>
                                <th className="px-6 py-4 text-left">Nama</th>
                                <th className="px-6 py-4 text-left">Kelas</th>
                                <th className="px-6 py-4 text-left">Status</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]/50">
                            {paged.map(student => (
                                <StudentRow
                                    key={student.id}
                                    student={student}
                                    selectedIds={selectedIds}
                                    toggleSelect={toggleSelect}
                                    canEdit={canEdit}
                                    handleEdit={handleEdit}
                                    handleView={handleView}
                                    isPrivacyMode={isPrivacyMode}
                                    maskValue={maskValue}
                                />
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <Pagination
                totalRows={totalFilteredRows}
                page={page}
                pageSize={pageSize}
                setPage={setPage}
                setPageSize={setPageSize}
                label="siswa"
                jumpPage={jumpPage}
                setJumpPage={setJumpPage}
            />
        </>
    )
})

export default StudentsTable
