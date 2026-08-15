import React, { memo } from 'react'
import { ArrowCounterClockwise, Archive, ChatCircle, CheckCircle, CheckSquare, Checks, Hourglass, MagnifyingGlass, SlidersHorizontal, Suitcase, Users, X, XCircle, ChalkboardTeacher } from '@phosphor-icons/react'
import { DebouncedSearchInput, Select } from '@shared/components'

const STATUS_CHIPS = [
    { id: '', label: 'Semua', icon: Users },
    { id: 'active', label: 'Aktif', icon: CheckCircle },
    { id: 'inactive', label: 'Nonaktif', icon: XCircle },
    { id: 'cuti', label: 'Cuti', icon: Hourglass },
]

const TYPE_CHIPS = [
    { id: 'guru', label: 'Guru', icon: ChalkboardTeacher },
    { id: 'karyawan', label: 'Karyawan', icon: Suitcase },
]

const TeachersToolbar = memo(function TeachersToolbar({
    searchQuery, setSearchQuery, searchInputRef, loading, totalRows,
    isFilterOpen, setIsFilterOpen,
    activeFilterCount, resetAllFilters,
    filterStatus, setFilterStatus,
    filterGender, setFilterGender,
    filterSubject, setFilterSubject,
    filterType, setFilterType,
    filterMissing, setFilterMissing,
    sortBy, setSortBy,
    subjectsList,
    selectedIds, toggleSelectAll,
    setPage,
}) {
    return (
        <div>
            {/* Main Search Bar */}
            <div className="flex items-center gap-2 p-2 lg:p-2.5">
                <div className="flex-1 min-w-[120px] transition-all duration-300">
                    <DebouncedSearchInput
                        searchQuery={searchQuery}
                        onSearch={setSearchQuery}
                        inputRef={searchInputRef}
                        isLoading={loading}
                        placeholder="Cari nama guru, mapel, no. HP... (Ctrl+K)"
                    />
                </div>

                {totalRows >= 5 && (
                    <div className="hidden lg:flex flex-none items-center gap-2 overflow-x-auto scrollbar-hide py-0.5 max-w-full">
                        <div className="h-4 w-px bg-[var(--color-border)] mx-1 shrink-0" />

                        <div className="flex items-center gap-1.5 shrink-0">
                            {STATUS_CHIPS.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => { setFilterStatus(s.id); setPage(1) }}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filterStatus === s.id
                                        ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                                        : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)]'
                                        }`}
                                >
                                    <s.icon className={`w-3 h-3 ${filterStatus === s.id ? 'opacity-100' : 'opacity-30'}`} />
                                    {s.label}
                                </button>
                            ))}
                        </div>

                        <div className="h-4 w-px bg-[var(--color-border)] mx-1 shrink-0" />

                        <div className="flex items-center gap-1.5 shrink-0">
                            {TYPE_CHIPS.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => { setFilterType(filterType === t.id ? '' : t.id); setPage(1) }}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filterType === t.id
                                        ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                                        : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)]'
                                        }`}
                                >
                                    <t.icon className={`w-3 h-3 ${filterType === t.id ? 'opacity-100' : 'opacity-30'}`} />
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="hidden lg:block w-px h-4 bg-[var(--color-border)] mx-2 shrink-0" />

                <div className="flex items-center justify-end gap-2 shrink-0 lg:ml-auto">
                    <button
                        onClick={toggleSelectAll}
                        className={`h-8 px-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 ${selectedIds.length > 0 ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]'} `}
                        title="Pilih Semua / Batal"
                    >
                        {selectedIds.length > 0 ? <Checks className="w-3 h-3" /> : <CheckSquare className="w-3 h-3" />}
                        <span className="hidden xs:inline">{selectedIds.length > 0 ? 'Terpilih' : 'Pilih'}</span>
                        {selectedIds.length > 0 && (
                            <span className="w-4 h-4 rounded-full bg-white/20 text-white text-[9px] font-black flex items-center justify-center">
                                {selectedIds.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`h-8 px-2.5 sm:px-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 ${isFilterOpen || activeFilterCount > 0 ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/30' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]'} `}
                    >
                        <SlidersHorizontal className="w-3 h-3" />
                        <span className="hidden xs:inline">Lainnya</span>
                        {activeFilterCount > 0 && (
                            <span className="w-4 h-4 rounded-full bg-white/30 text-white text-[9px] font-black flex items-center justify-center">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Active Filter Chips */}
            {(searchQuery || filterSubject || filterGender || (filterStatus && filterStatus !== 'active') || filterType || filterMissing) && (
                <div className="px-3 pb-3 -mt-1">
                    <div className="flex flex-wrap gap-2">
                        {searchQuery && (
                            <button type="button" onClick={() => setSearchQuery('')}
                                className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/40 text-[10px] font-black text-[var(--color-text)]">
                                <MagnifyingGlass className="w-3 h-3 opacity-60" />
                                <span className="max-w-[180px] truncate">"{searchQuery}"</span>
                                <span className="w-5 h-5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] group-hover:text-red-500 transition-colors">
                                    <X className="w-3 h-3" />
                                </span>
                            </button>
                        )}
                        {filterSubject && (
                            <button type="button" onClick={() => setFilterSubject('')}
                                className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 text-[10px] font-black text-[var(--color-primary)]">
                                {filterSubject}
                                <span className="w-5 h-5 rounded-lg bg-white/70 border border-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)] opacity-70 group-hover:opacity-100 transition-opacity">
                                    <X className="w-3 h-3" />
                                </span>
                            </button>
                        )}
                        {filterGender && (
                            <button type="button" onClick={() => setFilterGender('')}
                                className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/40 text-[10px] font-black text-[var(--color-text)]">
                                {filterGender === 'L' ? 'Putra' : 'Putri'}
                                <span className="w-5 h-5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] group-hover:text-red-500 transition-colors">
                                    <X className="w-3 h-3" />
                                </span>
                            </button>
                        )}
                        {filterStatus && filterStatus !== 'active' && (
                            <button type="button" onClick={() => setFilterStatus('')}
                                className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-[10px] font-black text-amber-600">
                                {(filterStatus?.charAt(0).toUpperCase() || '') + (filterStatus?.slice(1) || '')}
                                <span className="w-5 h-5 rounded-lg bg-white/70 border border-amber-500/20 flex items-center justify-center text-amber-600 opacity-70 group-hover:opacity-100 transition-opacity">
                                    <X className="w-3 h-3" />
                                </span>
                            </button>
                        )}
                        {filterType && (
                            <button type="button" onClick={() => setFilterType('')}
                                className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-[10px] font-black text-indigo-600">
                                {filterType === 'guru' ? 'Guru' : 'Karyawan'}
                                <span className="w-5 h-5 rounded-lg bg-white/70 border border-indigo-500/20 flex items-center justify-center text-indigo-600 opacity-70 group-hover:opacity-100 transition-opacity">
                                    <X className="w-3 h-3" />
                                </span>
                            </button>
                        )}
                        {filterMissing && (
                            <button type="button" onClick={() => setFilterMissing('')}
                                className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-orange-500/20 bg-orange-500/10 text-[10px] font-black text-orange-600">
                                {filterMissing === 'wa' ? 'Tanpa WA' : filterMissing}
                                <span className="w-5 h-5 rounded-lg bg-white/70 border border-orange-500/20 flex items-center justify-center text-orange-600 opacity-70 group-hover:opacity-100 transition-opacity">
                                    <X className="w-3 h-3" />
                                </span>
                            </button>
                        )}
                        <button type="button" onClick={resetAllFilters}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-red-500/20 bg-red-500/5 text-[10px] font-black text-red-600">
                            <ArrowCounterClockwise className="w-3 h-3" />
                            Reset semua
                        </button>
                    </div>
                </div>
            )}

            {/* Advanced Filter Panel */}
            {isFilterOpen && (
                <div className="border-t border-[var(--color-border)] p-3.5 bg-[var(--color-surface-alt)]/60 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-1 h-3.5 bg-indigo-500 rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
                                <SlidersHorizontal className="w-3 h-3 opacity-60" />
                                Filter Lanjutan
                            </span>
                        </div>
                        <button
                            onClick={resetAllFilters}
                            className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 border border-transparent hover:border-red-100"
                        >
                            <ArrowCounterClockwise className="w-3 h-3" />
                            Reset Semua Filter
                        </button>
                    </div>

                    <div className="flex flex-wrap items-end gap-2">
                        <div className="flex-1 min-w-[140px]">
                            <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">Jenis</label>
                            <Select
                                value={filterType}
                                onChange={val => { setFilterType(val); setPage(1) }}
                                options={[
                                    { id: '', name: 'Semua Jenis' },
                                    { id: 'guru', name: 'Guru' },
                                    { id: 'karyawan', name: 'Karyawan' },
                                    { id: 'kepsek', name: 'Kepala Sekolah' },
                                    { id: 'tu', name: 'Tata Usaha' },
                                ]}
                                placeholder="Semua Jenis"
                                small
                            />
                        </div>
                        <div className="flex-1 min-w-[140px]">
                            <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">Mata Pelajaran</label>
                            <Select
                                value={filterSubject}
                                onChange={val => { setFilterSubject(val); setPage(1) }}
                                options={[
                                    { id: '', name: 'Semua Mapel' },
                                    ...subjectsList.map(s => ({ id: s, name: s }))
                                ]}
                                placeholder="Semua Mapel"
                                small
                                searchable
                            />
                        </div>
                        <div className="flex-1 min-w-[120px]">
                            <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">Gender</label>
                            <Select
                                value={filterGender}
                                onChange={val => { setFilterGender(val); setPage(1) }}
                                options={[
                                    { id: '', name: 'Semua' },
                                    { id: 'L', name: 'Laki-laki' },
                                    { id: 'P', name: 'Perempuan' }
                                ]}
                                placeholder="Semua"
                                small
                            />
                        </div>
                        <div className="flex-1 min-w-[120px]">
                            <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">Status</label>
                            <Select
                                value={filterStatus}
                                onChange={val => { setFilterStatus(val); setPage(1) }}
                                options={[
                                    { id: '', name: 'Semua Status' },
                                    { id: 'active', name: 'Aktif' },
                                    { id: 'inactive', name: 'Nonaktif' },
                                    { id: 'cuti', name: 'Cuti' }
                                ]}
                                placeholder="Semua Status"
                                small
                            />
                        </div>
                        <div className="flex-1 min-w-[120px]">
                            <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">Urutkan</label>
                            <Select
                                value={sortBy}
                                onChange={val => { setSortBy(val); setPage(1) }}
                                options={[
                                    { id: 'name_asc', name: 'Nama A-Z' },
                                    { id: 'name_desc', name: 'Nama Z-A' },
                                    { id: 'subject_asc', name: 'Mapel A-Z' },
                                    { id: 'join_desc', name: 'Bergabung Terbaru' },
                                    { id: 'join_asc', name: 'Bergabung Terlama' }
                                ]}
                                placeholder="Urutkan"
                                small
                            />
                        </div>
                        <div className="flex gap-1.5 shrink-0 pb-0.5">
                            {[
                                { label: 'Semua', icon: Users, active: !filterMissing && filterStatus === 'active', onClick: () => { setFilterMissing(''); setFilterStatus('active'); setSortBy('name_asc') } },
                                { label: 'Tanpa WA', icon: ChatCircle, active: filterMissing === 'wa', onClick: () => { setFilterMissing('wa'); setPage(1) } },
                                { label: 'Nonaktif', icon: Archive, active: filterStatus === 'inactive', onClick: () => { setFilterStatus('inactive'); setPage(1) } },
                                { label: 'Cuti', icon: Archive, active: filterStatus === 'cuti', onClick: () => { setFilterStatus('cuti'); setPage(1) } },
                            ].map((s, i) => (
                                <button key={i} onClick={s.onClick} className={`whitespace-nowrap h-8 px-2.5 rounded-lg border flex items-center gap-1.5 transition-all text-[9px] font-black uppercase tracking-widest ${s.active ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-md shadow-[var(--color-primary)]/20' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]'}`}>
                                    <s.icon className="w-3 h-3" /><span>{s.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
})

export default TeachersToolbar
