import React from 'react'
import { MagnifyingGlass, SlidersHorizontal, X } from '@phosphor-icons/react'

const StudentsToolbar = ({
    searchQuery,
    setSearchQuery,
    searchInputRef,
    loading,
    totalRows,
    filterStatus,
    setFilterStatus,
    filterGender,
    setFilterGender,
    isFilterOpen,
    setIsFilterOpen,
    activeFilterCount,
    resetAllFilters,
    selectedIds,
    toggleSelectAll,
    setPage,
}) => {
    return (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
            <div className="flex-1 relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                    placeholder="Cari nama siswa..."
                    className="w-full h-9 pl-9 pr-4 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                        <X className="w-4 h-4 text-[var(--color-text-muted)]" />
                    </button>
                )}
            </div>
            <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`h-9 px-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${isFilterOpen || activeFilterCount > 0 ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30 text-[var(--color-primary)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
            >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filter
                {activeFilterCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-[9px] font-black flex items-center justify-center">{activeFilterCount}</span>
                )}
            </button>
        </div>
    )
}

export default StudentsToolbar
