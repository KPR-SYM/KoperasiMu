import { memo } from 'react'
import { ArrowCounterClockwise, ArrowDown, Bed, Buildings, CheckSquare, Checks, MagnifyingGlass, SlidersHorizontal, UserCheck, Users, X } from '@phosphor-icons/react'
import DebouncedSearchInput from '@shared/components/DebouncedSearchInput'
import Select from '@shared/components/Select'

const ClassesToolbar = memo(function ClassesToolbar({
    searchQuery, setSearchQuery, searchInputRef, loading, totalRows,
    filterLevel, setFilterLevel, filterProgram, setFilterProgram,
    sortBy, setSortBy, filterNoTeacher, setFilterNoTeacher,
    filterCrowded, setFilterCrowded,
    isFilterOpen, setIsFilterOpen, activeFilterCount, resetAllFilters,
    selectedIds, toggleSelectAll,
    LEVELS, PROGRAMS,
    setPage,
}) {
    return (
        <div>
            <div className="flex items-center gap-2 p-2 lg:p-2.5">
                <div className="flex-1 min-w-[120px] transition-all duration-300">
                    <DebouncedSearchInput
                        searchQuery={searchQuery}
                        onSearch={setSearchQuery}
                        inputRef={searchInputRef}
                        isLoading={loading}
                        placeholder="Cari nama kelas, wali kelas, program... (Ctrl+K)"
                    />
                </div>

                {totalRows >= 5 && (
                    <div className="hidden lg:flex flex-none items-center gap-2 overflow-x-auto scrollbar-hide py-0.5 max-w-full">
                        <div className="h-4 w-px bg-[var(--color-border)] mx-1 shrink-0" />

                        <div className="flex items-center gap-1.5 shrink-0">
                            {[
                                { id: '', label: 'Semua', icon: Buildings },
                                { id: 'Boarding', label: 'Boarding', icon: Bed },
                                { id: 'Reguler', label: 'Reguler', icon: Buildings },
                            ].map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => { setFilterProgram(s.id); setPage(1) }}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filterProgram === s.id
                                        ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                                        : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)]'
                                        }`}
                                >
                                    <s.icon className={`w-3 h-3 ${filterProgram === s.id ? 'opacity-100' : 'opacity-30'}`} />
                                    {s.label}
                                </button>
                            ))}
                        </div>

                        <div className="h-4 w-px bg-[var(--color-border)] mx-1 shrink-0" />

                        <div className="flex items-center gap-1.5 shrink-0">
                            {[
                                { id: 'no_teacher', label: 'Tanpa Wali', icon: UserCheck, active: filterNoTeacher, onClick: () => { setFilterNoTeacher(!filterNoTeacher); setPage(1) } },
                                { id: 'crowded', label: 'Padat (>35)', icon: Users, active: filterCrowded, onClick: () => { setFilterCrowded(!filterCrowded); setPage(1) } },
                            ].map((g) => (
                                <button
                                    key={g.id}
                                    onClick={g.onClick}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${g.active
                                        ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                                        : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)]'
                                        }`}
                                >
                                    <g.icon className={`w-3 h-3 ${g.active ? 'opacity-100' : 'opacity-30'}`} />
                                    {g.label}
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

            {/* Active Chips */}
            {(searchQuery || filterLevel || filterProgram || filterNoTeacher || filterCrowded || sortBy !== 'name') && (
                <div className="px-3 pb-3 -mt-1">
                    <div className="flex flex-wrap gap-2">
                        {searchQuery && (
                            <button type="button" onClick={() => setSearchQuery('')}
                                className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/40 text-[10px] font-black text-[var(--color-text)]" title="Hapus pencarian">
                                <MagnifyingGlass className="w-3 h-3 opacity-60" />
                                <span className="max-w-[180px] truncate">"{searchQuery}"</span>
                                <span className="w-5 h-5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] group-hover:text-red-500 transition-colors">
                                    <X className="w-3 h-3" />
                                </span>
                            </button>
                        )}
                        {filterLevel && (
                            <button type="button" onClick={() => setFilterLevel('')}
                                className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 text-[10px] font-black text-[var(--color-primary)]" title="Hapus filter tingkat">
                                Kelas {filterLevel}
                                <span className="w-5 h-5 rounded-lg bg-white/70 dark:bg-[var(--color-surface)] border border-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)] opacity-70 group-hover:opacity-100 transition-opacity">
                                    <X className="w-3 h-3" />
                                </span>
                            </button>
                        )}
                        {filterProgram && (
                            <button type="button" onClick={() => setFilterProgram('')}
                                className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/40 text-[10px] font-black text-[var(--color-text)]" title="Hapus filter program">
                                {filterProgram}
                                <span className="w-5 h-5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] group-hover:text-red-500 transition-colors">
                                    <X className="w-3 h-3" />
                                </span>
                            </button>
                        )}
                        {filterNoTeacher && (
                            <button type="button" onClick={() => setFilterNoTeacher(false)}
                                className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-[10px] font-black text-amber-600" title="Hapus filter tanpa wali">
                                Tanpa Wali
                                <span className="w-5 h-5 rounded-lg bg-white/70 dark:bg-[var(--color-surface)] border border-amber-500/20 flex items-center justify-center text-amber-600 opacity-70 group-hover:opacity-100 transition-opacity">
                                    <X className="w-3 h-3" />
                                </span>
                            </button>
                        )}
                        {filterCrowded && (
                            <button type="button" onClick={() => setFilterCrowded(false)}
                                className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-500/20 bg-blue-500/10 text-[10px] font-black text-blue-600" title="Hapus filter kelas padat">
                                Kelas Padat
                                <span className="w-5 h-5 rounded-lg bg-white/70 dark:bg-[var(--color-surface)] border border-blue-500/20 flex items-center justify-center text-blue-600 opacity-70 group-hover:opacity-100 transition-opacity">
                                    <X className="w-3 h-3" />
                                </span>
                            </button>
                        )}
                        {sortBy !== 'name' && (
                            <button type="button" onClick={() => setSortBy('name')}
                                className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-[10px] font-black text-amber-600" title="Hapus filter urutan">
                                <ArrowDown className="w-3 h-3 opacity-70" />
                                {sortBy === 'level' ? 'Tingkat' : 'Siswa Terbanyak'}
                                <span className="w-5 h-5 rounded-lg bg-white/70 dark:bg-[var(--color-surface)] border border-amber-500/20 flex items-center justify-center text-amber-600 opacity-70 group-hover:opacity-100 transition-opacity">
                                    <X className="w-3 h-3" />
                                </span>
                            </button>
                        )}
                        <button type="button" onClick={resetAllFilters}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-red-500/20 bg-red-500/5 text-[10px] font-black text-red-600" title="Hapus semua filter">
                            <ArrowCounterClockwise className="w-3 h-3" />
                            Hapus semua
                        </button>
                    </div>
                </div>
            )}

            {isFilterOpen && (
                <div className="border-t border-[var(--color-border)] p-3.5 bg-[var(--color-surface-alt)]/60 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-1 h-3.5 bg-[var(--color-primary)] rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] flex items-center gap-2">
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

                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">Tingkat / Grade</label>
                                <Select
                                    value={filterLevel}
                                    onChange={val => { setFilterLevel(val); setPage(1) }}
                                    options={[
                                        { id: '', name: 'Semua Tingkat' },
                                        ...LEVELS.map(l => ({ id: l, name: `Kelas ${l}` }))
                                    ]}
                                    placeholder="Semua Tingkat"
                                    small
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">Program</label>
                                <Select
                                    value={filterProgram}
                                    onChange={val => { setFilterProgram(val); setPage(1) }}
                                    options={[
                                        { id: '', name: 'Semua Program' },
                                        ...PROGRAMS.map(p => ({ id: p, name: p }))
                                    ]}
                                    placeholder="Semua Program"
                                    small
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">Urutkan</label>
                                <Select
                                    value={sortBy}
                                    onChange={val => { setSortBy(val); setPage(1) }}
                                    options={[
                                        { id: 'name', name: 'Nama (A-Z)' },
                                        { id: 'level', name: 'Tingkat' },
                                        { id: 'students', name: 'Populasi Siswa' }
                                    ]}
                                    placeholder="Urutkan"
                                    small
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">List Cepat & Aksi</label>
                            <div className="flex gap-1.5 overflow-x-auto pb-1">
                                {[
                                    { label: 'Semua', icon: Buildings, active: !filterNoTeacher && !filterCrowded, onClick: () => { setFilterNoTeacher(false); setFilterCrowded(false); setSortBy('name') } },
                                    { label: 'Tanpa Wali', icon: UserCheck, active: filterNoTeacher, onClick: () => { setFilterNoTeacher(true); setFilterCrowded(false); setPage(1) } },
                                    { label: 'Kelas Padat', icon: Users, active: filterCrowded, onClick: () => { setFilterCrowded(true); setFilterNoTeacher(false); setPage(1) } },
                                ].map((s, i) => (
                                    <button key={i} onClick={s.onClick} className={`whitespace-nowrap h-9 px-3 rounded-xl border flex items-center gap-2 transition-all ${s.active ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-md shadow-[var(--color-primary)]/20' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]'}`}>
                                        <s.icon className="text-[10px]" /><span className="text-[9px] font-black uppercase tracking-widest">{s.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
})

export default ClassesToolbar
